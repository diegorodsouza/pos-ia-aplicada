import { type GraphState } from "../graph.ts";

// O node "identifyIntent" é responsável por analisar a mensagem de entrada e identificar a intenção do usuário.
//  Ele recebe o estado atual do grafo, que inclui as mensagens de entrada, e retorna um novo estado com a 
// intenção identificada.
export function identifyIntent(state: GraphState): GraphState {


    // A função começa extraindo a última mensagem de entrada do estado, convertendo-a para minúsculas 
    // para facilitar a comparação. 
    const input = state.messages.at(-1)?.text ?? ""
    const inputLower = input.toLowerCase()

    // Em seguida, ela inicializa a variável "command" com o valor "unknown", definindo um estado default 
    // indicando que a intenção do usuário ainda não foi identificada.
    let command: GraphState['command'] = 'unknown'

    
    // A função então verifica se a mensagem de entrada contém as palavras "upper" ou "lower". Se a mensagem contiver "upper", a intenção é definida como "uppercase". Se a mensagem contiver "lower", a intenção é definida como "lowercase". Caso contrário, a intenção permanece como "unknown".
    if(inputLower.includes('upper')) {
        command = 'uppercase'
    } else if (inputLower.includes('lower')) {
        command = 'lowercase'
    }

    // Por fim, a função retorna um novo estado do grafo, que inclui a intenção identificada e a mensagem de entrada original como saída.
    return {
        ...state,
        command,
        output: input
    }

}