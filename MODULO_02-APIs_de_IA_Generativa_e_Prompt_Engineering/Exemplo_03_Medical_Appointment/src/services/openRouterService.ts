import { ChatOpenAI } from "@langchain/openai"
import { config, type ModelConfig } from "../config.ts"
import { z } from "zod/v3"
import { createAgent, providerStrategy } from "langchain"

export class OpenRouterService {
  private config: ModelConfig
  private llmClient: ChatOpenAI

  constructor(configOverride?: ModelConfig) {
    this.config = configOverride ?? config
    this.llmClient = new ChatOpenAI({
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
  }
}
