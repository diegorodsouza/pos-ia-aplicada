import { MultiServerMCPClient } from "@langchain/mcp-adapters"

export const getMCPTools = async () => {
  const mcpClient = new MultiServerMCPClient({
    filesystem: {
      transport: "stdio", //Executa de forma local, utilizando o stdio para comunicação
      command: "npx", //Comando para iniciar o processo filho
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        process.cwd() //Diretório atual do projeto, onde o servidor MCP de sistema de arquivos será iniciado
      ] //Argumentos para iniciar o servidor MCP de sistema de arquivos
    }
  })

  // Retorna toda a lista de ferramentas disponíveis nos MCP listados, que incluem a ferramenta de sistema de
  // arquivos e quaisquer outras ferramentas registradas
  return mcpClient.getTools()
}
