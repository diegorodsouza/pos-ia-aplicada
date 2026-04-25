import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres"
import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store"
import { config } from "../config"

export type MemoryService = {
  checkpointer: PostgresSaver
  store: PostgresStore
}

// Configurando o histórico de conversas para ser armazenado em um banco de dados PostgreSQL.

// O PostgresStore é responsável por armazenar o estado da conversa, enquanto o PostgresSaver é usado para criar pontos de
// verificação (checkpoints) do estado da conversa, permitindo que o sistema recupere o contexto em interações futuras. Essa
// configuração é essencial para manter um histórico persistente das conversas, o que é crucial para personalizar as respostas do
// chatbot com base nas preferências e no contexto do usuário ao longo do tempo.

export async function createMemoryService(): Promise<MemoryService> {
  const dbUri = config.memory.dbUri
  const store = PostgresStore.fromConnString(dbUri)

  const checkpointer = PostgresSaver.fromConnString(dbUri)

  await store.setup()
  await checkpointer.setup()

  console.log("✅ Memoria configurada com PostgreSQL")

  return {
    checkpointer,
    store
  }
}
