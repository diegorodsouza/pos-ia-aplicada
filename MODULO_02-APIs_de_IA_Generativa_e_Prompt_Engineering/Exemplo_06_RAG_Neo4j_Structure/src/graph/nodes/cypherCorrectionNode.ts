import { OpenRouterService } from "../../services/openrouterService.ts"
import { Neo4jService } from "../../services/neo4jService.ts"
import type { GraphState } from "../graph.ts"
import { CypherCorrectionSchema, getSystemPrompt, getUserPromptTemplate } from "../../prompts/v1/cypherCorrection.ts"

export function createCypherCorrectionNode(llmClient: OpenRouterService, neo4jService: Neo4jService) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    try {
      console.log("🔧 Auto-correcting Cypher query...")
      const schema = await neo4jService.getSchema()
      const systemPrompt = getSystemPrompt(schema)
      const userPrompt = getUserPromptTemplate(state.query!, state.validationError!, state.question)

      const { data, error } = await llmClient.generateStructured(systemPrompt, userPrompt, CypherCorrectionSchema)
      if (error) {
        return {
          ...state,
          error: `Query correction failed: ${error ?? "Unknown error"}`
        }
      }

      console.log(`✅ Query corrected: ${data?.explanation}`)

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
        validationError: undefined,
        // Limpamos o erro de validação anterior, já que estamos tentando corrigir a query
        needsCorrection: false
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
