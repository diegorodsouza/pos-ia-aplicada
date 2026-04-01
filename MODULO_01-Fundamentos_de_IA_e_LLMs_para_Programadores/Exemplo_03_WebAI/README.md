# WebAI

Nesse exemplo, é necessário o uso do navegador Chrome para testarmos a capacidade de sua WebAI. Nele, podemos executar um modelo Gemini Nano já incluso no navegador para fazer perguntas e obter respostas diretamente no console do navegador.

## Stack

**Client:** Javascript e Chrome

## Libs em Destaque

Apenas navegador


## Demo

Para uma pergunta direta como "Quem inventou o JavaScript?", obtivemos como resposta:
<img width="677" height="170" alt="image" src="https://github.com/user-attachments/assets/b200e279-edea-4ce6-8f57-2a7392279b1c" />


Para algo mais abstrato como um pedido "Construa uma frase começando com: O céu ..." e com uma temperatura baixa, temos:

<img width="414" height="138" alt="image" src="https://github.com/user-attachments/assets/ed9a9972-2cbb-45fb-9bf2-4e8f41af2e4e" />



Contudo, aumentando a temperatura e o topK, damos liberdade para respostas mais criativas, como:

<img width="653" height="142" alt="image" src="https://github.com/user-attachments/assets/1f73ccd3-4cad-4f1d-8b04-dd482dba1fe4" />

E cada atualização da página gera uma resposta totalmente diferente.


## Roteiro para execução

1. Logar no navegador Chrome para que a WebAI funcione corretamente
   
2. Ativar o WebAI no Google Chrome, permitindo as seguintes flags
```
chrome://flags/#optimization-guide-on-device-model
```
```
chrome://flags/#prompt-api-for-gemini-nano
```

3. Verificar se todos os requisitos de hardware para o WebAI foram atingidos, acessando:
```
chrome://on-device-internals/
```

4. Verificar as informações do status do download do modelo através do console do navegador pelo comando:
```
LanguageModel.availability();
```




## Funcionalidades

- Definição de Temperatura e TopK do modelo, que definem o grau de liberdade das respostas
- Definição de initialPrompts e pergunta, permitindo customização da especificidade da resposta
