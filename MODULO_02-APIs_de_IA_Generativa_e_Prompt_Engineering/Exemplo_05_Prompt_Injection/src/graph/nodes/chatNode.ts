import type { GraphState } from "../state.ts"
import { AIMessage } from "@langchain/core/messages"
import { OpenRouterService } from "../../services/openrouterService.ts"
import { PromptTemplate } from "@langchain/core/prompts"
import { getUser, prompts } from "../../config.ts"

export const createChatNode = (openRouterService: OpenRouterService) => {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    try {
      if (!state.user) {
        // Simulando um usuário convidado (guest) para o caso de não haver um usuário autenticado. Em um cenário 
        // real, isso poderia ser tratado de forma diferente, como redirecionar para uma página de login ou 
        // fornecer acesso limitado.
        state.user = getUser("guest")!
        // Habilita as guardrails para este usuário
        state.guardrailsEnabled = true
      }

      // Recupera a última mensagem do usuário
      const userPrompt = state.messages.at(-1)?.text || ""
      // Formata o prompt do sistema usando as informações do usuário através do PromptTemplate
      const template = PromptTemplate.fromTemplate(prompts.system)
      // Busca o prompt do sistema formatado, inserindo o papel e nome do usuário que vem da definição na
      // src/index.ts
      const systemPrompt = await template.format({
        USER_ROLE: state.user.role,
        USER_NAME: state.user.displayName
      })
      // OBS: utilizar prompts.system.replace ao invés do PromptTemplate é mais propenso a erros, pois pode não
      // substituir todas as ocorrências ou causar problemas de formatação, especialmente se o prompt for
      // complexo ou tiver múltiplas variáveis. O PromptTemplate é projetado para lidar com esses casos de forma
      // mais robusta e eficiente.

      const response = await openRouterService.generate(systemPrompt, userPrompt)

      return {
        messages: [new AIMessage(response)]
      }
    } catch (error) {
      console.error("Chat node error:", error)
      return {
        messages: [
          new AIMessage("I apologize, but I encountered an error processing your request. Please try again later.")
        ]
      }
    }
  }
}
