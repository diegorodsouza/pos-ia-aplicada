import config from "../../config.ts"
import { Neo4jService } from "../../services/neo4jService.ts"
import type { GraphState } from "../graph.ts"

async function executeQuery(query: string, neo4jService: Neo4jService) {
  try {
    const isValid = await neo4jService.validateQuery(query)

    // Se a query não for válida, retornamos um erro específico para indicar que a validação falhou
    if (!isValid) {
      return {
        results: null,
        error: "Query validation failed - syntax or structure issues detected"
      }
    }

    const results = await neo4jService.query(query)

    // Se a execução da query for bem-sucedida, mas não retornar resultados, isso pode indicar um problema semântico (ex: a query é válida, mas não corresponde a nenhum dado no banco)
    if (!results.length) {
      return {
        results: [],
        error: "No results found for the given query"
      }
    }

    // Se a execução for bem-sucedida e retornar resultados, retornamos os resultados sem erro
    return {
      results,
      error: null
    }
  } catch (error) {
    return {
      results: null,
      error: `Error executing query: ${error instanceof Error ? error.message : error}`
    }
  }
}

function hasMoreSteps(state: GraphState) {
  if (!state.isMultiStep || !state.subQuestions?.length || state.currentStep === undefined) {
    return false
  }

  return state.currentStep < state.subQuestions.length
}

function handleMultiStepProgression(state: GraphState, results: any[]) {
  // Definimos updatedSubResults como o array de subResultados atual +  novos resultados da execução da query
  // atual, para manter um histórico completo dos resultados de cada subquestão
  const updatedSubResults = [...(state.subResults ?? []), results]
  // Incrementamos o currentStep para avançar para a próxima subquestão
  const nextStep = (state.currentStep ?? 0) + 1

  const multiStepState = {
    ...state,
    dbResults: results,
    subResults: updatedSubResults,
    currentStep: nextStep,
    needsCorrection: false // Resetamos a necessidade de correção a cada nova execução para evitar loops de correção desnecessários
  }

  // Parte apenas para exibir logs mais informativos sobre o progresso do processo multi-step, indicando
  // claramente quando estamos avançando para a próxima subquestão ou quando todas as subquestões foram
  // executadas e o processo segue para a geração da resposta analítica consolidada.
  const totalSteps = state.subQuestions?.length ?? 0
  console.log(`✅ Sub-question ${nextStep}/${totalSteps} executed successfully. Results stored.`)
  if (hasMoreSteps({ ...state, ...multiStepState })) {
    console.log(`➡️ Moving to next sub-question (Step ${nextStep + 1})/${totalSteps}...`)
    return multiStepState
  }
  console.log(`🎉 All sub-questions executed. Proceeding to analytical response generation.`)
  return multiStepState
}

export function createCypherExecutorNode(neo4jService: Neo4jService) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    try {
      const { results, error } = await executeQuery(state.query!, neo4jService)

      // Validamos se for null pois se for vazio não significa necessariamente que houve um erro na execução, mas
      // que não foram encontrados dados correspondentes à query
      if (error && results === null) {
        if ((state.correctionAttempts ?? 0) <= config.maxCorrectionAttempts) {
          console.log("⚠️ Will attempt to correct the query...")
          return {
            ...state,
            validationError: error,
            originalQuery: state.originalQuery ?? state.query,
            needsCorrection: true
          }
        }

        return {
          ...state,
          error: `Failed to execute query: ${error}`
        }
      }

      // Validando os sucessos: Se a query é complexa e há subQuestions com passos a seguir
      if (state.isMultiStep && state.subQuestions?.length && state.currentStep !== undefined) {
        const multiStepState = handleMultiStepProgression(state, results!)
        return {
          ...state,
          ...multiStepState
        }
      }

      // Validando os sucessos: Se apenas não foram encontrados resultados para a query,
      if (!results?.length) {
        return {
          ...state,
          dbResults: [],
          error: "Query executed successfully but returned no results"
        }
      }

      return {
        ...state,
        dbResults: results,
        needsCorrection: false
        // Garantimos que, em caso de sucesso, a flag de necessidade de correção seja resetada para evitar loops
        // desnecessários
      }
    } catch (error) {
      console.error("Error executing Cypher query:", error instanceof Error ? error.message : error)

      return {
        ...state,
        error: "Invalid Cypher query - correction failed"
      }
    }
  }
}
