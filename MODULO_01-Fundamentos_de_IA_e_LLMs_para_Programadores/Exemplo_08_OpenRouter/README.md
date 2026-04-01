# OpenRouter 

Nesse exemplo, exploramos o uso do OpenRouter, uma plataforma que permite a execução de modelos de linguagem sem a necessidade de baixar os modelos localmente. O objetivo é demonstrar como configurar e utilizar o OpenRouter para acessar modelos de linguagem avançados, proporcionando uma experiência de IA mais rápida e eficiente. Além disso, o OpenRouter oferece uma interface unificada para acessar diversos modelos de linguagem, facilitando a integração e o desenvolvimento de aplicações inteligentes. 

## Stack

**Client:** [OpenRouter](https://openrouter.ai)

## Estrutura do Projeto

- `.env` - Deve ser criado a partir do arquivo `.env.example`, contendo as chaves de API necessárias para acessar os modelos de linguagem através do OpenRouter.
- `request.sh` - Script para enviar requisições ao OpenRouter

## Demo

Na demonstração, é feita uma simples pergunta solicitando uma curiosidade sobre LLMs. O OpenRouter processa a requisição e retorna uma resposta gerada pelo modelo de linguagem, exibindo não apenas a resposta, mas também o raciocínio por trás da resposta, o que pode ser útil para entender como o modelo chegou àquela conclusão. Essa funcionalidade é especialmente valiosa para aplicações que exigem transparência e explicações detalhadas sobre as respostas geradas pelos modelos de linguagem.

<img width="936" height="679" alt="image" src="https://github.com/user-attachments/assets/36438913-8018-4365-8dbc-9e52fad0fce3" />



## Roteiro para execução

1. Criar o arquivo `.env` a partir do arquivo `.env.example`
```
cp .env.example .env
```

2. Se cadastrar no OpenRouter e obter as chaves de API necessárias para acessar os modelos de linguagem em [https://openrouter.ai/workspaces/default/keys](https://openrouter.ai/workspaces/default/keys)

3. Substituir as chaves de API no arquivo `.env` pelas chaves obtidas no passo anterior em `OPENROUTER_API_KEY`

4. Executar o script de requisição:
```
sh request.sh
```

5. Opcionalmente, alterar o modelo utilizado no script `request.sh` em `NLP_MODEL` para testar diferentes modelos de linguagem disponíveis no OpenRouter, como o `google/gemma-3-27b-it:free` ou o `openai/gpt-oss-120b:free`.
