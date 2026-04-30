import { OpenRouterService } from "../../services/openrouterService.ts"
import { Neo4jService } from "../../services/neo4jService.ts"
import type { GraphState } from "../graph.ts"
import { CypherQuerySchema, getSystemPrompt, getUserPromptTemplate } from "../../prompts/v1/cypherGenerator.ts"
import { SALES_CONTEXT } from "../../prompts/v1/salesContext.ts"

function getCurrentStepQuestion(state: GraphState) {
  // Se a questão não for complexa o suficiente para ser decomposta,
  // ou se não houver subquestões,
  // ou se o currentStep for indefinido, então não há questão atual para responder
  if (!state.isMultiStep || !state.subQuestions?.length || state.currentStep === undefined) {
    return null
  }

  // Se o currentStep for maior ou igual ao número de subquestões, então todas as subquestões já foram
  // respondidas, e não há questão atual para responder
  if (state.currentStep >= state.subQuestions.length) {
    return null
  }

  return {
    question: state.subQuestions[state.currentStep],
    // Incrementa o currentStep para a próxima questão
    stepNumber: state.currentStep + 1
  }
}

export function createCypherGeneratorNode(llmClient: OpenRouterService, neo4jService: Neo4jService) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    try {
      const stepInfo = getCurrentStepQuestion(state)
      const targetQuestion = stepInfo?.question ?? state.question!
      if (stepInfo) {
        const totalSteps = state.subQuestions?.length ?? 0
        console.log(`🤖 Generating Cypher query for step ${stepInfo.stepNumber}/${totalSteps}: "${targetQuestion}"`)
      } else {
        console.log("🤖 Generating Cypher query...")
      }

      const schema = await neo4jService.getSchema()
      const systemPrompt = await getSystemPrompt(schema, SALES_CONTEXT)
      const userPrompt = await getUserPromptTemplate(targetQuestion)

      const { data, error } = await llmClient.generateStructured(systemPrompt, userPrompt, CypherQuerySchema)

      if (error) {
        return {
          error: `Failed to generate query: ${error ?? "Unknown error"}`
        }
      }
      console.log(`✅ Generated Cypher query: ${data?.query}`)

      // Se a questão é complexa e possui subquestões, passamos a query gerada para o array de subQueries, e o
      // processo continua para a próxima subquestão
      if (state.isMultiStep && state.subQueries?.length) {
        return {
          query: data?.query,
          subQueries: [...state.subQueries, data?.query ?? ""]
        }
      }

      // Se a questão não é complexa, ou se já estamos na última subquestão, a query gerada é a query final para o
      // processo de execução
      return {
        query: data?.query
      }
    } catch (error: any) {
      console.error("Error generating Cypher query:", error.message)
      return {
        ...state,
        error: `Failed to generate query: ${error.message}`
      }
    }
  }
}
