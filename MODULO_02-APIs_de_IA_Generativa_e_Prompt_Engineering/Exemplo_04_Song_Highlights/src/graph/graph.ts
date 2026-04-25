import { StateGraph, START, END, MessagesZodMeta } from "@langchain/langgraph"
import { withLangGraph } from "@langchain/langgraph/zod"
import { z } from "zod/v3"

import type { BaseMessage } from "@langchain/core/messages"
import { OpenRouterService } from "../services/openrouterService.ts"
import { createChatNode } from "./nodes/chatNode.ts"
import { createSummarizationNode } from "./nodes/summarizationNode.ts"
import { createSavePreferencesNode } from "./nodes/savePreferencesNode.ts"
import { routeAfterChat, routeAfterSavePreferences } from "./nodes/edgeConditions.ts"
import { type PreferencesService } from "../services/preferencesService.ts"
import { type MemoryService } from "../services/memoryService.ts"

const ChatStateAnnotation = z.object({
  messages: withLangGraph(z.custom<BaseMessage[]>(), MessagesZodMeta),
  userContext: z.string().optional(),
  extractedPreferences: z.any().optional(),
  needsSummarization: z.boolean().optional(),
  conversationSummary: z.any().optional(),
  userId: z.string().optional()
})

export type GraphState = z.infer<typeof ChatStateAnnotation>

export function buildChatGraph(
  llmClient: OpenRouterService,
  preferencesService: PreferencesService,
  memoryService: MemoryService
) {
  const graph = new StateGraph(ChatStateAnnotation)
    .addNode("chat", createChatNode(llmClient, preferencesService))

    // Preferências do usuário são informações extraídas durante a conversa que podem ser úteis para personalizar recomendações
    // musicais, como gêneros favoritos, artistas preferidos, ou até mesmo o humor atual do usuário. Armazenar essas preferências
    // permite que o sistema aprenda e se adapte ao longo do tempo, oferecendo sugestões mais relevantes e personalizadas em
    // interações futuras.
    .addNode("savePreferences", createSavePreferencesNode(preferencesService))

    // A função de sumarização é importante para manter o contexto da conversa gerenciável, especialmente em interações longas.
    // Ela ajuda a condensar as informações essenciais, permitindo que o modelo de linguagem se concentre nos pontos mais relevantes
    // para gerar respostas mais precisas e coerentes, sem perder o fio da conversa.
    .addNode("summarize", createSummarizationNode(llmClient, preferencesService))

    .addEdge(START, "chat")

    // Aqui avaliamos se precisamos extrair as preferências do usuário ou resumir a conversa antes de continuar
    .addConditionalEdges("chat", routeAfterChat, {
      savePreferences: "savePreferences",
      summarize: "summarize",
      end: END
    })

    // Após salvar as preferências, podemos optar por resumir a conversa para atualizar o contexto ou seguir direto para o
    // fim da interação
    .addConditionalEdges("savePreferences", routeAfterSavePreferences, {
      summarize: "summarize",
      end: END
    })

    .addEdge("summarize", END)

  return graph.compile({
    checkpointer: memoryService.checkpointer,
    store: memoryService.store
  })
}
