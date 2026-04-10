import { ChatOpenAI } from "@langchain/openai"
import { config, type ModelConfig } from "../config.ts"
import { z } from "zod/v3"
import { createAgent, HumanMessage, providerStrategy, SystemMessage } from "langchain"

export class OpenRouterService {
  private config: ModelConfig
  private llmClient: ChatOpenAI

  constructor(configOverride?: ModelConfig) {
    this.config = configOverride ?? config
    this.llmClient = new ChatOpenAI({
      apiKey: this.config.apiKey,
      modelName: this.config.models[0],
      temperature: this.config.temperature,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": this.config.httpReferer,
          "X-Title": this.config.xTitle
        }
      },

      // Aqui vai a configuração específica para roteamento de modelos, indicando quais modelos estão disponíveis
      // e as regras de roteamento
      modelKwargs: {
        models: this.config.models,
        provider: this.config.provider
      }
    })
  }

  // O método generateStructured é uma função personalizada que utiliza a capacidade de geração de respostas estruturadas do modelo,
  // permitindo que a IA retorne dados formatados de acordo com um esquema definido (usando Zod para validação).
  async generateStructured<T>(systemPrompt: string, userPrompt: string, schema: z.ZodSchema<T>) {
    try {
      const agent = createAgent({
        // model é a SDK do modelo
        model: this.llmClient,

        // tools são MCPs (Model Capabilities Providers) que podem ser usados para estender as capacidades do modelo,
        // como acessar APIs externas, bancos de dados, etc.
        tools: [],

        // responseFormat define o formato da resposta esperada do modelo, usando providerStrategy para indicar que queremos uma
        // resposta estruturada que deve ser validada contra o esquema Zod fornecido.
        // Os modelos do OpenRouter que suportam uma resposta estruturada podem ser listados em:
        // https://openrouter.ai/models?fmt=cards&supported_parameters=response_format
        responseFormat: providerStrategy(schema)
      })

      const messages = [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)]

      const data = await agent.invoke({ messages })

      // Se a resposta for bem-sucedida e validada contra o esquema, retornamos os dados estruturados. 
      // Caso contrário, capturamos o erro e retornamos uma resposta de falha.
      // A própria IA é responsável por formatar a resposta de acordo com o esquema definido, e se a resposta não estiver no formato 
      // esperado, o providerStrategy irá falhar, permitindo que tratemos isso como um caso de erro.
      return {
        success: true,
        data: data.structuredResponse
      }
    } catch (error) {
      console.error("Error in generateStructured (OpenRouterService):", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
}
