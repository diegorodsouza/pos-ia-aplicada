import { END, MessagesZodMeta, START, StateGraph } from "@langchain/langgraph"
import { withLangGraph } from "@langchain/langgraph/zod"
import { BaseMessage } from "langchain"
import { z } from "zod/v3"
import { identifyIntent } from "./nodes/identifyIntentNode.ts"
import { chatResponseNode } from "./nodes/chatResponseNode.ts"
import { upperCaseNode } from "./nodes/upperCaseNode.ts"
import { lowerCaseNode } from "./nodes/lowerCaseNode.ts"
import { fallbackNode } from "./nodes/fallbackNode.ts"

const GraphState = z.object({
  messages: withLangGraph(z.custom<BaseMessage[]>(), MessagesZodMeta),
  output: z.string(),
  command: z.enum(["uppercase", "lowercase", "unknown"])
})

export type GraphState = z.infer<typeof GraphState>

export function buildGraph() {
  const workflow = new StateGraph({
    stateSchema: GraphState
  })

    // Os nodes são as unidades de processamento do grafo, onde cada um tem uma função específica. 

    // Exemplo: o node "identifyIntent" é responsável por analisar a mensagem de entrada e 
    // identificar a intenção do usuário, enquanto o node "chatResponse" gera uma resposta com base na 
    // intenção identificada.
    .addNode("identifyIntent", identifyIntent)
    .addNode("chatResponse", chatResponseNode)

    // Os nós "uppercase", "lowercase" e "fallback" tem a função de processar a mensagem de 
    // acordo com a intenção identificada, transformando a mensagem para maiúscula, minúscula ou 
    // retornando uma resposta padrão
    .addNode("uppercase", upperCaseNode)
    .addNode("lowercase", lowerCaseNode)
    .addNode("fallback", fallbackNode)

    // As arestas definem a ordem de execução dos nodes, ou seja, como os dados fluem de um node para outro. 

    // Exemplo: a aresta inicia com o node "identifyIntent", que processa a mensagem de entrada e, 
    // com base na intenção identificada, direciona o fluxo para os nodes "uppercase", "lowercase" ou "fallback".
    // Após o processamento nesses nodes, o fluxo segue para o node "chatResponse", que gera a resposta final.
    .addEdge(START, "identifyIntent")
    .addConditionalEdges(
      "identifyIntent",
      (state: GraphState) => {
        switch (state.command) {
          case "uppercase":
            return "uppercase"
          case "lowercase":
            return "lowercase"
          default:
            return "fallback"
        }
      },
      {
        uppercase: "uppercase",
        lowercase: "lowercase",
        fallback: "fallback"
      }
    )
    .addEdge("uppercase", "chatResponse")
    .addEdge("lowercase", "chatResponse")
    .addEdge("fallback", "chatResponse")

    .addEdge("chatResponse", END)

  return workflow.compile()
}
