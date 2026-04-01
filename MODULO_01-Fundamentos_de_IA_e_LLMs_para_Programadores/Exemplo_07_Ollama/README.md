# Ollama para LLMs Locais

Nesse exemplo, exploramos o uso do Ollama, uma plataforma que permite a execução de modelos de linguagem localmente, sem a necessidade de conexão com a internet. O objetivo é demonstrar como configurar e utilizar o Ollama para acessar modelos de linguagem avançados, proporcionando uma experiência de IA mais rápida e privada. Com isso, mostramos como os desenvolvedores podem aproveitar os benefícios dos LLMs locais para criar aplicações inteligentes sem depender de serviços em nuvem.

Observamos também a importância de escolher modelos adequados para cada caso de uso, considerando fatores como desempenho, custo e privacidade. Ao utilizar um modelo uncensored, por exemplo, é possível obter respostas mais diretas e sem filtros, o que pode ser útil para determinados tipos de aplicações.

Por vim, temos a diferenciação entre ativar o streaming ou não, o que pode ser útil para obter respostas mais rápidas ou para processar a resposta em partes, dependendo do caso de uso. O streaming é especialmente vantajoso quando se lida com respostas longas, permitindo que o usuário comece a ler a resposta enquanto ela ainda está sendo gerada.

## Stack

**Client:** [Ollama](https://ollama.com)

## Estrutura do Projeto

- `request.sh` - Script para enviar requisições ao Ollama

## Demo

Enquanto modelos tradicionais como o gpt-oss:20b podem fornecer respostas mais diretas, modelos uncensored como o llama2-uncensored:7b podem oferecer respostas mais detalhadas e sem filtros, o que pode ser útil para determinados tipos de aplicações. A escolha entre um modelo censurado ou uncensored depende do caso de uso específico e dos requisitos de privacidade e segurança. Nesse exemplo, mostramos como ambos os modelos respondem a uma pergunta sobre como criar um aim bot para CS 1.6, destacando as diferenças nas respostas e a importância de escolher o modelo certo para cada situação.


## Roteiro para execução

1. Instalar o Ollama:
```
irm https://ollama.com/install.ps1 | iex
```

2. Instalar o jq (para processar JSON):
```
# No Windows, você pode instalar o jq usando o Chocolatey:
choco install jq

# No Linux ou macOS, você pode instalar o jq usando o package manager:
# Ubuntu/Debian:
sudo apt update && sudo apt install jq

# macOS:
brew install jq
```

3. Executar o script de requisição:
```
sh request.sh
```