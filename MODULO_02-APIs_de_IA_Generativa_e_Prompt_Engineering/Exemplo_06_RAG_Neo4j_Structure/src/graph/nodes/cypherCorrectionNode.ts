import { OpenRouterService } from "../../services/openrouterService.ts"
import { Neo4jService } from "../../services/neo4jService.ts"
import type { GraphState } from "../graph.ts"
import { getSystemPrompt, getUserPromptTemplate, CypherCorrectionSchema } from "../../prompts/v1/cypherCorrection.ts"

export function createCypherCorrectionNode(llmClient: OpenRouterService, neo4jService: Neo4jService) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    try {
      console.log(`🔄 Attempting to correct Cypher query. Validation error: ${state.validationError}`)

      const schema = await neo4jService.getSchema()
      const systemPrompt = getSystemPrompt(schema)

      const userPrompt = getUserPromptTemplate(
        state.query!,
        state.validationError!, // Garantimos que a validationError esteja presente no estado, já que essa node só deve ser executada quando há um erro de validação
        state.question
      )

      const { data, error } = await llmClient.generateStructured(systemPrompt, userPrompt, CypherCorrectionSchema)

      if (error || !data?.correctedQuery) {
        console.error(`❌ Error generating corrected Cypher query: ${error ?? "Unknown error"}`)
        return {
          ...state,
          error: `Query correction failed: ${error ?? "Unknown error"}`
          // Incrementamos o número de tentativas de correção mesmo em caso de falha na geração da correção, para evitar loops infinitos de correção em casos de falhas recorrentes
          // correctionAttempts: (state.correctionAttempts ?? 0) + 1, 
          // Resetamos a flag de necessidade de correção para evitar loops de correção infinitos em caso de falhas recorrentes
          // needsCorrection: false 
        }
      }

      console.log(
        `✅ Generated corrected Cypher query:\n${data?.explanation}\nCorrected Query:\n${data?.correctedQuery}`
      )

      // Atualizamos a query no estado com a query corrigida, e resetamos a flag de necessidade de correção para
      // que a node de execução de Cypher tente executar a query corrigida

      return {
        ...state,
        query: data?.correctedQuery,
        // Armazenamos a query original para referência futura, caso ainda não esteja armazenada
        originalQuery: state.originalQuery ?? state.query, 
        // Incrementamos o número de tentativas de correção para monitoramento e controle de loops de correção
        correctionAttempts: (state.correctionAttempts ?? 0) + 1, 
        // Resetamos a flag de necessidade de correção para que a próxima execução tente rodar a query corrigida,
        needsCorrection: false, 
        // Limpamos o erro de validação anterior, já que estamos tentando corrigir a query
        validationError: undefined 
      }
    } catch (error: any) {
      console.error("Error correcting query:", error.message)
      return {
        ...state,
        error: `Query correction failed: ${error.message}`
      }
    }
  }
}
