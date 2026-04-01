# WebAI Interativa

Nesse exemplo, apenas expandimos a WebAI para um conceito mais User Friendly, permitindo fácil customização de temperatura e topK sem necessidade de alteração de código fonte.

## Stack

**Client:** NodeJs

## Libs em Destaque

WebAI do Chrome

## Estrutura do Projeto

- `index.html` - Estrutura base da página
- `index.js` - Lógica de integração com o WebAI

## Demo

Para uma pergunta aberta, um grau de liberdade em temperatura dá maior variedade de palavras para o modelo, como em:
<img width="911" height="757" alt="image" src="https://github.com/user-attachments/assets/05c789e8-4d8d-41e2-8234-da97ce6e8c0c" />

E quanto mais aumentamos seu topK, mais variação no tipo de resposta temos:
<img width="952" height="931" alt="image" src="https://github.com/user-attachments/assets/9ed51781-5cc5-4ef2-9408-fb36705c1daf" />


Já uma temperatura muito baixa nos entrega sempre uma resposta curta e objetiva, mesmo que se aumente seu topK:
<img width="939" height="756" alt="image" src="https://github.com/user-attachments/assets/b5d7394a-de0a-48f6-bece-97921c0a4343" />
<img width="927" height="752" alt="image" src="https://github.com/user-attachments/assets/62f5c66c-1eb1-47c2-8208-bf0465d5ad2b" />



## Roteiro para execução

1. Instalar as dependências
```
yarn
```

2. Iniciar a aplicação:
```
yarn start
```

3. Abrir no browser `http://localhost:8080`

## Métodos em Destaque

Definição do prompt inicial na criação do Modelo de Linguagem 
```javascript
   const session = await LanguageModel.create({
        expectedInputLanguages: ["pt"],
        temperature: temperature,
        topK: topK,
        initialPrompts: [
            {
                role: 'system', content: `
                Você é um assistente de IA que responde de forma clara e objetiva.
                Responda sempre em formato de texto ao invés de markdown`

            },
        ],
    });
```
