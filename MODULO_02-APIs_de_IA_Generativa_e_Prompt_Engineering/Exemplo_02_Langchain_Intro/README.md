# LangChain Intro - Construindo Grafos de Processamento com LangGraph

Nesse exemplo, exploramos a implementação de um **grafo de processamento de linguagem natural** utilizando LangGraph. O objetivo é demonstrar como construir fluxos complexos de processamento usando uma abordagem orientada a grafos, onde cada nó representa uma unidade de processamento e as arestas definem o fluxo de dados entre eles. Isso permite criar pipelines estruturados e facilmente compreensíveis para tarefas de IA.

## Stack

**Server:** Node.js, TypeScript, Fastify, LangGraph

## Libs em Destaque

`@langchain/langgraph` para construção de grafos de processamento
`@langchain/core` para componentes essenciais do LangChain
`langchain` para abstrações de modelos, mensagens e componentes
`fastify` para servidor HTTP que expõe os grafos

## Estrutura do Projeto

- `src/graph/graph.ts` - Definição do grafo principal com nodes e arestas
- `src/graph/nodes/` - Nós individuais de processamento:
  - `identifyIntentNode.ts` - Identifica a intenção do usuário (uppercase, lowercase, unknown)
  - `upperCaseNode.ts` - Transforma o texto em maiúscula
  - `lowerCaseNode.ts` - Transforma o texto em minúscula
  - `fallbackNode.ts` - Retorna uma resposta padrão para intenções desconhecidas
  - `chatResponseNode.ts` - Gera a resposta final com base no processamento anterior
- `src/graph/factory.ts` - Factory para criar instâncias do grafo
- `src/server.ts` - Servidor Fastify com rota `/chat`
- `src/index.ts` - Script principal que inicia o servidor
- `langgraph.json` - Configuração do LangGraph para deploy
- `tests/` - Testes E2E do grafo

## O que é LangGraph?

LangGraph é um framework que permite construir aplicações de IA baseadas em grafos. Principais características:

1. **Nodes (Nós)**: Unidades de processamento que recebem estado e retornam estado modificado
2. **Edges (Arestas)**: Definem o fluxo de controle entre nodes
3. **Conditional Edges**: Arestas condicionais que rotearão baseado em lógica do node
4. **State**: Objeto compartilhado entre todos os nodes, contendo dados de entradas e saídas
5. **Type Safety**: Zod schema para validação e type inference

## Demo

O servidor expõe um endpoint `/chat` que recebe uma pergunta e a processa através de um grafo que:

1. **Identifica a intenção** do usuário (procura por "upper" ou "lower" na mensagem)
2. **Roteia para o processamento adequado**:
   - Se encontrar "upper" → uppercase
   - Se encontrar "lower" → lowercase
   - Caso contrário → fallback
3. **Processa** o texto de acordo com a intenção
4. **Gera a resposta final** formatando as mensagens

## Roteiro para execução

1. Instalar as dependências do projeto:

```
npm install
```

2. Configurar as variáveis de ambiente criando um arquivo `.env` baseado em `.env.example` (opcional para desenvolvimento):

```bash
LANGSMITH_API_KEY=your-api-key
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=your-project-name
```

3. Servir o grafo localmente com LangGraph Studio para visualização:

```
npm run langgraph:serve
```

4. Abrir a interface do LangGraph Studio no navegador (geralmente `http://https://smith.langchain.com/studio?baseUrl=http://localhost:2024`)

5. Testar o grafo na interface do LangGraph Studio:
   - Clique no botão **"Messages"** para enviar mensagens de teste
    - Envie mensagens como `"Please uppercase this text"` ou ` "Please lowercase THIS TEXT"` ou `"What is the capital of France?"` para testar os diferentes fluxos
   - Observa a execução visual do grafo em tempo real
   - Acompanhe o estado em cada node conforme o processamento avança
   - Verifique os outputs e as transformações em cada etapa
   - Explore diferentes inputs para testar os diferentes fluxos (uppercase, lowercase, fallback)

6. **(Opcional) Executar testes E2E automatizados:**

```
npm test
```


## Funcionalidades

- ✅ Grafo de processamento multi-node com roteamento condicional
- ✅ Suporte a múltiplas intenções (uppercase, lowercase, fallback)
- ✅ State management typesafe com Zod
- ✅ Servidor HTTP que integra o grafo
- ✅ Visualização opcional com LangGraph Studio
- ✅ Suporte a tracing com LangSmith para debug e monitoramento
- ✅ Testes E2E para validar fluxo do grafo
- ✅ Type-safe com TypeScript

## Métodos em Destaque

### Método: `buildGraph()`

Constrói e compila o grafo de processamento com todos os nodes e arestas:

```typescript
export function buildGraph() {
  const workflow = new StateGraph({
    stateSchema: GraphState
  })

    // Adiciona os nós de processamento
    .addNode("identifyIntent", identifyIntent)
    .addNode("chatResponse", chatResponseNode)
    .addNode("uppercase", upperCaseNode)
    .addNode("lowercase", lowerCaseNode)
    .addNode("fallback", fallbackNode)

    // Define o fluxo com arestas
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
```

**Destaques:**

- `StateGraph` define o esquema de estado com Zod
- `addNode()` registra cada unidade de processamento
- `addEdge()` conecta nodes em sequência
- `addConditionalEdges()` implementa roteamento baseado em lógica
- `compile()` otimiza o grafo para execução

### Método: `identifyIntent()`

Node que analisa a mensagem de entrada e identifica a intenção do usuário:

```typescript
export function identifyIntent(state: GraphState): GraphState {
  const input = state.messages.at(-1)?.text ?? ""
  const inputLower = input.toLowerCase()

  let command: GraphState["command"] = "unknown"

  if (inputLower.includes("upper")) {
    command = "uppercase"
  } else if (inputLower.includes("lower")) {
    command = "lowercase"
  }

  return {
    ...state,
    command,
    output: input
  }
}
```

**Destaques:**

- Extrai última mensagem do estado
- Identifica intenção buscando palavras-chave
- Retorna novo estado com comando identificado
- Mantém imutabilidade do estado (spread operator)

### Método: `chatResponseNode()`

Node final que gera a resposta formatando as mensagens:

```typescript
export function chatResponseNode(state: GraphState): GraphState {
  const responseText = state.output

  // AIMessage é reconhecida pelo LangGraph para visualização
  const aiMessage = new AIMessage(responseText)

  return {
    ...state,
    messages: [...state.messages, aiMessage]
  }
}
```

**Destaques:**

- Cria instância de `AIMessage` para compatibilidade com LangGraph
- Preserva histórico de mensagens
- Finaliza o processamento adicionando resposta ao estado

### Método: `POST /chat`

Rota HTTP que recebe a pergunta e a processa através do grafo:

```typescript
app.post(
  "/chat",
  {
    schema: {
      body: {
        type: "object",
        required: ["question"],
        properties: {
          question: { type: "string", minLength: 5 }
        }
      }
    }
  },
  async (request, reply) => {
    try {
      const { question } = request.body as { question: string }
      return reply.send("ok")
    } catch (error) {
      console.error("Error handling /chat request:", error)
      return reply.code(500)
    }
  }
)
```

**Destaques:**

- Schema de validação integrado no Fastify
- Requer pergunta com no mínimo 5 caracteres
- Tratamento de erros robusto

## Fluxo de Processamento

```
POST /chat { question: "..." }
    ↓
Validação de schema
    ↓
┌──────────────────────────────────────┐
│   Execução do Grafo (LangGraph)      │
├──────────────────────────────────────┤
│  START                               │
│    ↓                                 │
│  identifyIntent                      │
│    ↓                                 │
│  CONDITIONAL EDGE                    │
│    ├→ uppercase                      │
│    ├→ lowercase                      │
│    └→ fallback                       │
│    ↓                                 │
│  chatResponse                        │
│    ↓                                 │
│  END                                 │
└──────────────────────────────────────┘
    ↓
JSON Response ao cliente
```

## State Schema (Zod)

O estado do grafo é definido com Zod para type-safety:

```typescript
const GraphState = z.object({
  messages: withLangGraph(z.custom<BaseMessage[]>(), MessagesZodMeta),
  output: z.string(),
  command: z.enum(["uppercase", "lowercase", "unknown"])
})

export type GraphState = z.infer<typeof GraphState>
```

**Componentes:**

- `messages`: Array de mensagens do LangChain (input/output)
- `output`: String contendo o resultado do processamento
- `command`: Tipo de comando identificado (enum)

## Nodes Disponíveis

| Node               | Responsabilidade                      | Entrada  | Saída                    |
| ------------------ | ------------------------------------- | -------- | ------------------------ |
| `identifyIntent`   | Analisa mensagem e identifica comando | messages | command, output          |
| `upperCaseNode`    | Transforma texto em maiúscula         | output   | output (UPPERCASE)       |
| `lowerCaseNode`    | Transforma texto em minúscula         | output   | output (lowercase)       |
| `fallbackNode`     | Retorna resposta padrão               | output   | output (fallback)        |
| `chatResponseNode` | Formata resposta final                | output   | messages (com AIMessage) |

## Visualização com LangGraph Studio

Para visualizar o grafo em tempo real:

```bash
npm run langgraph:serve
```

Isso inicia o LangGraph Studio que permite:

- Visualizar a topologia do grafo
- Executar o grafo com inputs customizados
- Debug do estado em cada etapa
- Monitoramento de chamadas via LangSmith

## Variáveis de Ambiente

- `LANGSMITH_API_KEY` (opcional): Chave de API do LangSmith para tracing
- `LANGCHAIN_TRACING_V2` (opcional): Ativa tracing (true/false)
- `LANGCHAIN_PROJECT` (opcional): Nome do projeto no LangSmith

## Próximos Passos

Para expandir este exemplo você pode:

1. **Adicionar mais nodes**: Criar processadores específicos (tradução, resumo, etc.)
2. **Integrar modelos LLM**: Usar ChatOpenAI ou outros modelos nos nodes
3. **Persistência**: Armazenar histórico de conversas em banco de dados
4. **Validação de output**: Adicionar nodes para validar qualidade das respostas
5. **Branching dinâmico**: Usar `addConditionalEdges` para roteamento complexo

## Recursos Adicionais

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangChain Documentation](https://js.langchain.com/)
- [LangGraph Studio](https://smith.langchain.com/)
- [LangSmith Tracing](https://docs.smith.langchain.com/)
- [Zod Schema Validation](https://zod.dev/)
