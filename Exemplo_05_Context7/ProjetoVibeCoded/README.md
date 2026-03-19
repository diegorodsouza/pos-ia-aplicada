# Demo: Next.js + Better Auth + GitHub + SQLite

Demo simples usando App Router com login social GitHub e persistencia local em SQLite.

## Requisitos

- Node.js 20+
- npm

## 1) Configure variaveis de ambiente

Crie o arquivo .env a partir de .env.example e preencha os valores:

- BETTER_AUTH_URL=http://localhost:3000
- BETTER_AUTH_SECRET=um-segredo-grande-e-aleatorio
- GITHUB_CLIENT_ID=seu-client-id
- GITHUB_CLIENT_SECRET=seu-client-secret

No GitHub OAuth App, configure callback para:

- http://localhost:3000/api/auth/callback/github

## 2) Instale dependencias

npm install

## 3) Gere as tabelas de autenticacao

npx @better-auth/cli migrate

Esse comando cria o arquivo local betterauth.sqlite (e tabelas) no projeto.

## 4) Rode o projeto

npm run dev

Abra:

- http://localhost:3000
- http://localhost:3000/login

## Fluxo esperado

- Login: botao Entrar com GitHub inicia OAuth.
- Home: mostra Logado como <email/nome> quando autenticado.
- Logout: botao Sair encerra a sessao.
