# RAG com Neo4j e Estrutura Grafo - Consultas de Vendas com AI SDK

Nesse exemplo, exploramos a implementação de um **sistema de Retrieval-Augmented Generation (RAG)** combinando LangGraph, Neo4j e AI SDK com OpenRouter. O objetivo é demonstrar como construir pipelines inteligentes que recuperam dados estruturados de um banco de grafos e geram respostas naturais através de um grafo de processamento, utilizando técnicas modernas de busca por similaridade vetorial e geração de queries Cypher com tool calling.

## Stack

**Server:** Node.js, TypeScript, Fastify, LangGraph, AI SDK

**Database:** Neo4j (banco de dados em grafo)

**LLM Provider:** OpenRouter com modelos diversos

## Libs em Destaque

`@langchain/langgraph` para construção de grafos de processamento multi-nó
`ai` para unified LLM interface com OpenRouter
`@openrouter/ai-sdk-provider` para integração com OpenRouter
`neo4j-driver` para conexão e queries com Neo4j
`@langchain/community` para componentes comunitários do LangChain
`fastify` para servidor HTTP que expõe o grafo

## Arquitetura do Sistema

O sistema funciona em um pipeline complexo que combina:

1. **Query Planning**: Identificação de múltiplas sub-perguntas se necessário
2. **Cypher Generation**: Geração de queries Neo4j com tool calling para AI SDK
3. **Query Validation**: Validação de syntaxe das queries geradas
4. **Execution**: Execução segura contra o banco de dados
5. **Self-Correction**: Correção automática de queries inválidas
6. **Response Generation**: Geração de respostas naturais em linguagem comum

## Estrutura do Projeto

```
src/
├── config.ts                           # Configuração centralizada
├── index.ts                            # Ponto de entrada do servidor
├── server.ts                           # Servidor Fastify com rotas
├── graph/
│   ├── graph.ts                        # Definição do StateGraph
│   ├── factory.ts                      # Factory para criar instâncias do grafo
│   └── nodes/                          # Nós individuais de processamento
│       ├── extractQuestionNode.ts      # Extrai pergunta das mensagens
│       ├── queryPlannerNode.ts         # Planeja se há múltiplas sub-perguntas
│       ├── cypherGeneratorNode.ts      # Gera Cypher com tool calling
│       ├── cypherExecutorNode.ts       # Executa a query no Neo4j
│       ├── cypherCorrectionNode.ts     # Corrige queries inválidas
│       └── analyticalResponseNode.ts   # Gera resposta natural formatada
├── services/
│   ├── neo4jService.ts                 # Gerenciamento de conexão e queries Neo4j
│   └── openrouterService.ts            # Cliente de LLM com AI SDK
└── prompts/                            # Templates de prompts para cada estágio
```

## Fluxo de Processamento

```
POST /chat { question: "..." }
    ↓
Validação de schema
    ↓
┌────────────────────────────────────────────┐
│   Execução do Grafo (LangGraph)            │
├────────────────────────────────────────────┤
│  START                                     │
│    ↓                                       │
│  extractQuestion                           │
│  (Extrai pergunta do contexto)             │
│    ↓                                       │
│  queryPlanner                              │
│  (Planeja múltiplas sub-perguntas?)        │
│    ↓                                       │
│  cypherGenerator                           │
│  (Gera query Cypher com tool calling)      │
│    ↓                                       │
│  cypherExecutor                            │
│  (Executa com Neo4j)                       │
│    ↓                                       │
│  [CONDITIONAL]                             │
│  Query inválida?                           │
│    ├→ Sim → cypherCorrection               │
│    │       (Corrige a query)               │
│    │          ↓                            │
│    │       [Até 1 tentativa de correção]   │
│    └→ Não → analyticalResponse             │
│             (Gera resposta natural)        │
│    ↓                                       │
│  END                                       │
└────────────────────────────────────────────┘
    ↓
JSON Response ao cliente
```

## O que é RAG (Retrieval-Augmented Generation)?

RAG é uma arquitetura que combina:

1. **Retrieval**: Busca eficiente por dados relevantes no Neo4j
2. **Augmentation**: Enriquecimento do contexto com dados recuperados
3. **Generation**: Geração de respostas usando LLM com contexto aumentado

**Benefícios:**

- Reduz alucinações do LLM
- Permite consultar dados atualizados
- Mais transparência (dados vêm do banco)
- Melhor performance (menos tokens)

## Schema Neo4j

O projeto utiliza um schema de cursos da EW Academy:

```cypher
// Entities
(:Student { name, email, enrolledCourses })
(:Course { title, description, duration, price, level })
(:Instructor { name, expertise })

// Relationships
(Student)-[:ENROLLED_IN]->(Course)
(Course)-[:TAUGHT_BY]->(Instructor)
(Student)-[:COMPLETED]->(Course)
```

## State Schema (Zod)

O estado do grafo com type-safety:

```typescript
const SalesStateAnnotation = z.object({
  // Input
  messages: withLangGraph(z.custom<BaseMessage[]>(), MessagesZodMeta),
  question: z.string().optional(),

  // Query generation
  query: z.string().optional(),
  originalQuery: z.string().optional(),

  // Execution results
  dbResults: z.array(z.any()).optional(),

  // Self-correction
  correctionAttempts: z.number().optional(),
  error: z.string().optional()
})
```

## Roteiro para Execução

### 1. Preparar o Ambiente

```bash
# Instalar dependências
npm install

# Criar arquivo .env baseado em .env.example
cp .env.example .env
```

### 2. Configurar Variáveis de Ambiente

Editar `.env` com:

```bash
# OpenRouter
OPENROUTER_API_KEY=your-openrouter-key

# Neo4j (padrão Docker)
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
```

### 3. Iniciar Infraestrutura (Neo4j)

```bash
# Subir containers (Neo4j)
npm run docker:infra:up

# Verificar logs
npm run docker:infra:logs
```

Neo4j estará disponível em:

- Browser: `http://localhost:7474`
- Bolt: `neo4j://localhost:7687`

### 4. Semear Dados (Seed)

```bash
# Popular o banco com dados de exemplo
npm run seed
```

Isso carregará:

- Alunos com nomes, emails, cursos inscritos
- Cursos com títulos, descrições, preços
- Instrutores com especialidades
- Relacionamentos entre entidades

### 5. Iniciar o Servidor

```bash
# Modo desenvolvimento com hot reload
npm run dev

# Ou modo produção
npm start
```

Servidor disponível em `http://localhost:3000`

### 6. Testar o Endpoint

**Exemplo simples:**

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Qual é o preço do curso de Node.js?"
  }'
```

**Resposta esperada:**

```json
{
  "question": "Qual é o preço do curso de Node.js?",
  "answer": "O curso de Node.js custa R$ 199,00 e tem duração de 40 horas.",
  "query": "MATCH (c:Course {title: 'Node.js'}) RETURN c.price, c.duration",
  "results": [{ "price": 199, "duration": 40 }]
}
```

**Exemplo complexo com multi-step:**

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Quais são os cursos intermediários de back-end ensinados por instrutores com expertise em Node.js, quanto custam e quantos alunos estão inscritos em cada?"
  }'
```

**Resposta esperada:**

```json
{
  "question": "Quais são os cursos intermediários de back-end ensinados por instrutores com expertise em Node.js, quanto custam e quantos alunos estão inscritos em cada?",
  "isMultiStep": true,
  "subQuestions": [
    "Encontrar instrutores com expertise em Node.js",
    "Listar cursos intermediários de back-end ensinados por esses instrutores",
    "Contar alunos inscritos em cada curso"
  ],
  "answer": "Os cursos intermediários de back-end ensinados por especialistas em Node.js são: (1) Advanced Node.js Patterns - R$ 299,00 com 45 alunos inscritos; (2) Node.js Microservices - R$ 349,00 com 38 alunos inscritos. Total de 83 alunos inscritos nestes cursos.",
  "queries": [
    "MATCH (i:Instructor {expertise: 'Node.js'}) RETURN i.name",
    "MATCH (i:Instructor {expertise: 'Node.js'})-[:TEACHES]->(c:Course {level: 'intermediate', category: 'back-end'}) RETURN c.title, c.price, c.id",
    "MATCH (c:Course {id: 'node-patterns'})<-[:ENROLLED_IN]-(s:Student) RETURN count(s) as enrolledCount"
  ],
  "results": [
    [{ "name": "Erick Wendel" }, { "name": "Diego Haz" }],
    [
      { "title": "Advanced Node.js Patterns", "price": 299, "id": "node-patterns" },
      { "title": "Node.js Microservices", "price": 349, "id": "node-microservices" }
    ],
    [{ "enrolledCount": 45 }, { "enrolledCount": 38 }]
  ]
}
```

Neste exemplo complexo, o sistema:

- ✅ **Identifica múltiplas sub-perguntas** no queryPlanner
- ✅ **Gera 3 queries Cypher distintas** com relacionamentos complexos
- ✅ **Executa todas sequencialmente** mantendo contexto
- ✅ **Consolida resultados** em uma resposta natural coerente

### 7. (Opcional) Servir Grafo com LangGraph Studio

```bash
npm run langgraph:serve
```

Acessa: `http://localhost:2024` (ajuste conforme config)

Permite:

- Visualizar topologia do grafo
- Executar com inputs customizados
- Debug do estado em cada node
- Monitorar execução passo a passo

### 8. (Opcional) Executar Testes

```bash
# Testes unitários
npm test

# Testes E2E
npm run test:e2e

# Modo watch para desenvolvimento
npm run test:dev
npm run test:e2e:dev
```

## Métodos em Destaque

### Método: `buildGraph()`

Constrói o grafo completo com todos os nós e arestas condicionais:

```typescript
export function buildGraph(neo4jService: Neo4jService, openrouterService: OpenRouterService) {
  const workflow = new StateGraph({
    stateSchema: SalesStateAnnotation
  })

  workflow
    .addNode("extractQuestion", createExtractQuestionNode())
    .addNode("queryPlanner", createQueryPlannerNode(openrouterService))
    .addNode("cypherGenerator", createCypherGeneratorNode(openrouterService, neo4jService))
    .addNode("cypherExecutor", createCypherExecutorNode(neo4jService))
    .addNode("cypherCorrection", createCypherCorrectionNode(openrouterService, neo4jService))
    .addNode("analyticalResponse", createAnalyticalResponseNode(openrouterService))

    .addEdge(START, "extractQuestion")
    .addEdge("extractQuestion", "queryPlanner")
    .addEdge("queryPlanner", "cypherGenerator")
    .addEdge("cypherGenerator", "cypherExecutor")
    .addConditionalEdges(
      "cypherExecutor",
      (state: SalesStateAnnotation) => {
        if (state.error && state.correctionAttempts! < config.maxCorrectionAttempts) {
          return "cypherCorrection"
        }
        return "analyticalResponse"
      },
      {
        cypherCorrection: "cypherCorrection",
        analyticalResponse: "analyticalResponse"
      }
    )
    .addEdge("cypherCorrection", "cypherExecutor")
    .addEdge("analyticalResponse", END)

  return workflow.compile()
}
```

**Destaques:**

- Estados e transições bem definidas
- Arestas condicionais para tratamento de erros
- Loop de correção automática
- Fluxo determinístico e testável

### Método: `generateCypherWithTool()`

Gera Cypher query usando tool calling para AI SDK:

```typescript
export async function generateCypherWithTool(question: string, schema: string, context: string) {
  const systemPrompt = `Você é um especialista em Neo4j Cypher.
Use a ferramenta neo4j-cypher-guide para gerar queries corretas.
Schema: ${schema}
Contexto: ${context}`

  const { text, toolResults } = await generateText({
    model: openrouter("openai/gpt-oss-120b:free"),
    system: systemPrompt,
    prompt: question,
    tools: {
      neo4jCypherSkill: {
        description: "Gera queries Cypher para Neo4j",
        parameters: z.object({
          query: z.string().describe("Query Cypher a executar")
        })
      }
    }
  })

  return { query: toolResults[0]?.query || text, toolUsed: !!toolResults.length }
}
```

**Destaques:**

- Tool calling integrado ao AI SDK
- Melhor qualidade de queries com skill especializado
- Type-safe com Zod

### Método: `queryNeo4j()`

Executa queries com validação e tratamento de erros:

```typescript
export async function queryNeo4j(query: string) {
  try {
    // Validar syntax
    await session.run(`EXPLAIN ${query}`)

    // Executar query
    const result = await session.run(query)

    return {
      data: result.records.map((r) => r.toObject()),
      error: null
    }
  } catch (error) {
    return {
      data: [],
      error: error.message
    }
  }
}
```

**Destaques:**

- EXPLAIN para validação antes de execução
- Tratamento seguro de erros
- Conversão automática de records

### Método: `POST /chat`

Rota HTTP que orquestra o grafo:

```typescript
app.post("/chat", async (request, reply) => {
  try {
    const { question } = request.body as { question: string }

    const graph = buildGraph(neo4jService, openrouterService)
    const state = await graph.invoke({
      messages: [new HumanMessage(question)],
      question,
      correctionAttempts: 0
    })

    return reply.send({
      question: state.question,
      answer: state.finalResponse,
      query: state.query,
      results: state.dbResults
    })
  } catch (error) {
    console.error("Error in /chat:", error)
    return reply.code(500).send({ error: error.message })
  }
})
```

**Destaques:**

- Integração completa do grafo
- Estado compartilhado entre todos os nodes
- Resposta estruturada e tipada

## Nós Disponíveis

| Nó                   | Responsabilidade                      | Entrada   | Saída                      |
| -------------------- | ------------------------------------- | --------- | -------------------------- |
| `extractQuestion`    | Extrai pergunta das mensagens         | messages  | question                   |
| `queryPlanner`       | Planeja se há múltiplas sub-perguntas | question  | isMultiStep, subQuestions  |
| `cypherGenerator`    | Gera query Cypher com tool calling    | question  | query, subQueries          |
| `cypherExecutor`     | Executa query no Neo4j                | query     | dbResults, needsCorrection |
| `cypherCorrection`   | Corrige queries inválidas (até 1x)    | query     | query, correctionAttempts  |
| `analyticalResponse` | Gera resposta natural consolidada     | dbResults | answer, followUpQuestions  |

## Features Principais

- ✅ **RAG com Neo4j**: Consultas estruturadas em banco de grafos
- ✅ **Tool Calling**: Usa skills especializados para geração de Cypher
- ✅ **Self-Correction**: Corrige automaticamente queries inválidas
- ✅ **Multi-Query**: Detecta e processa múltiplas perguntas/sub-perguntas
- ✅ **Type-Safe**: TypeScript + Zod em todo o stack
- ✅ **Grafos Complexos**: Suporte a relacionamentos e padrões Neo4j
- ✅ **Error Handling**: Tratamento robusto de falhas de sintaxe
- ✅ **Testes E2E**: Validação com dados reais
- ✅ **Docker Support**: Infraestrutura containerizada
- ✅ **LangGraph Studio**: Visualização do grafo

## Variáveis de Ambiente

- `OPENROUTER_API_KEY` (obrigatório): Chave de API do OpenRouter
- `NEO4J_URI` (padrão: `neo4j://localhost:7687`): URI de conexão
- `NEO4J_USER` (padrão: `neo4j`): Usuário do Neo4j
- `NEO4J_PASSWORD` (padrão: `password`): Senha do Neo4j
- `LANGSMITH_API_KEY` (opcional): Para tracing com LangSmith
- `LANGCHAIN_TRACING_V2` (opcional): Ativa tracing

## Fluxo de Correção Automática

O sistema possui um loop de auto-correção com limite de 1 tentativa:

1. Gera query Cypher inicial com AI SDK + tool calling
2. Tenta executar com `EXPLAIN` para validar syntax
3. Se falhar, envia erro ao LLM para correção
4. Re-executa query corrigida
5. Se ainda falhar, retorna erro ao usuário

**Configurável em `config.ts`:**

```typescript
maxCorrectionAttempts: 1 // Máximo de tentativas de correção
```

## Próximos Passos para Expansão

1. **Cache Distribuído**: Redis para cache de queries executadas
2. **Persistência**: Armazenar conversas em Neo4j
3. **Múltiplos Modelos**: Rotiador automático de modelos por custo/performance
4. **Analytics**: Dashboard de perguntas e respostas
5. **Fine-tuning**: Adaptar prompts por domínio específico
6. **Batch Processing**: Processar múltiplas perguntas em paralelo
7. **Feedback Loop**: Aprender com correções do usuário
8. **GraphRAG**: Usar estrutura de grafos para melhor contexto

## Recursos Adicionais

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [AI SDK Documentation](https://sdk.vercel.ai/)
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [Neo4j Cypher Manual](https://neo4j.com/docs/cypher-manual/current/)
- [Neo4j Driver Node.js](https://neo4j.com/docs/driver-manual/current/get-started/)
- [LangSmith Documentation](https://docs.smith.langchain.com/)
- [Zod Schema Validation](https://zod.dev/)

## Troubleshooting

### Conexão Neo4j recusada

```bash
# Verificar se containers estão rodando
docker ps | grep neo4j

# Reiniciar infraestrutura
npm run docker:infra:down
npm run docker:infra:cleanup
npm run docker:infra:up
```

### API Key inválida

```bash
# Verificar .env
cat .env

# Testar conexão com OpenRouter
curl https://openrouter.ai/api/v1/auth/key \
  -H "Authorization: Bearer YOUR_KEY"
```

### Query Cypher inválida após múltiplas correções

- Verificar schema do Neo4j: `CALL db.schema.visualization()`
- Aumentar `maxCorrectionAttempts` em config
- Analisar logs do servidor: `npm run dev` com verbosidade

## Contribuindo

Para expandir este exemplo:

1. Crie novos nodes em `src/graph/nodes/`
2. Adicione prompts em `src/prompts/`
3. Adicione testes em `tests/`
4. Atualize o grafo em `src/graph/graph.ts`
