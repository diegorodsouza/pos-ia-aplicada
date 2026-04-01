import tf from "@tensorflow/tfjs"

async function trainModel(inputXs, outputYs) {
  const model = tf.sequential()

  // primeira camada da rede:
  // entrada de 7 posições (idade normalizada + 3 cores + 3 localizações)

  // 80 neuronios = é tanto pois há pouca base de treino
  // quanto mais neuronios, mais complexidade a rede pode aprender
  // e, consequentemente, mais processamento ela vai usar

  // A RELU age como um filtro:
  // É como se ela deixasse somente os dados interessantes seguirem
  // Se a informação chegou nesse neronio é positiva, passa pra frente!
  // Se for 0 ou negativa, pode jogar fora, nao vai servir pra nada

  model.add(tf.layers.dense({ inputShape: [7], units: 80, activation: "relu" }))

  // Saída: 3 neuronios
  // um para cada categoria (premium, medium, basic)

  // activation: softmax normaliza a saida em probabilidades
  model.add(tf.layers.dense({ units: 3, activation: "softmax" }))

  // Compilando o modelo
  // optimizer Adam (Adaptive Moment Estimation)
  // é um treinador pessoal moderno para redes neurais:
  // ajusta os pesos de forma eficiente e inteligente
  // aprende com historico de erros e acertos

  // quanto mais distante da previsão do modelo da resposta correta
  // maior o erro (loss)
  // Exemplo clássico: classificação de imagens, recomendação, categorização de usuário
  // qualquer coisa em que a resposta certa é "apenas uma entre várias possíveis"
  model.compile({ optimizer: "adam", loss: "categoricalCrossentropy", metrics: ["accuracy"] })

  // Treinamento do modelo
  // verbose: desabilita o log interno (e só usa o callback)
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

async function predict(model, pessoa) {
  // Transformar o arrayJs para o tensor
  const tfInput = tf.tensor2d(pessoa)

  // Faz a predição (output será um vetor de 3 probabilidades)
  const pred = await model.predict(tfInput)
  const predArray = await pred.array()

  return predArray[0].map((prob, index) => ({ prob, index }))
}

// Exemplo de pessoas para treino (cada pessoa com idade, cor e localização)
// const pessoas = [
//     { nome: "Erick", idade: 30, cor: "azul", localizacao: "São Paulo" },
//     { nome: "Ana", idade: 25, cor: "vermelho", localizacao: "Rio" },
//     { nome: "Carlos", idade: 40, cor: "verde", localizacao: "Curitiba" }
// ];

// Vetores de entrada com valores já normalizados e one-hot encoded
// Ordem: [idade_normalizada, azul, vermelho, verde, São Paulo, Rio, Curitiba]
// const tensorPessoas = [
//     [0.33, 1, 0, 0, 1, 0, 0], // Erick
//     [0, 0, 1, 0, 0, 1, 0],    // Ana
//     [1, 0, 0, 1, 0, 0, 1]     // Carlos
// ]

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

const pessoa = { nome: "Ze", idade: 28, cor: "verde", localizacao: "Curitiba" }

// Normalizando a idade da nova pessoa usando o mesmo padrão do treino
// Exemplo: idade_min = 25, idade_max = 40, então (28-25)/(40-25) = 0.2
const pessoaTensorNormalizado = [
  [
    0.2, // idade normalizada
    1, // cor azul
    0, // cor vermelho
    0, // cor verde
    0, // localização São Paulo
    0, // localização Rio
    1 // localização Curitiba
  ]
]

const predictions = await predict(model, pessoaTensorNormalizado)
const results = predictions
  .sort((a, b) => b.prob - a.prob)
  .map((p) => `${labelsNomes[p.index]} (${(p.prob * 100).toFixed(2)}%)`)
  .join("\n")

console.log(results)
