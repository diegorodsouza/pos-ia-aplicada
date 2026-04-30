import config from "../../config.ts"
import { Neo4jService } from "../../services/neo4jService.ts"
import type { GraphState } from "../graph.ts"

async function executeQuery(query: string, neo4jService: Neo4jService) {
  try {
    // Se a query não for válida, retornamos um erro específico para indicar que a validação falhou
    const isValid = await neo4jService.validateQuery(query)
    if (!isValid) {
      return {
        results: null,
        error: "Query validation failed - syntax or structure error"
      }
    }

    // Se a execução da query for bem-sucedida, mas não retornar resultados, isso pode indicar um problema semântico
    // (ex: a query é válida, mas não corresponde a nenhum dado no banco)
    const results = await neo4jService.query(query)
    if (!results.length) {
      return {
        results: [],
        error: "No results found"
      }
    }

    // Se a execução for bem-sucedida e retornar resultados, retornamos os resultados sem erro
    console.log(`✅ Retrieved ${results.length} result(s)`)
    return {
      results,
      error: null
    }
  } catch (error: any) {
    return {
      results: null,
      error: error?.message ?? "Query execution error"
    }
  }
}

function hasMoreSteps(state: GraphState): boolean {
  if (!state.isMultiStep || !state.subQuestions?.length || state.currentStep === undefined) {
    return false
  }

  return state.currentStep < state.subQuestions.length
}

function handleMultiStepProgression(state: GraphState, results: any[]) {
  // Definimos updatedSubResults como o array de subResultados atual +  novos resultados da execução da query
  // atual, para manter um histórico completo dos resultados de cada subquestão
  const updatedSubResults = [...(state.subResults ?? []), ...results]
  // Incrementamos o currentStep para avançar para a próxima subquestão
  const nextStep = (state.currentStep ?? 0) + 1
  const multiStepState = {
    dbResults: results,
    subResults: updatedSubResults,
    currentStep: nextStep,
    // Resetamos a necessidade de correção a cada nova execução para evitar loops de correção desnecessários
    needsCorrection: false
  }

  // Parte apenas para exibir logs mais informativos sobre o progresso do processo multi-step, indicando
  // claramente quando estamos avançando para a próxima subquestão ou quando todas as subquestões foram
  // executadas e o processo segue para a geração da resposta analítica consolidada.
  const totalSteps = state.subQuestions?.length ?? 0
  console.log(`✅ Step ${multiStepState.currentStep}/${totalSteps} completed`)
  if (hasMoreSteps({ ...state, ...multiStepState })) {
    console.log(`➡️  Moving to step ${nextStep}...`)
    return multiStepState
  }

  console.log(`✅ All ${totalSteps} steps completed - synthesizing results`)
  return multiStepState
}

export function createCypherExecutorNode(neo4jService: Neo4jService) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    try {
      const { results, error } = await executeQuery(state.query!, neo4jService)
      // Validamos se for null pois se for vazio não significa necessariamente que houve um erro na execução, mas
      // que não foram encontrados dados correspondentes à query
      if (error && results === null) {
        if ((state.correctionAttempts ?? 0) < config.maxCorrectionAttempts) {
          console.log("🔍 Will attempt to auto-correct query...")
          return {
            validationError: error,
            originalQuery: state.originalQuery ?? state.query,
            needsCorrection: true
          }
        }

        return {
          ...state,
          error: "Invalid Cypher query - correction failed"
        }
      }

      // Validando os sucessos: Se a query é complexa e há subQuestions com passos a seguir
      if (state.isMultiStep && state.subQuestions?.length && state.currentStep !== undefined) {
        const multiStepState = handleMultiStepProgression(state, results!)
        return {
          ...multiStepState
        }
      }
      // Validando os sucessos: Se apenas não foram encontrados resultados para a query
      if (!results?.length) {
        return {
          dbResults: [],
          error: "No results found"
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
