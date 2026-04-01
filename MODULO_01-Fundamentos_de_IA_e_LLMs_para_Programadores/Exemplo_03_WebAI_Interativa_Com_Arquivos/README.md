# WebAI Interativa com Arquivos

Nesse exemplo, apenas expandimos a WebAI para um conceito ainda maior, explorando a possibilidade multimodal, onde adicionamos a capacidade de receber e interpretar arquivos diretamente pelo navegador.

## Stack

**Client:** NodeJs

## Libs em Destaque

WebAI do Chrome

## Estrutura do Projeto

- `controllers` - Ponte responsável para escalar as interações de tela com os serviços correspondentes
- `services` - Lógica de integração com o WebAI e API de tradução
- `views` - Estrutura visual da página inicial
- `index.js` - Inicialização de serviços e com o carregamento da página inicial

## Demo

Como demonstrações, podemos enviar imagens para o modelo e solicitar descrições:
<img width="791" height="892" alt="image" src="https://github.com/user-attachments/assets/56fcba74-7fd4-4e38-b564-c6345753fdeb" />

Podemos também enviar audios e pedir resumos ou descrições:
<img width="802" height="901" alt="image" src="https://github.com/user-attachments/assets/fa84954c-c052-45b8-8a74-861beefdd1bc" />





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
