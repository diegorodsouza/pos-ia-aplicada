# Modelos Multimodais - Document Q&A Pipeline com LangGraph

Nesse exemplo, exploramos a implementação de um **sistema de Q&A para documentos usando modelos multimodais (vision-capable)** combinando LangGraph, OpenRouter e processamento de PDFs. O objetivo é demonstrar como construir pipelines que analisam visualmente documentos e respondem perguntas específicas sobre seu conteúdo, utilizando a capacidade de visão de modelos de IA modernos.

## Stack

**Server:** Node.js, TypeScript, Fastify, LangGraph

**LLM Provider:** OpenRouter com modelos multimodais (Gemini 2.5, Claude 3.5, GPT-4o)

**File Processing:** PDF upload via multipart/form-data

## Libs em Destaque

`@langchain/langgraph` para construção de grafos de processamento
`@langchain/core` para componentes essenciais do LangChain
`langchain` para abstrações de modelos e mensagens
`fastify` para servidor HTTP com suporte a multipart
`@fastify/multipart` para upload de arquivos
`form-data` para manipulação de dados de formulário

## O que são Modelos Multimodais?

Modelos multimodais são LLMs treinados para processar múltiplas modalidades de dados:

- **Texto**: Processamento de linguagem natural tradicional
- **Imagem/Visão**: Análise de imagens, gráficos, tabelas, documentos
- **Áudio** (em alguns modelos): Transcrição e análise de áudio

**Exemplos de modelos multimodais disponíveis via OpenRouter:**

- 🔷 **Google Gemini 2.5 Flash Lite** (padrão): Rápido, eficiente, ótimo custo-benefício
- 🟣 **Anthropic Claude 3.5 Sonnet**: Excelente análise de texto, visão de alta qualidade
- 🔴 **OpenAI GPT-4o**: Modelo mais avançado, melhor performance em tarefas complexas
- 🟢 **Google Gemini Pro Vision**: Alternativa gratuita/low-cost

## Arquitetura do Sistema

O sistema funciona em um pipeline simples mas poderoso:

1. **Document Upload**: Recebimento de PDF via multipart/form-data
2. **Document Processing**: Conversão para base64 para processamento multimodal
3. **Question Extraction**: Extração da pergunta do formulário
4. **Multimodal Analysis**: Análise visual do documento + resposta com LLM
5. **Response Generation**: Formatação e retorno da resposta

## Estrutura do Projeto

```
src/
├── config.ts                           # Configuração com modelos multimodais
├── index.ts                            # Ponto de entrada do servidor
├── server.ts                           # Servidor Fastify com endpoint /chat
├── graph/
│   ├── graph.ts                        # Definição do StateGraph
│   ├── factory.ts                      # Factory para criar instâncias do grafo
│   └── nodes/
│       └── answerGenerationNode.ts     # Nó que processa documento + pergunta
└── services/
    └── openrouterService.ts            # Cliente de LLM com OpenRouter
```

## Fluxo de Processamento

```
POST /chat (multipart/form-data)
  ├── file: PDF document
  └── question: "Qual é o tema principal?"
    ↓
Validação de entrada
  ├── Verificar se arquivo é PDF
  └── Verificar se pergunta tem mínimo 3 caracteres
    ↓
┌─────────────────────────────────────────────────────┐
│   Execução do Grafo (LangGraph)                     │
├─────────────────────────────────────────────────────┤
│  START                                              │
│    ↓                                                │
│  answerGeneration                                   │
│  (Análise Multimodal do Documento)                  │
│    ├─ Envia: documento (base64) + pergunta          │
│    ├─ LLM analisa visualmente o PDF                 │
│    └─ Gera resposta baseada no conteúdo             │
│    ↓                                                │
│  END                                                │
└─────────────────────────────────────────────────────┘
    ↓
JSON Response ao cliente
{
  answer: "...",
  model: "gemini-2.5-flash-lite",
  tokensUsed: 150
}
```

## State Schema (Zod)

O estado do grafo com type-safety:

```typescript
const DocumentQAStateAnnotation = z.object({
  // Input
  messages: withLangGraph(z.custom<BaseMessage[]>(), MessagesZodMeta),

  // Document processing (armazenado como base64 para análise multimodal)
  documentBase64: z.string().optional(),

  // Error handling
  error: z.string().optional()
})

export type GraphState = z.infer<typeof DocumentQAStateAnnotation>
```

**Componentes:**

- `messages`: Array de mensagens do LangChain com pergunta do usuário
- `documentBase64`: String codificada em base64 do PDF para análise multimodal
- `error`: Mensagem de erro se houver falha no processamento

## Capacidades de Visão por Modelo

| Modelo                                | Visão | Velocidade | Custo  | Melhor para                        |
| ------------------------------------- | ----- | ---------- | ------ | ---------------------------------- |
| Google Gemini 2.5 Flash Lite (padrão) | ✅    | ⚡⚡⚡     | 💰     | Análise rápida, PDFs simples       |
| Anthropic Claude 3.5 Sonnet           | ✅    | ⚡⚡       | 💰💰   | Análise detalhada de texto         |
| OpenAI GPT-4o                         | ✅    | ⚡         | 💰💰💰 | Tarefas complexas, máxima precisão |
| Google Gemini Pro Vision              | ✅    | ⚡⚡       | 💰     | Alternativa custo-efetiva          |

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
# OpenRouter (obrigatório)
OPENROUTER_API_KEY=your-openrouter-key
```

### 3. Iniciar o Servidor

```bash
# Modo desenvolvimento com hot reload
npm run dev

# Ou modo produção
npm start
```

Servidor disponível em `http://localhost:3000`

### 4. Testar o Endpoint

**Exemplo com curl (requer arquivo PDF):**

```bash
curl -X POST http://localhost:3000/chat \
  -F "question=Qual é o tema principal deste documento?" \
  -F "file=@/path/to/document.pdf"
```

**Exemplo com JavaScript/Node.js:**

```javascript
const FormData = require("form-data")
const fs = require("fs")

const form = new FormData()
form.append("question", "Qual é o tema principal deste documento?")
form.append("file", fs.createReadStream("./document.pdf"))

const response = await fetch("http://localhost:3000/chat", {
  method: "POST",
  body: form,
  headers: form.getHeaders()
})

const result = await response.json()
console.log(result)
```

**Resposta esperada:**

```json
{
  "answer": "Este documento é sobre Inteligência Artificial Aplicada. Trata de conceitos fundamentais de LLMs, arquiteturas de modelos, técnicas de prompt engineering e implementação de sistemas RAG com Neo4j.",
  "model": "google/gemini-2.5-flash-lite-preview-09-2025",
  "tokensUsed": 245,
  "processingTime": 1250
}
```

### 5. (Opcional) Servir Grafo com LangGraph Studio

```bash
npm run langgraph:serve
```

Permite:

- Visualizar o grafo (simples neste exemplo)
- Debugar entradas e saídas
- Monitorar invocações do LLM

### 6. (Opcional) Executar Testes

```bash
# Testes unitários
npm test

# Modo watch para desenvolvimento
npm run test:dev
```

## Métodos em Destaque

### Método: `buildDocumentQAGraph()`

Constrói o grafo simplificado para Q&A de documentos:

```typescript
export function buildDocumentQAGraph(llmClient: OpenRouterService) {
  const workflow = new StateGraph({
    stateSchema: DocumentQAStateAnnotation
  })
    .addNode("answerGeneration", createAnswerGenerationNode(llmClient))
    .addEdge(START, "answerGeneration")
    .addEdge("answerGeneration", END)

  return workflow.compile()
}
```

**Destaques:**

- Grafo minimalista (1 nó apenas)
- Foco total na análise multimodal
- Processamento direto do PDF + pergunta

### Método: `analyzeDocumentWithQuestion()`

Realiza análise multimodal do documento:

```typescript
export async function analyzeDocumentWithQuestion(question: string, documentBase64: string) {
  const response = await generateText({
    model: openrouter("google/gemini-2.5-flash-lite-preview-09-2025"),
    system:
      "Você é um especialista em análise de documentos. Responda perguntas sobre o conteúdo do documento fornecido.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: question
          },
          {
            type: "image",
            image: documentBase64,
            mimeType: "application/pdf"
          }
        ]
      }
    ]
  })

  return response.text
}
```

**Destaques:**

- Envia pergunta em texto
- Envia documento em base64 como imagem
- Modelo analisa visualmente o PDF
- Retorna resposta contextualizada

### Método: `POST /chat`

Rota HTTP que orquestra o pipeline de Q&A:

```typescript
app.post("/chat", async function (request, reply) {
  try {
    const data = await request.file()

    if (!data) {
      return reply.status(400).send({ error: "No file uploaded" })
    }

    if (data.mimetype !== "application/pdf") {
      return reply.status(400).send({ error: "Only PDF files are supported" })
    }

    const questionField = data.fields.question
    const question = questionField && "value" in questionField ? questionField.value : undefined

    if (!question || typeof question !== "string" || question.trim().length < 3) {
      return reply.status(400).send({
        error: "Question is required and must be at least 3 characters"
      })
    }

    const buffer = await data.toBuffer()
    const documentBase64 = buffer.toString("base64")

    const response = await graph.invoke({
      messages: [new HumanMessage(question)],
      documentBase64
    })

    return {
      answer: response.messages.at(-1)?.content,
      model: config.models[0],
      tokensUsed: response.tokensUsed
    }
  } catch (error) {
    console.error("Error in /chat:", error)
    return reply.code(500).send({ error: error.message })
  }
})
```

**Destaques:**

- Validação rigorosa de entrada
- Suporte apenas a PDFs
- Conversão eficiente para base64
- Integração com o grafo

## Features Principais

- ✅ **Modelos Multimodais**: Suporte a Gemini, Claude, GPT-4o
- ✅ **PDF Processing**: Upload e análise de documentos PDF
- ✅ **Vision Analysis**: Análise visual de documentos
- ✅ **Q&A Pipeline**: Perguntas específicas sobre conteúdo
- ✅ **Type-Safe**: TypeScript + Zod em todo o stack
- ✅ **Multi-model Support**: Fácil trocar entre modelos
- ✅ **Error Handling**: Validação robusta de entrada
- ✅ **Base64 Encoding**: Eficiente para transferência
- ✅ **OpenRouter Integration**: Roteamento automático de modelos
- ✅ **Fastify Multipart**: Suporte nativo a upload de arquivos

## Variáveis de Ambiente

- `OPENROUTER_API_KEY` (obrigatório): Chave de API do OpenRouter

## Limitações Técnicas

### Tamanho de Arquivo

- **Máximo padrão**: 10 MB (configurável em `server.ts`)
- **Recomendado**: < 5 MB para melhor performance

### Modelos e Capacidades de Visão

| Modelo                | Tipos Suportados          | Resolução     | Limites                         |
| --------------------- | ------------------------- | ------------- | ------------------------------- |
| Gemini 2.5 Flash Lite | PDF, PNG, JPEG, GIF, WebP | Até 4K        | 20 imagens/request              |
| Claude 3.5 Sonnet     | PDF, PNG, JPEG, GIF, WebP | Até 20M px    | 20 imagens/request              |
| GPT-4o                | PNG, JPEG, GIF, WebP      | Até 4096x4096 | Apenas imagens (não PDF direto) |

### Conversão de PDF

- PDFs são convertidos para base64 (não há conversão para imagem intermediária)
- Alguns modelos podem precisar de pré-processamento adicional

## Casos de Uso

### 1. Análise de Invoices/Notas Fiscais

```bash
curl -X POST http://localhost:3000/chat \
  -F "question=Qual é o valor total e a data da nota fiscal?" \
  -F "file=@invoice.pdf"
```

### 2. Extração de Dados de Contratos

```bash
curl -X POST http://localhost:3000/chat \
  -F "question=Quais são as partes envolvidas e a data de início?" \
  -F "file=@contract.pdf"
```

### 3. Q&A sobre Relatórios

```bash
curl -X POST http://localhost:3000/chat \
  -F "question=Qual foi o crescimento percentual em relação ao ano anterior?" \
  -F "file=@report.pdf"
```

### 4. Análise de Apresentações

```bash
curl -X POST http://localhost:3000/chat \
  -F "question=Qual é a proposta de valor apresentada?" \
  -F "file=@presentation.pdf"
```

## Próximos Passos para Expansão

1. **Batch Processing**: Processar múltiplos documentos em paralelo
2. **Document Chunking**: Dividir PDFs grandes em seções
3. **Cache de Documentos**: Armazenar análises para reutilização
4. **Extração Estruturada**: Usar `generateObject` com Zod para dados estruturados
5. **OCR Fallback**: Processar imagens de documentos escaneados
6. **Multi-language**: Suporte a análise em idiomas diversos
7. **Document Store**: Armazenar documentos processados em banco de dados
8. **Async Processing**: Queue para documentos grandes
9. **Summarization**: Gerar resumos automáticos de documentos
10. **Comparison**: Comparar múltiplos documentos

## Comparação: Modelos Multimodais vs Text-Only

| Aspecto          | Multimodal      | Text-Only            |
| ---------------- | --------------- | -------------------- |
| Análise visual   | ✅ Nativa       | ❌ Requer OCR        |
| Tabelas/Gráficos | ✅ Direto       | ❌ Precisa conversão |
| Formatação       | ✅ Compreendida | ❌ Perdida           |
| Velocidade       | ⚡⚡ Rápido     | ⚡ Muito rápido      |
| Custo            | 💰 Moderado     | 💰 Mais barato       |
| Precisão         | 🎯 Alta         | 🎯 Pode variar       |

## Recursos Adicionais

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [Google Gemini Vision API](https://ai.google.dev/gemini-api/docs/vision)
- [Claude Vision Capabilities](https://docs.anthropic.com/vision/vision-intro)
- [GPT-4 Vision API](https://platform.openai.com/docs/guides/vision)
- [Fastify Documentation](https://www.fastify.io/)
- [Zod Schema Validation](https://zod.dev/)

## Troubleshooting

### API Key inválida

```bash
# Verificar .env
cat .env

# Testar conexão com OpenRouter
curl https://openrouter.ai/api/v1/auth/key \
  -H "Authorization: Bearer YOUR_KEY"
```

### Erro "Only PDF files are supported"

```bash
# Verificar MIME type do arquivo
file -b --mime-type document.pdf

# Usar ferramenta para converter para PDF válido
# ffmpeg, ImageMagick, ou online converter
```

### Timeout em PDFs grandes

```bash
# Aumentar timeout no Fastify
app = Fastify({ requestTimeout: 30000 })

# Ou reduzir tamanho máximo e pedir múltiplos uploads
limits: { fileSize: 5 * 1024 * 1024 } // 5MB ao invés de 10MB
```

### Modelo não suportado

```bash
# Verificar disponibilidade em OpenRouter
curl https://openrouter.ai/api/v1/models

# Trocar modelo em config.ts
models: [
  'anthropic/claude-3-opus',
  'openai/gpt-4-vision'
]
```

## Contribuindo

Para expandir este exemplo:

1. Adicione novos nós em `src/graph/nodes/` para pré-processamento
2. Implemente cache de documentos em `src/services/`
3. Adicione testes E2E em `tests/`
4. Crie utilitários de conversão em `src/utils/`
5. Expanda prompts do sistema conforme necessário
