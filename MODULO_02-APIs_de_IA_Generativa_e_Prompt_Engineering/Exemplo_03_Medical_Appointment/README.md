# Medical Appointment - Agendamento e Cancelamento com LangGraph

Neste exemplo, construimos um fluxo conversacional para **agendar** e **cancelar** consultas medicas usando LangGraph, Fastify e OpenRouter.

A aplicacao recebe uma pergunta em linguagem natural, identifica a intencao do usuario, executa a acao correspondente (agendar/cancelar) e devolve uma resposta amigavel ao paciente.

## Stack

**Server:** Node.js, TypeScript (executado com Node), Fastify, LangGraph, LangChain, OpenRouter

## Libs em Destaque

`@langchain/langgraph` para orquestracao por grafo (nodes, edges e roteamento condicional)
`langchain` para mensagens e criacao de agentes com resposta estruturada
`@langchain/openai` para integrar com endpoint OpenRouter
`zod` para schema de estado e validacao de saida estruturada
`fastify` para API HTTP (`POST /chat`)

## Estrutura do Projeto

- `src/index.ts` - Entry point do servidor Fastify
- `src/server.ts` - Rota `/chat` que invoca o grafo
- `src/config.ts` - Configuracao de modelos e chave da OpenRouter
- `src/graph/graph.ts` - Definicao do StateGraph e roteamento por intencao
- `src/graph/factory.ts` - Factory que injeta dependencias no grafo
- `src/graph/nodes/identifyIntentNode.ts` - Classifica intencao e extrai dados da consulta
- `src/graph/nodes/schedulerNode.ts` - Agenda consulta no servico local
- `src/graph/nodes/cancellerNode.ts` - Cancela consulta no servico local
- `src/graph/nodes/messageGeneratorNode.ts` - Gera mensagem final para o paciente
- `src/services/openRouterService.ts` - Wrapper de chamada ao modelo com structured output
- `src/services/appointmentService.ts` - Regras de negocio em memoria (profissionais e consultas)
- `src/prompts/v1/identifyIntent.ts` - Prompt de classificacao de intencao
- `src/prompts/v1/messageGenerator.ts` - Prompt de geracao de resposta ao usuario
- `tests/router.e2e.test.ts` - Testes E2E do endpoint `/chat`
- `langgraph.json` - Config para execucao no LangGraph CLI/Studio

## O que este exemplo demonstra

1. **Classificacao de intencao com LLM**: identifica se o usuario quer agendar, cancelar ou outro assunto.
2. **Extracao estruturada**: retorna campos como `professionalId`, `datetime`, `patientName` e `reason`.
3. **Roteamento condicional em grafo**: direciona para `schedule`, `cancel` ou `message`.
4. **Separacao de responsabilidades**: prompts, regra de negocio, orquestracao e API desacoplados.
5. **Resposta final humanizada**: mensagem clara, empatica e contextual para cada cenario.

## Fluxo do Grafo

```text
START -> identifyIntent -> (schedule | cancel | message) -> message -> END
```

### Roteamento

- Se `intent = schedule`: tenta agendar consulta e depois gera mensagem de confirmacao/erro.
- Se `intent = cancel`: tenta cancelar consulta e depois gera mensagem de confirmacao/erro.
- Se `intent = unknown` ou houver erro na identificacao: vai direto para `message` com orientacao ao usuario.

## Roteiro para Execucao

1. Instalar dependencias:

```bash
npm install
```

2. Criar `.env` baseado em `.env.example`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here

LANGSMITH_API_KEY=your_langsmith_api_key_here
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=03-medical-appointment
```

3. Rodar em desenvolvimento:

```bash
npm run dev
```

4. Servidor disponivel em:

```text
http://localhost:3000
```

5. Testar endpoint `/chat`:

```bash
curl -X POST http://localhost:3000/chat \
	-H "Content-Type: application/json" \
	-d '{"question":"Ola, sou Maria Santos e quero agendar uma consulta com Dr. Alicio da Silva para amanha as 16h para um check-up regular"}'
```

Exemplo de resposta esperada (campos principais):

```json
{
  "intent": "schedule",
  "actionSuccess": true,
  "messages": [{ "content": "...mensagem de confirmacao..." }]
}
```

6. **(Opcional) Servir o grafo localmente com LangGraph Studio para visualização:**

```
npm run langgraph:serve
```

7. Abrir a interface do LangGraph Studio no navegador (geralmente `http://https://smith.langchain.com/studio?baseUrl=http://localhost:2024`)

8. Testar o grafo na interface do LangGraph Studio:
   - Clique no botão **"Messages"** para enviar mensagens de teste
   - Envie mensagens como `"Me chamo André e gostaria de agendar uma consulta com o Dr. Alicio para amanhã as 16h"` ou `"Sou o André e gostaria de cancelar a consulta de amanhã as 16h com o Alicio"` para testar os diferentes fluxos
   - Observe a execução visual do grafo em tempo real
   - Acompanhe o estado em cada node conforme o processamento avança
   - Verifique os outputs e as transformações em cada etapa
   - Explore diferentes inputs para testar os diferentes fluxos (uppercase, lowercase, fallback)

9. **(Opcional) Executar testes E2E automatizados:**

```
npm test
```

Ou em modo watch para desenvolvimento:

```
npm run test:dev

O projeto possui cenarios de:

- agendamento com sucesso
- cancelamento com sucesso

## Funcionalidades

- ✅ API HTTP para conversacao (`POST /chat`)
- ✅ Identificacao de intencao com resposta estruturada
- ✅ Extracao de dados de consulta (medico, horario, paciente)
- ✅ Agendamento e cancelamento em servico de dominio
- ✅ Mensagens finais personalizadas para sucesso/erro
- ✅ Fluxo modelado com LangGraph + edges condicionais
- ✅ Testes E2E cobrindo o caminho principal

## Metodos em Destaque

### Metodo: `buildAppointmentGraph()`

Monta o StateGraph com nodes e transicoes:

```typescript
const workflow = new StateGraph({ stateSchema: AppointmentStateAnnotation })
  .addNode("identifyIntent", createIdentifyIntentNode(llmClient))
  .addNode("schedule", createSchedulerNode(appointmentService))
  .addNode("cancel", createCancellerNode(appointmentService))
  .addNode("message", createMessageGeneratorNode(llmClient))
  .addEdge(START, "identifyIntent")
  .addConditionalEdges(
    "identifyIntent",
    (state) => {
      if (state.error || !state.intent || state.intent === "unknown") return "message"
      return state.intent
    },
    {
      schedule: "schedule",
      cancel: "cancel",
      message: "message"
    }
  )
  .addEdge("schedule", "message")
  .addEdge("cancel", "message")
  .addEdge("message", END)
```

### Metodo: `POST /chat`

Recebe pergunta em linguagem natural e invoca o grafo com `HumanMessage`:

```typescript
const response = await graph.invoke({
  messages: [new HumanMessage(question)]
})
```

### Metodo: `generateStructured()`

No servico OpenRouter, encapsula chamada ao modelo com `responseFormat` baseado em Zod para obter saida validada:

```typescript
const agent = createAgent({
  model: this.llmClient,
  tools: [],
  responseFormat: providerStrategy(schema)
})
```

## LangGraph Studio (Opcional)

Para visualizar o grafo localmente:

```bash
npm run langgraph:serve
```

Configuracao em `langgraph.json`:

- graph id: `medical_appointments`
- entrypoint: `./src/graph/factory.ts:graph`

## Observacoes

- O servico de consultas usa armazenamento em memoria (`appointmentService.ts`) para fins didaticos.
- Em producao, substituir por persistencia real (banco de dados) e controles de concorrencia.
- O projeto exige Node.js com suporte a execucao direta de TypeScript conforme definido em `package.json`.
