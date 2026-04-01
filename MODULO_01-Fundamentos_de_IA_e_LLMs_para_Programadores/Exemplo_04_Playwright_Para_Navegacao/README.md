# MCP Playwright para Navegação Autônoma

Nesse exemplo, utilizaremos o MCP do Playwright para navegar de forma autônoma em um formulário e preencher os dados a partir de uma página de perfil. O objetivo é validar a capacidade do agente em extrair informações de uma página e utilizá-las para interagir com um formulário, sem a necessidade de submissão final. Com isso, alcançamos uma automação completa de navegação, extração de dados e preenchimento de formulários, demonstrando a eficácia do Playwright em cenários de navegação autônoma.

## Stack

**Client:** VSCode com extensão do Playwright e extensão do MCP do Playwright

## Libs em Destaque

`@playwright` via MCP

## Estrutura do Projeto

- `prompt.md`: Exemplo de prompt para geração dos testes de navegação autônoma

## Demo

## Roteiro para execução

1. Instalar a extensão do Playwright no VSCode

   `Ctrl + Shift + P ` no VSCode, `Install Extensions` e pesquisar por `Playwright`

2. Instalar o MCP do Playwright no VSCode

   `Ctrl + Shift + P ` no VSCode, `Install Extensions` e pesquisar por `@mcp playwright`

3. Baixar a [extensão do Playwright](https://chromewebstore.google.com/detail/playwright-mcp-bridge/mmlmfjhmonkocbjadbfplnigmagldckm) no Chrome

4. Configurar o MCP do Playwright do VSCode no arquivo `mcp.json` com o `PLAYWRIGHT_MCP_EXTENSION_TOKEN` da extensão do Chrome e os args como ` ["@playwright/mcp@latest", "--extension"]` para permitir a comunicação entre o VSCode e o navegador

5. Copiar o conteúdo do `prompt.md` ou criar uma nova tarefa de automação e executá-la na aba de Chat do VSCode com o MCP do Playwright para iniciar a navegação autônoma

7. Acompanhar a execução da navegação e validar o resultado gerado pelo agente através do MCP