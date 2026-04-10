import { config } from "../config.ts"
import { AppointmentService } from "../services/appointmentService.ts"
import { OpenRouterService } from "../services/openRouterService.ts"
import { buildAppointmentGraph } from "./graph.ts"


// A Factory é responsável por criar e configurar as instâncias necessárias para construir o grafo de estados do fluxo de agendamento 
// de consultas médicas. Ela instancia o cliente do modelo (OpenRouterService) e o serviço de agendamento (AppointmentService), e 
// então utiliza esses serviços para construir o grafo de estados específico para o domínio médico, definindo os nós, as transições e 
// as regras de roteamento com base nas intenções identificadas.
export function buildGraph() {
  const llmClient = new OpenRouterService(config)
  const appointmentService = new AppointmentService()

  return buildAppointmentGraph(llmClient, appointmentService)
}

export const graph = async () => {
  return buildGraph()
}

export default graph
