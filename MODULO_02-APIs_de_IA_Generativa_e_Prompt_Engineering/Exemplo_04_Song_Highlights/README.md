# Song Highlights - Recomendador Musical com Memória

Este exemplo demonstra como construir um chat de recomendação musical com **LangGraph**, **OpenRouter** e persistência de memória por usuário.

A aplicação roda em **CLI** e conversa com o usuário em múltiplas trocas. Durante a interação, o grafo identifica preferências musicais, salva contexto em banco e reutiliza essas informações em novas sessões do mesmo usuário.

## Stack

**Runtime:** Node.js

**IA e Orquestração:** LangGraph, LangChain, OpenRouter

**Persistência:** PostgreSQL para memória de conversa e SQLite local para preferências do usuário

**Testes:** `node:test`

## O que este exemplo mostra

1. Persistência de memória de conversa com `@langchain/langgraph-checkpoint-postgres`.
2. Armazenamento de preferências do usuário em SQLite `better-sqlite3`.
3. Roteamento condicional no grafo entre chat, salvamento de preferências e sumarização.
4. Personalização de respostas com base no histórico e no contexto já aprendido.
5. Testes E2E cobrindo extração, persistência e recuperação de memória.

## Estrutura do projeto

- `src/index.ts` - Interface de chat em CLI.
- `src/config.ts` - Configuração do modelo e da persistência.
- `src/graph/graph.ts` - Definição do `StateGraph` e das transições.
- `src/graph/factory.ts` - Factory que monta o grafo com dependências.
- `src/graph/nodes/` - Nodes do fluxo, como chat, sumarização e salvamento.
- `src/services/openrouterService.ts` - Wrapper de integração com OpenRouter.
- `src/services/memoryService.ts` - Checkpointer e store de memória em PostgreSQL.
- `src/services/preferencesService.ts` - Persistência das preferências em SQLite.
- `src/prompts/` - Prompts usados para chat, extração e sumarização.
- `tests/chat.e2e.test.ts` - Testes E2E do comportamento do grafo.
- `langgraph.json` - Configuração para executar o grafo no LangGraph CLI/Studio.

## Fluxo do grafo

```text
START -> chat -> (savePreferences | summarize | END)
savePreferences -> (summarize | END)
summarize -> END
```

### Como funciona

- O node `chat` gera a resposta com base na conversa atual e no contexto do usuário.
- Se houver informações úteis, o grafo extrai preferências e segue para `savePreferences`.
- Quando a conversa precisa ser condensada, o fluxo segue para `summarize`.
- Um histórico da conversa e salvo no PostgreSql identificado por uma `thread_id`.
- As preferências ficam registradas por `userId`, permitindo reaproveitamento entre sessões diferentes do mesmo usuário.

## Pré-requisitos

- Node.js 24.10 ou superior.
- Docker e Docker Compose para subir o PostgreSQL local.
- Uma chave da OpenRouter.

## Instalação

```bash
npm install
```

## Configuração

Crie um arquivo `.env` com base em `.env.example`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_HTTP_REFERER=http://localhost:3000
OPENROUTER_X_TITLE=Song-Recommender

LANGSMITH_API_KEY=your_langsmith_api_key_here
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=04-song-highlights
```

O banco usado pela memória de conversa é configurado em `src/config.ts` e aponta para um PostgreSQL local:

```text
postgresql://postgres:mysecretpassword@localhost:5432/song_recommender
```

## Como executar

1. Suba o PostgreSQL local:

```bash
npm run docker:up
```

2. Abra o chat interativo com um usuário padrão:

```bash
npm run chat:erickwendel
```

3. Ou use outro usuário pré-configurado:

```bash
npm run chat:ana
```

4. Digite mensagens no terminal e encerre com `exit`.

## Scripts disponíveis

```bash
# Inicia o PostgreSQL via Docker Compose
npm run docker:up
# Para e remove os containers do Docker
npm run docker:down
# Exibe logs dos containers (útil para depuração)
npm run docker:logs
# Inicia o chat interativo como usuário "erickwendel"
npm run chat:erickwendel
# Inicia o chat interativo como usuário "ana"
npm run chat:ana
# Executa os testes uma vez
npm run test
# Executa os testes no modo watch (re-executa automaticamente)
npm run test:watch
# Serve o grafo LangGraph localmente
npm run langgraph:serve
```

## Testes

Os testes E2E validam cenários como:

- extração e salvamento de preferências do usuário;
- manutenção de histórico entre múltiplas mensagens;
- recuperação de contexto em novas sessões;
- compartilhamento de preferências entre threads do mesmo usuário;
- respostas simples quando não há extração de preferências.

Execute com:

```bash
npm test
```

## LangGraph Studio

O projeto também pode ser aberto no LangGraph Studio usando a configuração em `langgraph.json`.

Para servir o grafo localmente:

```bash
npm run langgraph:serve
```

O grafo exposto é `song_highlights`, definido como `./src/graph/factory.ts:graph`.

## Exemplo de uso

```text
Você: Oi, meu nome é Alex e eu gosto de rock e metal.
AI: ...

Você: Você lembra do meu gosto musical?
AI: ...
```

Nesse fluxo, o sistema usa a memória persistida para adaptar a conversa e sugerir músicas mais compatíveis com o perfil aprendido.

## Observações

- A memória de conversa usa PostgreSQL para checkpoints e store.
- As preferências são salvas em um banco SQLite local por simplicidade didática.
- O projeto foi pensado para demonstração de padrões de estado, memória e personalização em LangGraph
