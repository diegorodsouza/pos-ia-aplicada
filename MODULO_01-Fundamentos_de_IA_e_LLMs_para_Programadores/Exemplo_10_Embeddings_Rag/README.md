# Embeddings com RAG (Retrieval Augmented Generation) utilizando Neo4j

Nesse exemplo, exploramos uma implementação completa de **RAG (Retrieval Augmented Generation)** utilizando embeddings, um banco de dados gráfico Neo4j e um modelo de linguagem generativa. O objetivo é demonstrar como combinar busca semântica com geração de linguagem natural para criar um sistema de perguntas e respostas inteligente que fornece respostas contextualizadas com base em uma base de conhecimento.

## Stack

**Client:** TypeScript, Node.js

## Libs em Destaque

`@huggingface/transformers` para geração de embeddings locais
`@langchain/core` para construção de pipelines de processamento (chains)
`@langchain/openai` para integração com modelos de linguagem via OpenRouter
`@langchain/community` para integração com Neo4j Vector Store
`neo4j-driver` para conexão com o banco de dados gráfico

## Estrutura do Projeto

- `config.ts` - Configurações de Neo4j, embeddings, OpenRouter e templates de prompt
- `documentProcessor.ts` - Carregamento e divisão de documentos em trechos para geração de embeddings
- `ai.ts` - Implementação da classe AI com métodos para RAG (busca e geração de respostas)
- `util.ts` - Funções utilitárias para processamento e exibição de resultados
- `index.ts` - Script principal que orquestra o pipeline de embeddings, armazenamento e RAG
- `prompts/` - Pasta contendo templates de prompt e configurações para geração de respostas
- `respostas/` - Pasta onde as respostas geradas são salvas em formato JSON

## O que é RAG (Retrieval Augmented Generation)?

RAG é um padrão arquitetural que combina duas operações fundamentais:

1. **Retrieval (Recuperação)**: Busca semântica nos embeddings armazenados no Neo4j para encontrar os trechos de texto mais relevantes para a pergunta do usuário.

2. **Augmented Generation (Geração Aumentada)**: Uso de um modelo de linguagem para gerar uma resposta contextualizada, baseada não apenas no conhecimento interno do modelo, mas também nos documentos recuperados na etapa anterior.

Isso resulta em respostas mais precisas, locais e referenciadas pela base de conhecimento fornecida.

## Demo

Para a demo, utilizamos um PDF sobre tensores e redes neurais em JavaScript. O sistema:

1. Gera embeddings para cada trecho do texto usando HuggingFace
2. Armazena os embeddings e metadados no Neo4j
3. Recebe perguntas dos usuários
4. Busca os trechos mais relevantes no Neo4j usando similaridade semântica
5. Usa um modelo de LLM para gerar respostas baseadas nos trechos encontrados
6. Salva as respostas em arquivos JSON com metadados (pergunta, resposta, score de similaridade)

### Exemplo de resposta gerada:

```json
{
  "question": "O que são tensores e como são representados em JavaScript?",
  "answer": "Tensores são estruturas de dados multidimensionais fundamentais em operações numéricas e aprendizado de máquina. Em JavaScript, eles são representados como objetos com valores, forma (shape) e tipo de dados...",
  "topScore": 0.876,
  "timestamp": "2024-04-01T10:30:00Z"
}
```

## Roteiro para execução

1. Instalar as dependências do projeto:

```
npm install
```

2. Instalar as dependências da imagem Docker (Neo4j):

```
npm run infra:up
```

3. Configurar as variáveis de ambiente criando um arquivo `.env` baseado em `.env.example`:

```bash
# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# OpenRouter para acesso a modelos LLM
OPENROUTER_API_KEY=sua_chave_aqui
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_SITE_NAME=RAG-Example
NLP_MODEL=openai/gpt-4

# Embeddings
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
```

4. Executar o script principal para processar documentos, gerar embeddings e responder perguntas:

```
npm start
```

5. Observar os resultados em:
   - **Console**: Exibição da pergunta, resposta e score de similaridade
   - **Pasta `respostas/`**: Arquivo JSON com todas as respostas geradas

6. Opcionalmente, acessar o Neo4j Browser em `http://localhost:7474` para visualizar o grafo de dados e executar consultas Cypher personalizadas.

7. Finalizar os serviços de infra:

```
npm run infra:down
```

## Métodos em Destaque

### Método: `retrieveVectorSearchResults()`

Responsável pela etapa **Retrieval** do RAG, buscando no vector store do Neo4j os documentos mais relevantes:

```typescript
async retrieveVectorSearchResults(input: ChainState): Promise<ChainState> {
  // Busca documentos semelhantes usando similaritySearchWithScore
  const vectorResults = await this.params.vectorStore.similaritySearchWithScore(
    input.question,
    this.params.topK
  )

  // Filtra resultados com score > 0.5 e concatena o contexto
  const contexts = vectorResults
    .filter(([, score]) => score > 0.5)
    .map(([doc]) => doc.pageContent)
    .join("\n\n---\n\n")

  return {
    ...input,
    context: contexts,
    topScore: vectorResults[0]![1]
  }
}
```

**Destaques:**

- Usa `similaritySearchWithScore` para obter tanto documentos quanto scores de relevância
- Filtra resultados por score mínimo (threshold) para garantir qualidade
- Retorna um objeto `ChainState` que será passado para a próxima etapa

### Método: `generateNLPResponse()`

Responsável pela etapa **Augmented Generation** do RAG, criando uma resposta usando um modelo de LLM:

```typescript
async generateNLPResponse(input: ChainState): Promise<ChainState> {
  // Cria um prompt dinamicamente baseado em template
  const responsePrompt = ChatPromptTemplate.fromTemplate(this.params.templateText)

  // Encadeia o prompt → modelo LLM → parse de saída
  const responseChain = responsePrompt
    .pipe(this.params.nlpModel)
    .pipe(new StringOutputParser())

  // Invoca o chain com variáveis personalizadas
  const rawResponse = await responseChain.invoke({
    role: this.params.promptConfig.role,
    task: this.params.promptConfig.task,
    tone: this.params.promptConfig.constraints.tone,
    language: this.params.promptConfig.constraints.language,
    context: input.context,      // Contexto recuperado da etapa anterior
    question: input.question      // Pergunta do usuário
  })

  return {
    ...input,
    answer: rawResponse
  }
}
```

**Destaques:**

- Usa `ChatPromptTemplate` para templates de prompt reutilizáveis
- Implementa padrão builder com `.pipe()` da LangChain para composição
- Recebe o contexto recuperado como variável de prompt
- O modelo LLM gera respostas ponderadas pelo contexto fornecido

### Método: `answerQuestion()`

Orquestra toda a pipeline RAG usando `RunnableSequence`:

```typescript
async answerQuestion(question: string) {
  // Cria uma sequência de operações encadeadas
  const chain = RunnableSequence.from([
    this.retrieveVectorSearchResults.bind(this),      // Etapa 1: Retrieval
    this.generateNLPResponse.bind(this)               // Etapa 2: Generation
  ])

  // Executa a pipeline completa passando a pergunta
  const result = await chain.invoke({ question })

  return result
}
```

**Destaques:**

- `RunnableSequence` encadeia as operações de forma declarativa
- A saída de uma etapa se torna a entrada da próxima
- Tratamento de erros integrado na sequência

## Fluxo de Processamento

```
PDF Input
    ↓
Document Processor (chunk + split)
    ↓
Embeddings (HuggingFace Transformers)
    ↓
Neo4j Vector Store (armazenamento)
    ↓
┌─────────────────────────────────────────┐
│     RAG Pipeline (RunnableSequence)     │
├─────────────────────────────────────────┤
│  1. Retrieval (similaritySearch)        │
│     ↓                                   │
│  2. Augmented Generation (ChatOpenAI)   │
│     ↓                                   │
│  3. Output Parser                       │
└─────────────────────────────────────────┘
    ↓
JSON Response (salvo em `respostas/`)
```

## Diferenças em relação ao Exemplo 09

| Aspecto                       | Exemplo 09              | Exemplo 10                         |
| ----------------------------- | ----------------------- | ---------------------------------- |
| **Objetivo**                  | Busca semântica simples | RAG completo                       |
| **Modelo de LLM**             | ❌ Não utiliza          | ✅ ChatOpenAI via OpenRouter       |
| **Geração de respostas**      | ❌ Apenas busca         | ✅ Gera respostas contextualizadas |
| **Templates de prompt**       | ❌ Não utiliza          | ✅ Prompts customizados em JSON    |
| **Persistência de respostas** | ❌ Console apenas       | ✅ Arquivo JSON com metadados      |
| **Cadeia de processamento**   | ❌ Sequencial simples   | ✅ RunnableSequence (LangChain)    |

## Variáveis de Ambiente

- `NEO4J_URI`: URL de conexão do Neo4j (padrão: `bolt://localhost:7687`)
- `NEO4J_USER`: Usuário do Neo4j (padrão: `neo4j`)
- `NEO4J_PASSWORD`: Senha do Neo4j (padrão: `password`)
- `OPENROUTER_API_KEY`: Chave de API do OpenRouter (https://openrouter.ai)
- `OPENROUTER_SITE_URL`: URL do seu site/aplicação
- `OPENROUTER_SITE_NAME`: Nome da sua aplicação
- `NLP_MODEL`: Modelo LLM a utilizar (ex: `openai/gpt-4`)
- `EMBEDDING_MODEL`: Modelo de embeddings (padrão: `Xenova/all-MiniLM-L6-v2`)

## Recursos Adicionais

- [Neo4j Vector Search](https://neo4j.com/docs/cypher-manual/current/indexes/#indexes-fulltext-search)
- [LangChain Documentation](https://js.langchain.com/)
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [HuggingFace Transformers.js](https://xenova.github.io/transformers.js/)
