import { DocumentProcessor } from "./documentProcessor.ts"
import { CONFIG } from "./config.ts"
import { type PretrainedOptions } from "@huggingface/transformers"
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers"
import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector"
import { ChatOpenAI } from "@langchain/openai"
import { AI } from "./ai.ts"
import { mkdir, writeFile } from "node:fs/promises"

let _neo4jVectorStore = null

// Função para limpar o banco de dados Neo4j antes de adicionar novos documentos
async function clearAll(vectorStore: Neo4jVectorStore, nodeLabel: string): Promise<void> {
  console.log("🗑️  Limpando o banco de dados Neo4j...")
  try {
    await vectorStore.query(`MATCH (n:\`${nodeLabel}\`) DETACH DELETE n`)
  } catch (error) {
    console.error("Error clearing Neo4j database:", error)
  }
  console.log("🗑️  Banco de dados Neo4j limpo.\n")
}

try {
  console.log("🚀 Inicializando sistema de Embeddings com Neo4j...\n")

  // Etapa 1: Processamento de documentos e criação do vector store
  // o DocumentProcessor é responsável por carregar o PDF e dividir em chunks de texto
  const documentProcessor = new DocumentProcessor(CONFIG.pdf.path, CONFIG.textSplitter)

  const documents = await documentProcessor.loadAndSplit()
  // Criamos a instância de embeddings usando o modelo especificado na configuração
  // O HuggingFaceTransformersEmbeddings é uma implementação de embeddings que utiliza modelos da Hugging Face via 
  // Transformers.js de forma local, sem depender de APIs externas
  const embeddings = new HuggingFaceTransformersEmbeddings({
    model: CONFIG.embedding.modelName,
    pretrainedOptions: CONFIG.embedding.pretrainedOptions as PretrainedOptions
  })

  // nlpModel é a instância do modelo de linguagem que será usado para gerar respostas
  const nlpModel = new ChatOpenAI({
    temperature: CONFIG.openRouter.temperature,
    maxRetries: CONFIG.openRouter.maxRetries,
    modelName: CONFIG.openRouter.nlpModel,
    openAIApiKey: CONFIG.openRouter.apiKey,
    configuration: {
      baseURL: CONFIG.openRouter.url,
      defaultHeaders: CONFIG.openRouter.defaultHeaders
    }
  })

  /* Exemplo de como obter o embedding para uma consulta ou um
   * documento específico
   */

  // const response = await embeddings.embedQuery("JavaScript")
  // console.log("Embedding for 'JavaScript':", response)

  /* Exemplo de como obter o embedding para um conjunto de documentos ou
   * consultas
   */

  // const response = await embeddings.embedDocuments(["JavaScript"])
  // console.log("Embedding for 'JavaScript':", response)


  // Criamos o vector store do Neo4j a partir do grafo existente, usando os embeddings gerados
  _neo4jVectorStore = await Neo4jVectorStore.fromExistingGraph(embeddings, CONFIG.neo4j)

  // Limpamos o banco de dados Neo4j para evitar duplicação de documentos caso o script seja executado mais de uma vez
  clearAll(_neo4jVectorStore, CONFIG.neo4j.nodeLabel)

  // Adicionamos os documentos processados ao vector store do Neo4j, que irá gerar os embeddings e 
  // armazenar as relações de similaridade 
  for (const [index, document] of documents.entries()) {
    console.log(`✅ Adicionando documento ${index + 1}/${documents.length}...`)
    await _neo4jVectorStore.addDocuments([document])
  }
  console.log("\n✅ Todos os documentos processados e armazenados no Neo4j.\n")


  // ==================== ETAPA 2 : BUSCA POR SIMILARIDADE ====================
  console.log("🔍 Etapa 2: Realizando busca por similaridade...\n")
  const questions = [
    "O que são tensores e como são representados em JavaScript?",
    "Como converter objetos JavaScript em tensores?",
    "O que é normalização de dados e por que é necessária?",
    "Como funciona uma rede neural no TensorFlow.js?",
    "O que significa treinar uma rede neural?",
    "o que é hot enconding e quando usar?"
  ]

  const ai = new AI({
    nlpModel,
    debugLog: console.log,
    vectorStore: _neo4jVectorStore,
    promptConfig: CONFIG.promptConfig,
    templateText: CONFIG.templateText,
    topK: CONFIG.similarity.topK
  })

  // Para cada pergunta, buscamos os documentos mais relevantes no vector store do Neo4j e geramos uma 
  // resposta usando o modelo de linguagem
  // É assim que implementamos a abordagem RAG (Retrieval-Augmented Generation), onde a IA é "aumentada" 
  // com informações relevantes recuperadas de uma base de conhecimento (neste caso, o Neo4j)
  for (const index in questions) {
    const question = questions[index]
    console.log(`\n${"=".repeat(80)}`)
    console.log(`📌 PERGUNTA: ${question}`)
    console.log("=".repeat(80))
    const result = await ai.answerQuestion(question!)
    if (result.error) {
      console.log(`\n❌ Erro: ${result.error}\n`)
      continue
    }

    console.log(`\n${result.answer}\n`)

    // Salvamos a resposta gerada em um arquivo Markdown para referência futura através do módulo 
    // fs/promises do Node.js, criando a pasta de saída se ela não existir (por isso usamos { recursive: true }) 
    // e nomeando o arquivo com base na pergunta, índice e timestamp para evitar sobrescritas
    await mkdir(CONFIG.output.answersFolder, { recursive: true })

    const fileName = `${CONFIG.output.answersFolder}/${CONFIG.output.fileName}-${index}-${Date.now()}.md`

    await writeFile(fileName, result.answer!)
  }

  // Cleanup
  console.log(`\n${"=".repeat(80)}`)
  console.log("✅ Processamento concluído com sucesso!\n")
} catch (error) {
  console.error("Error:", error)
} finally {
  // Garantimos que a conexão com o Neo4j seja fechada corretamente, mesmo em caso de erros, 
  // para evitar vazamentos de recursos
  await _neo4jVectorStore?.close()
}
