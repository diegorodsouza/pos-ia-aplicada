import { getSystemPrompt, getUserPromptTemplate, IntentSchema } from "../../prompts/v1/identifyIntent.ts"
import { professionals } from "../../services/appointmentService.ts"
import { OpenRouterService } from "../../services/openRouterService.ts"
import type { GraphState } from "../graph.ts"
import { z } from "zod/v3"

export function createIdentifyIntentNode(llmClient: OpenRouterService) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    console.log(`🔍 Identifying intent...`)
    const input = state.messages.at(-1)!.text

    try {
      const systemPrompt = getSystemPrompt(professionals)
      const userPrompt = getUserPromptTemplate(input)

      // O método generateStructured é responsável por enviar o prompt para o modelo e receber uma resposta estruturada de acordo com
      // o esquema definido (IntentSchema). Ele utiliza a capacidade de geração de respostas estruturadas do modelo, permitindo que a
      // IA retorne dados formatados de maneira consistente, facilitando a extração das informações relevantes para o fluxo de
      // agendamento de consultas médicas.
      const result = await llmClient.generateStructured(systemPrompt, userPrompt, IntentSchema as any)

      // Se houver um erro na geração ou validação da resposta, o nó captura o erro e define a intenção como "unknown", permitindo que
      // o fluxo trate adequadamente os casos em que a intenção não pôde ser identificada.
      if (!result.success) {
        console.log(`⚠️  Intent identification failed: ${result.error}`)
        return {
          intent: "unknown",
          error: result.error
        }
      }

      // Em caso de sucesso, as informações de intenção são extraídas e retornadas para serem usadas nos próximos nós do grafo.
      const intentData = result.data!
      console.log(`✅ Intent identified: ${intentData.intent}`)

      // Aqui retornamos o intentData ao inves do state completo, para evitar poluição do estado com dados desnecessários.
      // O intentData já contém as informações relevantes para os próximos nós do grafo, como o nome do paciente, o profissional,
      // a data e hora, etc. O state possuia outras informações como o histórico de mensagens, que não são necessárias para
      // os próximos passos
      return {
        ...intentData
      }
    } catch (error) {
      console.error("❌ Error in identifyIntent node:", error)
      return {
        ...state,
        intent: "unknown",
        error: error instanceof Error ? error.message : "Intent identification failed"
      }
    }
  }
}
