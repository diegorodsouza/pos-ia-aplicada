
# Exemplo de Tensores

Exemplo para compreender o uso de tensores na predição de resultados. Nesse exemplo, treinamos um modelo com base em 4 dados de pessoas distintas (Nome, idade, cor e localização) e assimilamos essas pessoas à uma categoria (Premium, Medium ou Basic). Na sequência, alimentamos o algoritmo com uma nova pessoa e o algoritmo analisa, com base nos padrões aprendidos anteriormente, em quais categorias essa pessoa se encaixaria e com qual grau de confiança.


## Stack

**Client:** Javascript

## Libs em Destaque

`@tensorflow/tfjs`


## Demo

Após 100 estudos do dataset, o algoritmo concluiu que uma pessoa com os dados:

`const pessoa = { nome: "Ze", idade: 28, cor: "azul", localizacao: "Curitiba" }`

tem 48.20% de compatibilidade com a categoria Basic, dados a seguinte base de conhecimento:

```
// const pessoas = [
//     { nome: "Erick", idade: 30, cor: "azul", localizacao: "São Paulo" },  // Premium
//     { nome: "Ana", idade: 25, cor: "vermelho", localizacao: "Rio" },      // Medium
//     { nome: "Carlos", idade: 40, cor: "verde", localizacao: "Curitiba" }  // Basic
// ];
```

Terminal:
<img width="301" height="103" alt="image" src="https://github.com/user-attachments/assets/3cf3ee27-9f16-4774-b10d-7dbfbc936a11" />



## Roteiro para execução

1. Instalar as dependências
```
npm install
```

2. Iniciar a aplicação:
```
npm start
```



## Métodos em Destaque

Alimentando o modelo com dados normalizados
```javascript
// Usamos apenas os dados numéricos, como a rede neural só entende números.
// tensorPessoasNormalizado corresponde ao dataset de entrada do modelo.
const tensorPessoasNormalizado = [
  [0.33, 1, 0, 0, 1, 0, 0], // Erick
  [0, 0, 1, 0, 0, 1, 0], // Ana
  [1, 0, 0, 1, 0, 0, 1] // Carlos
]

// Labels das categorias a serem previstas (one-hot encoded)
// [premium, medium, basic]
const labelsNomes = ["premium", "medium", "basic"] // Ordem dos labels
const tensorLabels = [
  [1, 0, 0], // premium - Erick
  [0, 1, 0], // medium - Ana
  [0, 0, 1] // basic - Carlos
]

// Criamos tensores de entrada (xs) e saída (ys) para treinar o modelo
const inputXs = tf.tensor2d(tensorPessoasNormalizado)
const outputYs = tf.tensor2d(tensorLabels)

// quanto mais dados, melhor
// assim o algoritmo consegue entender melhor os padrões complexos dos dados
const model = await trainModel(inputXs, outputYs)
```
Treinando o modelo
```javascript
async function trainModel(inputXs, outputYs) {
  const model = tf.sequential()

  // primeira camada da rede:
  // entrada de 7 posições (idade normalizada + 3 cores + 3 localizações)
  // 80 neuronios = é tanto pois há pouca base de treino
  model.add(tf.layers.dense({ inputShape: [7], units: 80, activation: "relu" }))

  // Saída: 3 neuronios
  // um para cada categoria (premium, medium, basic)
  // activation: softmax normaliza a saida em probabilidades
  model.add(tf.layers.dense({ units: 3, activation: "softmax" }))

  model.compile({ optimizer: "adam", loss: "categoricalCrossentropy", metrics: ["accuracy"] })

  // Treinamento do modelo
  // epochs: quantidade de vezes que vai rodar no dataset
  // shuffle: embaralha os dados, para evitar viés
  await model.fit(inputXs, outputYs, {
    verbose: 0,
    epochs: 100,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, log) => console.log(`Epoch: ${epoch}: loss = ${log.loss}`)
    }
  })
  return model
}
```

Entregando o resultado
```javascript
async function predict(model, pessoa) {
  // Transformar o arrayJs para o tensor
  const tfInput = tf.tensor2d(pessoa)

  // Faz a predição (output será um vetor de 3 probabilidades)
  const pred = await model.predict(tfInput)
  const predArray = await pred.array()

  return predArray[0].map((prob, index) => ({ prob, index }))
}
```
