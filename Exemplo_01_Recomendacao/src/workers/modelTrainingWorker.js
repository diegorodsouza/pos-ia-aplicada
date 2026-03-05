import "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js"
import { workerEvents } from "../events/constants.js"

console.log("Model training worker initialized")
let _globalCtx = {}
let _model = {}

// Quanto maior o peso, mais importante é aquele fator para a recomendação de produtos para
// perfis similares de usuários
const WEIGHTS = {
  category: 0.4,
  color: 0.3,
  price: 0.2,
  age: 0.1
}

// Normalizar valores contínuos (preço, idade) para a faixa de 0 a 1
// Por quê? Mantém todas as características equilibradas para que nenhuma domine o treinamento
// Fórmula: (valor - mínimo) / (máximo - mínimo)
// Exemplo: preço=129.99, minPrice=39.99, maxPrice=199.99 → 0.56
const normalize = (value, min, max) => (value - min) / (max - min || 1)

function makeContext(catalog, users) {
  const ages = users.map((u) => u.age)
  const prices = catalog.map((p) => p.price)

  const minAge = Math.min(...ages)
  const maxAge = Math.max(...ages)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  const colors = [...new Set(catalog.map((p) => p.color))]
  const categories = [...new Set(catalog.map((p) => p.category))]

  const colorsIndex = Object.fromEntries(
    colors.map((color, index) => {
      return [color, index]
    })
  )
  const categoriesIndex = Object.fromEntries(
    categories.map((category, index) => {
      return [category, index]
    })
  )

  // Computar a média de idade dos compradores por produto
  // (ajuda a personalizarr as recomendações para cada faixa etária)
  const midAge = (minAge + maxAge) / 2
  const ageSums = {}
  const ageCounts = {}

  // Cria um dicionário com as idades somadas e contadas para cada produto
  users.forEach((user) => {
    user.purchases.forEach((purchase) => {
      ageSums[purchase.name] = (ageSums[purchase.name] || 0) + user.age
      ageCounts[purchase.name] = (ageCounts[purchase.name] || 0) + 1
    })
  })

  // Cria um dicionário com a média de idade para cada produto já normalizada
  const productAvgAgeNorm = Object.fromEntries(
    catalog.map((product) => {
      // media = soma das idades / número de compradores
      const avgAge = ageSums[product.name] ? ageSums[product.name] / ageCounts[product.name] : midAge

      return [product.name, normalize(avgAge, minAge, maxAge)]
    })
  )

  // Transformando os dados em tensores para o modelo
  return {
    catalog,
    users,
    colorsIndex,
    categoriesIndex,
    productAvgAgeNorm,
    minAge,
    maxAge,
    minPrice,
    maxPrice,
    numCategories: categories.length,
    numColors: colors.length,
    // price + age + one-hot de cor + one-hot de categoria
    dimensions: 2 + colors.length + categories.length
  }
}

// One-hot encoding é quando transformamos uma categoria em um vetor binário onde apenas a posição da
// categoria é 1 e as outras são 0, pois não teria como um produto ser de duas categorias ou ter duas
// cores ao mesmo tempo, por exemplo, um tênis não pode ser vermelho e azul ao mesmo tempo, então a
// posição do vermelho seria 1 e a do azul seria 0, ou vice-versa. O peso é para dar mais ou menos
// relevância a cada categoria ou cor na recomendação.
const oneHotWeighted = (index, length, weight) => tf.oneHot(index, length).cast("float32").mul(weight)

// Retornar o vetor de características de um produto, que é uma combinação do preço normalizado,
// idade média dos compradores normalizada, one-hot das categorias e one-hot das cores,
// tudo multiplicado pelos pesos definidos para cada característica.
// Esse vetor é o que o modelo vai usar para aprender a recomendar produtos para os usuários
// com base em seus perfis de compra.
function encodeProduct(product, context) {
  // normalizando os dados para ficar entre 0 e 1 e
  // multiplicando pelos pesos para dar mais ou menos relevância a cada recomendação
  const price = tf.tensor1d([normalize(product.price, context.minPrice, context.maxPrice) * WEIGHTS.price])

  const age = tf.tensor1d([(context.productAvgAgeNorm[product.name] ?? 0.5) * WEIGHTS.age])

  const category = oneHotWeighted(context.categoriesIndex[product.category], context.numCategories, WEIGHTS.category)

  const color = oneHotWeighted(context.colorsIndex[product.color], context.numColors, WEIGHTS.color)

  // concatenando todos os vetores em um único vetor de características para cada produto
  return tf.concat1d([price, age, category, color])
}

// Retornar o perfil de compra de um usuário
// (vetor médio dos produtos que ele comprou) para comparar com os vetores dos produtos do catálogo
function encodeUser(user, context) {
  if (user.purchases.length) {
    return tf
      .stack(user.purchases.map((product) => encodeProduct(product, context)))
      .mean(0)
      .reshape([1, context.dimensions])
  }
}

// Criar os dados de treinamento combinando os vetores dos usuários e dos produtos, e as labels,
// indicando se o usuário comprou ou não aquele produto, para que o modelo aprenda a prever a
// probabilidade de compra com base nas características do usuário e do produto.
function createTrainingData(context) {
  const inputs = []
  const labels = []

  context.users
    // Considera apenas usuários que fizeram compras para ter um perfil de compra mais definido
    .filter((user) => user.purchases.length)
    .forEach((user) => {
      const userVector = encodeUser(user, context).dataSync()
      context.catalog.forEach((product) => {
        const productVector = encodeProduct(product, context).dataSync()

        const label = user.purchases.some((purchase) => purchase.name === product.name) ? 1 : 0

        // combinando o vetor do usuário e do produto para criar um vetor de entrada para o modelo
        inputs.push([...userVector, ...productVector])
        labels.push(label)
      })
    })

  return {
    // xs é o vetor de entrada que combina as características do usuário e do produto
    // para cada par usuário-produto
    xs: tf.tensor2d(inputs),
    // ys é o vetor de saída que indica se o usuário comprou (1) ou não comprou (0) aquele produto,
    // que é o que o modelo vai aprender a prever
    ys: tf.tensor2d(labels, [labels.length, 1]),
    // dimensões do vetor de entrada, que é a soma das dimensões do vetor do usuário e
    // do vetor do produto
    inputDimensions: context.dimensions * 2
  }
}

// Aqui é onde configuramos a arquitetura da rede neural, que é composta por camadas densas
// (fully connected) com funções de ativação ReLU para as camadas ocultas e sigmoid para a
// camada de saída, e compilamos o modelo com o otimizador Adam e a função de perda
// binaryCrossentropy, que são escolhas comuns para problemas de classificação binária como este.
async function configureNeuralNetAndTrain(trainData) {
  const model = tf.sequential()
  // Camada de entrada:
  // - inputShape: Número de características por exemplo de treino
  // Exemplo: se o vetor produto + usuário = 20 números, então inputShape = 20
  // - units: 128 neurônios (muitos 'olhos' para aprender padrões complexos)
  // - activation: 'relu' (mantem apenas os sinais positivos, ajudando a rede a aprender padrões não lineares)

  model.add(tf.layers.dense({ inputShape: [trainData.inputDimensions], units: 128, activation: "relu" }))
  // Camada oculta 1:
  // - units: 64 neurônios (reduzindo a complexidade para focar nos padrões mais importantes)
  // - activation: 'relu' (ainda extraindo combinações relevantes de características)
  model.add(tf.layers.dense({ units: 64, activation: "relu" }))
  // Camada oculta 2:
  // - units: 32 neurônios (ainda mais focada nos padrões mais fortes)
  // - activation: 'relu' (mantendo a capacidade de aprender relações não lineares)
  model.add(tf.layers.dense({ units: 32, activation: "relu" }))

  // Camada de saída:
  // - units: 1 neurônio (saída única para probabilidade de compra)
  // - activation: 'sigmoid' (ativa a saída entre 0 e 1, interpretada como probabilidade)
  // Exemplo: se a saída for 0.8, isso significa que o modelo prevê uma probabilidade de 80% de que
  // o usuário comprará aquele produto
  model.add(
    tf.layers.dense({
      units: 1, // Saída única para probabilidade de compra
      activation: "sigmoid" // Ativação sigmoid para saída entre 0 e 1 (probabilidade)
    })
  )

  // Compilando o modelo:
  // - optimizer: 'adam' (um otimizador eficiente para muitos tipos de problemas)
  // - loss: 'binaryCrossentropy' (função de perda adequada para classificação binária)
  model.compile({
    optimizer: "adam",
    loss: "binaryCrossentropy",
    metrics: ["accuracy"]
  })

  // Treinando o modelo:
  // - epochs: 100 (número de vezes que o modelo verá todo o conjunto de dados de treino)
  // - batchSize: 32 (número de exemplos processados antes de atualizar os pesos do modelo)
  // - shuffle: true (embaralha os dados a cada época para melhorar a generalização e
  // evitar viés posicional do array)
  await model.fit(trainData.xs, trainData.ys, {
    epochs: 100,
    batchSize: 32,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        // Envia atualizações de progresso para a interface do usuário a cada iteração de treinamento,
        // incluindo a época atual, perda e precisão, para que o usuário possa acompanhar o progresso
        // do treinamento em tempo real.
        postMessage({
          type: workerEvents.trainingLog,
          epoch: epoch,
          loss: logs.loss,
          accuracy: logs.acc
        })
      }
    }
  })

  return model
}

async function trainModel({ users }) {
  console.log("Training model with users:", users)

  postMessage({ type: workerEvents.progressUpdate, progress: { progress: 50 } })

  const catalog = await (await fetch("/data/products.json")).json()

  const context = makeContext(catalog, users)
  context.productVectors = catalog.map((product) => {
    return {
      name: product.name,
      meta: { ...product },
      // vetor de pesos das características do produto
      // (preço, idade média dos compradores, one-hot de categorias e one-hot cores),
      // totalizando 14 dimensões nesse caso, pois temos
      // 2 características contínuas (preço e idade) e
      // 12 categorias variáveis (4 cores + 8 categorias)
      vector: encodeProduct(product, context).dataSync()
    }
  })

  _globalCtx = context

  const trainData = createTrainingData(context)
  _model = await configureNeuralNetAndTrain(trainData)

  postMessage({ type: workerEvents.progressUpdate, progress: { progress: 100 } })
  postMessage({ type: workerEvents.trainingComplete })
}

function recommend(user, ctx) {
  console.log("will recommend for user:", user)
  // postMessage({
  //     type: workerEvents.recommend,
  //     user,
  //     recommendations: []
  // });
}

const handlers = {
  [workerEvents.trainModel]: trainModel,
  [workerEvents.recommend]: (d) => recommend(d.user, _globalCtx)
}

self.onmessage = (e) => {
  const { action, ...data } = e.data
  if (handlers[action]) handlers[action](data)
}
