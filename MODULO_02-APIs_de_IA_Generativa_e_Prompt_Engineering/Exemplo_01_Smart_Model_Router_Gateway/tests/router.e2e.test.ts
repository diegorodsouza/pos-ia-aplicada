import test from "node:test"
import assert from "node:assert/strict"
import { createServer } from "../src/server.ts"
import { config } from "../src/config.ts"
import { type LLMResponse, OpenRouterService } from "../src/openrouterService.ts"

console.assert(process.env.OPENROUTER_API_KEY, "OPENROUTER_API_KEY is not set in env variables")

// Teste para verificar se a rota está direcionando para o modelo mais barato,
// conforme a configuração do provider.sort.by no config.ts.
// O modelo 'qwen/qwen3.6-plus:free' é o mais barato entre os listados,
// então esperamos que ele seja o modelo utilizado para responder à pergunta.
test("routes to cheapest model by default", async () => {
  const customConfig = {
    ...config,
    provider: {
      ...config.provider,
      sort: {
        ...config.provider.sort,
        by: "price"
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

  assert.match(body.model, /^arcee-ai\/trinity-large-preview(?:-\d+)?:free$/)
})

// Teste para verificar se a rota está direcionando para o modelo com maior throughput,
// conforme a configuração do provider.sort.by no config.ts.
// O modelo 'nvidia/nemotron-3-nano-30b-a3b:free' é o que tem maior throughput entre os listados,
// então esperamos que ele seja o modelo utilizado para responder à pergunta.
test("routes to highest throughput model by default", async () => {
  const customConfig = {
    ...config,
    provider: {
      ...config.provider,
      sort: {
        ...config.provider.sort,
        by: "throughput"
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

  assert.match(body.model, /^nvidia\/nemotron-3-nano-30b-a3b(?:-\d+)?:free$/)
})

// Teste para verificar se a rota está direcionando para o modelo com menor latência,
// conforme a configuração do provider.sort.by no config.ts.
// O modelo 'liquid/lfm-2.5-1.2b-thinking:free' é o que tem menor latência entre os listados,
// então esperamos que ele seja o modelo utilizado para responder à pergunta.
test("routes to lowest latency model by default", async () => {
  const customConfig = {
    ...config,
    provider: {
      ...config.provider,
      sort: {
        ...config.provider.sort,
        by: "latency"
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

  assert.match(body.model, /^nvidia\/nemotron-3-nano-30b-a3b(?:-\d+)?:free$/)
})
