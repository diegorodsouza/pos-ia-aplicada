import { StateGraph, START, END } from "@langchain/langgraph"
import { SafeguardStateAnnotation, type GraphState } from "./state.ts"
import { createGuardrailsCheckNode } from "./nodes/guardrailsCheckNode.ts"
import { createChatNode } from "./nodes/chatNode.ts"
import { blockedNode } from "./nodes/blockedNode.ts"
import { routeAfterGuardrails } from "./nodes/edgeConditions.ts"
import { OpenRouterService } from "../services/openrouterService.ts"

export function buildChatGraph() {
  const service = new OpenRouterService()
  const workflow = new StateGraph({
    stateSchema: SafeguardStateAnnotation
  })

    // Guardrails é uma camada de segurança adicional que verifica se a entrada do usuário é apropriada antes de
    // permitir que o chatbot responda. Se a entrada for considerada inadequada, o fluxo é redirecionado para um
    // nó de bloqueio, caso contrário, continua para o nó de chat.
    .addNode("guardrails_check", createGuardrailsCheckNode(service))
    .addNode("chat", createChatNode(service))
    .addNode("blocked", blockedNode)

    // Set entry point
    .addEdge(START, "guardrails_check")

    // Define conditional edge after guardrails check
    .addConditionalEdges("guardrails_check", (state: GraphState) => routeAfterGuardrails(state), {
      chat: "chat",
      blocked: "blocked"
    })

    // Both chat and blocked nodes end the flow
    .addEdge("chat", END)
    .addEdge("blocked", END)

  return workflow.compile()
}
