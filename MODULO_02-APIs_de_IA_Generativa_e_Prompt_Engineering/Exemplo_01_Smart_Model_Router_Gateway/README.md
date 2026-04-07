# Smart Model Router Gateway

Nesse exemplo, exploramos a implementação de um **gateway inteligente de roteamento de modelos LLM** utilizando a API OpenRouter. O objetivo é demonstrar como criar um servidor que roteia requisições para diferentes modelos de linguagem de forma dinâmica, podendo otimizar por preço, latência ou throughput. Isso permite construir aplicações resilientes que aproveitam múltiplos provedores de modelos com inteligência de roteamento.

## Stack

**Server:** Node.js, TypeScript, Fastify

## Libs em Destaque

`@openrouter/sdk` para integração com a API OpenRouter
`fastify` para criar um servidor HTTP rápido e eficiente
`node:test` para testes E2E nativos do Node.js

## Estrutura do Projeto

- `config.ts` - Configurações centralizadas (modelos, provider, temperatura, etc.)
- `openrouterService.ts` - Serviço que encapsula a lógica de chamada à OpenRouter
- `server.ts` - Criação do servidor Fastify com rota `/chat`
- `index.ts` - Script principal que inicia o servidor
- `tests/router.e2e.test.ts` - Testes E2E que validam o roteamento por preço, latência e throughput

## O que é Smart Model Routing?

Smart Model Routing é um padrão arquitetural que permite:

1. **Abstração de múltiplos modelos**: Manter uma lista de modelos disponíveis
2. **Critério de seleção dinâmico**: Rotear para o modelo mais barato, mais rápido ou com melhor latência
3. **Resiliência**: Se um modelo falhar, tentar o próximo da lista
4. **Otimização de custos**: Rotear automaticamente para modelos com melhor custo-benefício
5. **Transparência para o cliente**: O cliente envia um único prompt e recebe a resposta, sem conhecer o modelo usado

## Demo

O servidor expõe um endpoint `/chat` que aceita uma pergunta e retorna a resposta do modelo selecionado. A seleção pode ser feita por:

- **Preço**: Roteia para o modelo mais barato
- **Throughput**: Roteia para o modelo com maior capacidade de processamento
- **Latência**: Roteia para o modelo com menor latência

### Exemplo de requisição:

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{ "question": "O que é rate limiting?" }'
```

### Resposta esperada:

```json
{
  "model": "nvidia/nemotron-3-nano-30b-a3b:free",
  "content": "Rate limiting é uma técnica de controle de taxa que restringe o número de requisições..."
}
```

## Roteiro para execução

1. Instalar as dependências do projeto:

```
npm install
```

2. Configurar as variáveis de ambiente criando um arquivo `.env` baseado em `.env.example`:

```bash
OPENROUTER_API_KEY=sua_chave_aqui
```

3. Iniciar o servidor em modo desenvolvimento:

```
npm run dev
```

4. O servidor estará disponível em `http://localhost:3000`

5. Fazer uma requisição para testar:

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{ "question": "Explique o que é machine learning em uma frase" }'
```

6. Executar os testes E2E:

```
npm test
```

7. Executar os testes em modo watch:

```
npm run test:dev
```

## Funcionalidades

- ✅ Roteamento inteligente entre múltiplos modelos LLM
- ✅ Suporte a diferentes critérios de seleção (preço, latência, throughput)
- ✅ Servidor HTTP com validação de schema (Fastify)
- ✅ Configuração centralizada e facilmente extensível
- ✅ Integração com OpenRouter para acesso a múltiplos provedores
- ✅ Testes E2E para validar comportamento do roteador
- ✅ Type-safe com TypeScript

## Métodos em Destaque

### Método: `generate()`

Responsável por enviar o prompt para a OpenRouter e retornar a resposta com informações do modelo selecionado:

```typescript
async generate(prompt: string): Promise<LLMResponse> {
  const response = await this.client.chat.send({
    models: this.config.models,  // Array de modelos para roteamento
    messages: [
      { role: 'system', content: this.config.systemPrompt },
      { role: 'user', content: prompt}
    ],
    stream: false,
    temperature: this.config.temperature,
    maxTokens: this.config.maxTokens,
    provider: this.config.provider as ChatGenerationParams['provider']
      // Define critério de seleção: price, latency, throughput
  })

  const content = String(response.choices.at(0)?.message.content) ?? ''
  return {
    model: response.model,  // Modelo selecionado pelo OpenRouter
    content,
  }
}
```

**Destaques:**

- Passa um array de modelos ao invés de um único modelo
- OpenRouter seleciona automaticamente o melhor modelo baseado no config.provider
- Retorna qual modelo foi selecionado, permitindo análise posterior

### Método: `POST /chat`

Rota HTTP que recebe a pergunta do usuário e retorna a resposta do modelo roteado:

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
      const response = await routerService.generate(question)
      return reply.send(response)
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
- Integração automática com o serviço de roteamento
- Tratamento de erros robusto

### Método: `Teste de Roteamento por Price`

Teste E2E que valida se o roteador seleciona o modelo mais barato:

```typescript
test("routes to cheapest model by default", async () => {
  const customConfig = {
    ...config,
    provider: {
      ...config.provider,
      sort: {
        ...config.provider.sort,
        by: "price" // Roteia pelo preço
      }
    }
  }
  const routerService = new OpenRouterService(customConfig)
  const app = createServer(routerService)

  const response = await app.inject({
    method: "POST",
    url: "/chat",
    body: { question: "What is rate limiting?" }
  })

  assert.equal(response.statusCode, 200)
  const body = response.json() as LLMResponse
  // Valida que o modelo selecionado é o mais barato
  assert.equal(body.model, "arcee-ai/trinity-large-preview:free")
})
```

**Destaques:**

- Testa comportamento com config customizado
- Usa `app.inject()` para testar sem rede real
- Valida tanto o status code quanto o modelo selecionado

## Fluxo de Roteamento

```
POST /chat
    ↓
Validação de schema (minLength: 5)
    ↓
OpenRouterService.generate(prompt)
    ↓
OpenRouter API Decision Engine
    ↓
┌─────────────────────────────────────────┐
│  Critério de Seleção (Provider Sort)    │
├─────────────────────────────────────────┤
│  Opções: price, latency, throughput     │
│  Seleciona melhor modelo da lista       │
└─────────────────────────────────────────┘
    ↓
Chamada ao modelo selecionado
    ↓
Response { model, content }
    ↓
JSON Response ao cliente
```

## Configuração de Roteamento

A seleção de modelos é controlada por `config.provider.sort`:

```typescript
provider: {
  sort: {
    by: 'throughput',  // 'price' | 'latency' | 'throughput'
    partition: 'none'  // Controla particionamento de modelos
  }
}
```

### Exemplos de configuração:

**Rotear pelo preço mais baixo:**

```typescript
by: "price"
```

**Rotear pelo melhor throughput:**

```typescript
by: "throughput"
```

**Rotear pela menor latência:**

```typescript
by: "latency"
```

## Variáveis de Ambiente

- `OPENROUTER_API_KEY` (obrigatório): Chave de API do OpenRouter (obtém em https://openrouter.ai)

## Configurações Avançadas (em `config.ts`)

- `models`: Array de modelos a rotear entre
- `temperature`: Controla criatividade (0.0 = determinístico, 1.0 = criativo)
- `maxTokens`: Limite de tokens na resposta
- `systemPrompt`: Instrução de sistema para todos os prompts
- `httpReferer` e `xTitle`: Headers obrigatórios da OpenRouter
- `port`: Porta do servidor (padrão: 3000)

## Recursos Adicionais

- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [OpenRouter SDK](https://github.com/openrouter/openrouter-node)
- [Fastify Documentation](https://www.fastify.io/)
- [Node.js Test Runner](https://nodejs.org/api/test.html)
