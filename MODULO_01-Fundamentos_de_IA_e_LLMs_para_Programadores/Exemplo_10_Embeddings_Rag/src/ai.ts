import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { RunnableSequence } from "@langchain/core/runnables"
import { ChatOpenAI } from "@langchain/openai"

type DebugLog = (...args: unknown[]) => void
type params = {
  debugLog: DebugLog
  vectorStore: Neo4jVectorStore
  nlpModel: ChatOpenAI
  promptConfig: any
  templateText: string
  topK: number
}

interface ChainState {
  question: string
  context?: string
  topScore?: number
  error?: string
  answer?: string
}

export class AI {
  private params: params
  constructor(params: params) {
    this.params = params
  }

  // O método retrieveVectorSearchResults é responsável por buscar no vector
  // store do Neo4j os documentos mais relevantes para a pergunta do usuário
  async retrieveVectorSearchResults(input: ChainState): Promise<ChainState> {
    this.params.debugLog("🔍 Buscando no vector store do Neo4j...")

    // O método similaritySearchWithScore retorna uma lista de tuplas [documento, score]
    const vectorResults = await this.params.vectorStore.similaritySearchWithScore(input.question, this.params.topK)

    // Se não houver resultados, retornamos um erro amigável para o usuário
    if (!vectorResults.length) {
      this.params.debugLog("⚠️  Nenhum resultado encontrado no vector store.")
      return {
        ...input,
        error: "Desculpe, não encontrei informações relevantes sobre essa pergunta na base de conhecimento."
      }
    }

    // topScore é o score do resultado mais relevante, que pode ser útil para 
    // debug ou para ajustar a resposta da IA
    // Como vectorResults é uma lista de tuplas [documento, score], 
    // acessamos o score do primeiro resultado com vectorResults[0]![1]
    // pois o primeiro elemento da tupla é o documento e o segundo é o score
    // e o operador ! é usado para garantir ao TypeScript que vectorResults[0] 
    // não é undefined
    const topScore = vectorResults[0]![1]

    // Logamos o número de resultados encontrados e o melhor score para debug
    this.params.debugLog(
      `✅ Encontrados ${vectorResults.length} resultados relevantes (melhor score: ${topScore.toFixed(3)})`
    )

    // Construímos o contexto para a IA concatenando os conteúdos dos 
    // documentos encontrados filtrados por um score mínimo (ex: > 0.5)
    // e separados por um delimitador (---) para melhor legibilidade
    const contexts = vectorResults
      .filter(([, score]) => score > 0.5)
      .map(([doc]) => doc.pageContent)
      .join("\n\n---\n\n")

    return {
      ...input,
      context: contexts,
      topScore
    }
  }

  // O método generateNLPResponse é responsável por gerar a resposta da IA 
  // usando o modelo de linguagem ChatOpenAI e o template de prompt definido
  // em CONFIG.templateText
  async generateNLPResponse(input: ChainState): Promise<ChainState> {
    // Se houve um erro na etapa anterior (ex: nenhum resultado encontrado),
    // não tentamos gerar uma resposta e retornamos o erro para o usuário
    if (input.error) return input

    this.params.debugLog("🤖 Gerando resposta com IA...")

    // Criamos um prompt dinâmico usando o template definido em CONFIG.templateText
    // O template pode conter variáveis como {question}, {context}, {tone}, etc.
    // que serão preenchidas com os valores correspondentes do input e do promptConfig
    const responsePrompt = ChatPromptTemplate.fromTemplate(this.params.templateText)

    // O responseChain armazena a sequência de operações para gerar a resposta 
    // da IA, onde o prompt é preenchido com os valores e passado para o 
    // modelo de linguagem, que gera a resposta bruta
    // A função pipe é usada para encadear as operações de forma fluida, onde 
    // a saída de uma etapa é a entrada da próxima
    const responseChain = responsePrompt.pipe(this.params.nlpModel).pipe(new StringOutputParser())

    // Invocamos o chain passando um objeto com as variáveis necessárias para preencher
    // o prompt, como a pergunta do usuário, o contexto dos documentos relevantes, 
    // e as instruções de formatação e tom definidas em promptConfig
    // A função invoke serve para executar a sequência de operações definida no responseChain e 
    // obter a resposta final da IA
    const rawResponse = await responseChain.invoke({
      role: this.params.promptConfig.role,
      task: this.params.promptConfig.task,
      tone: this.params.promptConfig.constraints.tone,
      language: this.params.promptConfig.constraints.language,
      format: this.params.promptConfig.constraints.format,
      instructions: this.params.promptConfig.instructions
        .map((instruction: string, idx: number) => `${idx + 1}. ${instruction}`)
        .join("\n"),
      question: input.question,
      context: input.context
    })

    return {
      ...input,
      answer: rawResponse
    }
  }

  // O método answerQuestion é o ponto de entrada para responder a uma pergunta do usuário,
  // onde encadeamos as etapas de busca por similaridade e geração de resposta usando RunnableSequence, 
  // que é um método da LangChain para criar pipelines de processamento de forma simples e organizada. 
  // Ele recebe a pergunta do usuário, executa as etapas definidas e retorna a resposta final ou um erro 
  // amigável caso algo dê errado.
  async answerQuestion(question: string) {

    // O RunnableSequence.from é usado para criar uma sequência de operações onde cada etapa é definida por um 
    // método da classe AI, e a saída de uma etapa é passada como entrada para a próxima. 
    // Neste caso, primeiro buscamos os resultados relevantes no vector store do Neo4j e depois geramos a resposta 
    // da IA com base nesses resultados.
    const chain = RunnableSequence.from([
      this.retrieveVectorSearchResults.bind(this),
      this.generateNLPResponse.bind(this)
    ])

    // Por fim, invocamos o chain passando a pergunta do usuário como entrada inicial, e logamos a pergunta 
    // e a resposta para debug.
    // Nesse caso, novamente utilizamos o invoke pois ele é responsável por executar a sequência de operações
    // definida no chain e retornar o resultado final, que pode conter a resposta da IA ou um erro caso algo 
    // dê errado durante o processo.
    const result = await chain.invoke({ question })
    this.params.debugLog("\n🎙️  Pergunta:")
    this.params.debugLog(question, "\n")
    this.params.debugLog("💬 Resposta:")
    this.params.debugLog(result.answer || result.error, "\n")

    return result
  }
}
