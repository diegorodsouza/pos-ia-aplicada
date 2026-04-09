import { AIMessage } from "langchain";
import { type GraphState } from "../graph.ts";

// O node "chatResponse" é responsável por gerar uma resposta com base na intenção identificada. 
export function chatResponseNode(state: GraphState): GraphState {
    // Ele recebe o output do node anterior, que contém a mensagem processada de acordo com a intenção do usuário, 
    // e cria uma nova mensagem de resposta usando a classe AIMessage do Langchain.
    const responseText = state.output

    // A classe AIMessage é necessária para que se possa visualizar a resposta gerada no LangGraph, pois ela é 
    // reconhecida como uma mensagem válida dentro do sistema.
    const aiMessage = new AIMessage(responseText)

    return {
        ...state,
        messages: [
            ...state.messages,
            aiMessage,
        ]
    }

}