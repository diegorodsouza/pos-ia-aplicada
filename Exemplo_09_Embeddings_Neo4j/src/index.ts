import { DocumentProcessor } from "./documentProcessor.ts"
import { CONFIG } from "./config.ts"
import { type PretrainedOptions } from "@huggingface/transformers"
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers"
import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector"
import { displayResults } from "./util.ts"

let _neo4jVectorStore = null

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

  const documentProcessor = new DocumentProcessor(CONFIG.pdf.path, CONFIG.textSplitter)

  const documents = await documentProcessor.loadAndSplit()
  const embeddings = new HuggingFaceTransformersEmbeddings({
    model: CONFIG.embedding.modelName,
    pretrainedOptions: CONFIG.embedding.pretrainedOptions as PretrainedOptions
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

  _neo4jVectorStore = await Neo4jVectorStore.fromExistingGraph(embeddings, CONFIG.neo4j)

  clearAll(_neo4jVectorStore, CONFIG.neo4j.nodeLabel)

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
  for (const question of questions) {
    console.log(`\n${"=".repeat(50)}`)
    console.log(`📌 Pergunta: "${question}"`)
    console.log(`${"=".repeat(50)}`)

    const results = await _neo4jVectorStore.similaritySearch(question, CONFIG.similarity.topK)

    displayResults(results)

    // Cleanup
    console.log(`\n${"=".repeat(80)}`)
    console.log("✅ Processamento concluído com sucesso!\n")
  }
} catch (error) {
  console.error("Error:", error)
} finally {
  await _neo4jVectorStore?.close()
}
