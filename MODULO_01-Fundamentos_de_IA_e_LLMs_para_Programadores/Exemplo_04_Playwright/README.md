# MCP Playwright

Nesse exemplo, dada uma URL, um agente configura e cria testes para essa aplicação utilizando o MCP do Playwright de forma totalmente autonoma a partir de um prompt diretamente no VSCode. Se algum teste falhar, o agente lê os relatórios do Playwright e ajusta até que passem. Além disso, gera também as Github Actions, para garantir o fluxo de integração contínua.

## Stack

**Client:** Javascript

## Libs em Destaque

`@playwright` via MCP

## Estrutura do Projeto

- `prompts` - Estrutura de prompts para gerar os testes
- `project-scaffolding.md` - Cria o projeto base para validar que o Playwright está funcionando
- `generate_test.prompt.md` - Comandos para explicar para o agente como utilizar o Playwright MCP e gerar testes
- `generate-tests.md` - Exemplos genéricos de casos de teste que o agente deve validar na aplicação
- `Demais pastas` - Geradas pelo Agente

## Demo

Página de Testes:
<img width="1030" height="529" alt="image" src="https://github.com/user-attachments/assets/adf884a2-3275-492d-b6b1-9080ecb076ac" />


Testes realizados:
<img width="1171" height="431" alt="image" src="https://github.com/user-attachments/assets/e10cb145-4844-4cf3-8a0d-4994cf697679" />

Detalhamento de cada teste:
<img width="975" height="659" alt="image" src="https://github.com/user-attachments/assets/e30958c4-d93e-4c97-8d0c-0d8496584b0c" />




## Roteiro para execução

1. Instalar a extensão do Playwright no VSCode

    `Ctrl + Shift + P ` no VSCode, `Install Extensions` e pesquisar por `Playwright`


2. Instalar o MCP do Playwright no VSCode

    `Ctrl + Shift + P ` no VSCode, `Install Extensions` e pesquisar por `@mcp playwright`

3. Baixar a [extensão do Playwright](https://chromewebstore.google.com/detail/playwright-mcp-bridge/mmlmfjhmonkocbjadbfplnigmagldckm) no Chrome

4. Configurar o MCP do Playwright do VSCode no arquivo `mcp.json` com o `PLAYWRIGHT_MCP_EXTENSION_TOKEN` da extensão do Chrome 

5. Executar o  `project-scaffolding.md` no Chat do VSCode (que pode ser acessado por `Ctrl + Shift + I `)
   
6. Adicionar o arquivo `generate_test.prompt.md` como contexto do Chat e enviar o conteúdo do arquivo `generate-tests.md`

7. Acompanhar a execução dos testes e validar o código gerado pelo agente através do MCP

8. Alternativamente, é possível rodar os testes manualmente pelo comando
    ```
   npm run test:headed
   ```
    
9. Também é possível acessar os testes executados rodando o comando abaixo e visitando o site `http://localhost:9323`
   ```
   npx playwright show-report
   ``` 
