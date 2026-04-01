# Vibe Coding com MCP Context7

Nesse exemplo, utilizaremos o MCP Context7 para criar um projeto Next.js com Better Auth, configurado para autenticação social via GitHub e persistência local com SQLite. O objetivo é demonstrar como o Context7 pode ser utilizado para consultar documentação, gerar código e configurar um projeto completo de autenticação, seguindo as melhores práticas recomendadas pela equipe do Better Auth. Com isso, alcançamos uma aplicação funcional que permite login social e exibe informações do usuário autenticado, tudo isso utilizando o poder do MCP Context7 para facilitar o desenvolvimento.

## Stack

**Client:** VSCode com extensão do Context7 MCP

## Libs em Destaque

`context7` via MCP

## Estrutura do Projeto

- `prompt.md`: Exemplo de prompt para geração do projeto Next.js com Better Auth utilizando o Context7 MCP
- `ProjetoVibeCoded`: Código gerado pelo Context7 MCP para o projeto de autenticação com Next.js e Better Auth

## Demo

Tela inicial do Projeto Vibe Coded:

<img width="795" height="345" alt="image" src="https://github.com/user-attachments/assets/44c1cfd3-54e9-4335-9b01-9c0e3991f2d5" />


Tela de login com GitHub:

<img width="721" height="357" alt="image" src="https://github.com/user-attachments/assets/09dd3cbd-e2a8-4da4-9e82-9826431683a8" />


Tela de perfil exibindo informações do usuário autenticado:

<img width="692" height="410" alt="image" src="https://github.com/user-attachments/assets/bf65925b-87eb-48ad-8be0-9b32401c46fe" />




## Roteiro para execução

1. Acessar a página do projeto
```
cd ProjetoVibeCoded
```

2. Instalar as dependências
```
npm install
```

3. Iniciar a aplicação:
```
npm run dev
```

4. Abrir no browser `http://localhost:3000`

5. Clicar no botão de login com GitHub e seguir o processo de autenticação



## Funcionalidades

- Login social com GitHub utilizando Better Auth
- Persistência local de dados com SQLite
- Exibição de informações do usuário autenticado
