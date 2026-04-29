import { PromptTemplate } from "@langchain/core/prompts"
import { OpenRouterService } from "../../services/openrouterService.ts"
import type { GraphState } from "../state.ts"
import { prompts } from "../../config.ts"

export const createGuardrailsCheckNode = (openRouterService: OpenRouterService) => {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    try {
      // Busca a ultima mensagem do usuario
      const lastMessage = state.messages.at(-1)?.text || ""

      // Formata o prompt do sistema usando as informações do usuário através do PromptTemplate
      const template = PromptTemplate.fromTemplate(prompts.system)
      // Busca o prompt do sistema formatado, inserindo o papel e nome do usuário que vem da definição na
      // src/index.ts
      const systemPrompt = await template.format({
        USER_ROLE: state.user.role,
        USER_NAME: state.user.displayName
      })

      const msg = systemPrompt.concat("\n").concat(lastMessage)

      const result = await openRouterService.checkGuardRails(msg, state.guardrailsEnabled)

      return {
        guardrailCheck: result
      }
    } catch (error) {
      console.error("Guardrails check failed:", error)

      return {
        guardrailCheck: {
          safe: false,
          reason: "Guardrails check failed due to an error."
        }
      }
    }
  }
}
