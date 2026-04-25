import type { Runtime } from "@langchain/langgraph"
import { OpenRouterService } from "../../services/openrouterService.ts"
import type { GraphState } from "../graph.ts"
import { ChatResponseSchema, getSystemPrompt, getUserPromptTemplate } from "../../prompts/v1/chatResponse.ts"
import { AIMessage, HumanMessage } from "langchain"
import { PreferencesService } from "../../services/preferencesService.ts"
import { config } from "../../config.ts"

export function createChatNode(llmClient: OpenRouterService, preferencesService: PreferencesService) {
  return async (state: GraphState, runtime?: Runtime): Promise<Partial<GraphState>> => {
    const userId = String(runtime?.context?.userId || state.userId || "unknown")

    const userContext = state.userContext ?? (await preferencesService.getBasicInfo(userId))

    const systemPrompt = getSystemPrompt(userContext)

    const conversationHistory = state.messages
      ?.map((msg) => `${HumanMessage.isInstance(msg) ? "Usuário" : "AI"}: ${msg.content}`)
      .join("\n")

    const userMessage = state.messages?.at(-1)?.text || ""

    const userPrompt = getUserPromptTemplate(userMessage, conversationHistory)

    const result = await llmClient.generateStructured(systemPrompt, userPrompt, ChatResponseSchema)

    if (!result.success || !result.data) {
      console.error("Falha ao gerar resposta estruturada:", result.error)
      return {
        // Podemos optar por manter o estado inalterado ou adicionar uma mensagem de erro para o usuário
        messages: [new AIMessage("Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.")]
      }
    }

    const response = result.data

    // Calculate if summarization is needed based on total message count
    // After summarization, we keep 2 messages (1 user + 1 AI)
    // So we trigger summarization when we have 6+ messages (3 exchanges)
    // This gives: initial 2 + 4 new messages = 6 messages total

    const totalMessages = state.messages.length
    const needsSummarization = totalMessages >= config.maxMessagesToSummary

    return {
      messages: [new AIMessage(response.message)],
      extractedPreferences: response.shouldSavePreferences ? response.preferences : undefined,
      needsSummarization
    }
  }
}
