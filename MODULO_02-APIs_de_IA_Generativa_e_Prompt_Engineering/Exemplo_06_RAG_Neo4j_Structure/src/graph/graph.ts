import { StateGraph, START, END, MessagesZodMeta } from "@langchain/langgraph"
import { withLangGraph } from "@langchain/langgraph/zod"

import { z } from "zod/v3"
import type { BaseMessage } from "@langchain/core/messages"

import { Neo4jService } from "../services/neo4jService.ts"
import { OpenRouterService } from "../services/openrouterService.ts"

import { createCypherGeneratorNode } from "./nodes/cypherGeneratorNode.ts"
import { createCypherExecutorNode } from "./nodes/cypherExecutorNode.ts"
import { createCypherCorrectionNode } from "./nodes/cypherCorrectionNode.ts"
import { createQueryPlannerNode } from "./nodes/queryPlannerNode.ts"
import { createAnalyticalResponseNode } from "./nodes/analyticalResponseNode.ts"
import { createExtractQuestionNode } from "./nodes/extractQuestionNode.ts"

const SalesStateAnnotation = z.object({
  // Input
  messages: withLangGraph(z.custom<BaseMessage[]>(), MessagesZodMeta),
  question: z.string().optional(),

  // Cypher generation
  query: z.string().optional(),
  originalQuery: z.string().optional(),

  // Query execution
  dbResults: z.array(z.any()).optional(),

  // Self-correction
  correctionAttempts: z.number().optional(),
  validationError: z.string().optional(),
  needsCorrection: z.boolean().optional(),

  // Multi-step decomposition
  isMultiStep: z.boolean().optional(),
  subQuestions: z.array(z.string()).optional(),
  currentStep: z.number().optional(),
  subQueries: z.array(z.string()).optional(),
  subResults: z.array(z.array(z.any())).optional(),

  // Response generation
  answer: z.string().optional(),
  followUpQuestions: z.array(z.string()).optional(),

  // Error handling
  error: z.string().optional()
})

export type GraphState = z.infer<typeof SalesStateAnnotation>

export function buildSalesGraph(llmClient: OpenRouterService, neo4jService: Neo4jService) {
  const workflow = new StateGraph({
    stateSchema: SalesStateAnnotation
  })
    .addNode("extractQuestion", createExtractQuestionNode())
    .addNode("queryPlanner", createQueryPlannerNode(llmClient))
    .addNode("cypherGenerator", createCypherGeneratorNode(llmClient, neo4jService))
    .addNode("cypherExecutor", createCypherExecutorNode(neo4jService))
    .addNode("cypherCorrection", createCypherCorrectionNode(llmClient, neo4jService))
    .addNode("analyticalResponse", createAnalyticalResponseNode(llmClient))

    // Começa buscando entender a pergunta do usuário para que seja gerada a melhor query para o caso
    .addEdge(START, "extractQuestion")

    // Caso ocorra algum erro na extração da pergunta, provavelmente será por um erro externo, como de OpenRouter
    // (ex: limite de tokens, timeout, etc), então paramos o processo
    .addConditionalEdges("extractQuestion", (state: GraphState) => {
      if (state.error) return END
      return "queryPlanner"
    })

    // Caso extraia com sucesso, parte para o planejamento da query, onde o modelo pode decidir se é necessário
    // decompor a questão em subquestões ou não, e quais informações são necessárias para gerar a query Cypher
    // correta
    .addEdge("queryPlanner", "cypherGenerator")

    // Depois de gerar a query, ela é executada
    .addEdge("cypherGenerator", "cypherExecutor")

    // Se a execução falhar por algum motivo (ex: erro de sintaxe, problema de conexão, etc), o modelo tem a chance de corrigir a query e tentar novamente - mas só tentará corrigir uma vez para evitar loops infinitos
    .addConditionalEdges("cypherExecutor", (state: GraphState) => {
      if (state.needsCorrection && (!state.correctionAttempts || state.correctionAttempts < 1)) {
        return "cypherCorrection"
      }

      // Se a execução for bem-sucedida, o modelo pode optar por gerar uma resposta analítica diretamente ou, se
      // a questão for complexa e tiver sido decomposta em subquestões, pode optar por gerar queries para cada
      // subquestão e depois consolidar os resultados em uma resposta final
      if (state.isMultiStep && state.subQuestions && state.currentStep !== undefined) {
        if (state.currentStep < state.subQuestions.length) {
          return "cypherGenerator"
        }
      }

      return "analyticalResponse"
    })

    // Se a correção for necessária, o modelo tentará corrigir a query com base no erro de validação e nas
    // informações disponíveis, e depois a query corrigida retornará para a fila de execução
    .addEdge("cypherCorrection", "cypherExecutor")

    // Apos a execução bem-sucedida da query (ou das queries, no caso de questões decompostas), o modelo gera uma
    // resposta analítica para o usuário, que pode incluir insights derivados dos dados, explicações sobre os
    // resultados, e sugestões de follow-up
    .addEdge("analyticalResponse", END)

  return workflow.compile()
}
