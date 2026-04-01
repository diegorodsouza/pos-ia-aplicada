# Sistema de Recomendação de E-commerce

Nesse exemplo, temos uma aplicação web que analisa o perfil de um usuário e, aplicando Machine Learning com base nos dados de compras de outros usuários comparativos ao usuário logado, ranqueia os produtos da página inicial utilizando o TensorFlow.js.

## Stack

**Client:** Javascript

## Libs em Destaque

`@tensorflow/tfjs`

## Estrutura do Projeto

- `index.html` - HTML principal da aplicação
- `index.js` - Ponto de entrada da aplicação
- `view/` - Contém classes e métodos para gerenciamento de elementos visuais
- `controller/` - Contém controllers para conectar as views e os services
- `service/` - Contém as regras de negócio para lidar com os dados
- `data/` - Contém os dados de usuários, produtos e compras no formato JSON
- `workers/` - Contém a lógica de recomendação de produtos


## Demo

Ao entrar no site, a ordenação padrão é apenas do produto mais vendido em diante.

<img width="1970" height="948" alt="image" src="https://github.com/user-attachments/assets/a836ee6e-e9d3-466e-a265-2352ee8d3488" />


Ao selecionar um usuário, observa-se uma alteração na ordenação dos produtos, exibindo o de maior relevância com base no perfil de compra do próprio usuário e de usuários de perfis semelhantes, seja por idade ou compras passadas.

Selecionando um usuário de 30 anos sem histórico de compras, o algoritmo recomenda os produtos mais vendidos entre pessoas próximas daquela idade.
<img width="1971" height="947" alt="image" src="https://github.com/user-attachments/assets/76a26157-2809-448f-8ec0-444840213662" />

Já selecionando um usuário com histórico de compras de artigos eletrônicos, o ranqueamento de produtos muda para buscar maior relevância para aquele tipo de usuário.
<img width="1967" height="944" alt="image" src="https://github.com/user-attachments/assets/36ab4434-2d5a-4ce3-ae0b-8236146dca2d" />



## Roteiro para execução

1. Instalar as dependências
```
npm install
```

2. Iniciar a aplicação:
```
npm start
```

3. Abrir no browser `http://localhost:3000`

4. Alterar entre os usuários, adquirir produtos e retreinar o modelo para avaliar as alterações de recomendações

## Funcionalidades

- Seleção de usuário com exibição de seus dados
- Visualização de histórico de compras passadas
- Listagem de produtos com opção de compra
- Efetivação de compra utilizando sessionStorage

## Métodos em Destaque

Definindo o grau de relevância de cada especificação de produto
```javascript
// Quanto maior o peso, mais importante é aquele fator para a recomendação de produtos para
// perfis similares de usuários
const WEIGHTS = {
  category: 0.4,
  color: 0.3,
  price: 0.2,
  age: 0.1
}
```
Método de normalização de valores flutuantas
```javascript
// Normalizar valores contínuos (preço, idade) para a faixa de 0 a 1
// Por quê? Mantém todas as características equilibradas para que nenhuma domine o treinamento
// Fórmula: (valor - mínimo) / (máximo - mínimo)
// Exemplo: preço=129.99, minPrice=39.99, maxPrice=199.99 → 0.56
const normalize = (value, min, max) => (value - min) / (max - min || 1)
```

Método de One-Hot Enconding de um produto
```javascript
// One-hot encoding é quando transformamos uma categoria em um vetor binário onde apenas a posição da
// categoria é 1 e as outras são 0, pois não teria como um produto ser de duas categorias ou ter duas
// cores ao mesmo tempo, por exemplo, um tênis não pode ser vermelho e azul ao mesmo tempo, então a
// posição do vermelho seria 1 e a do azul seria 0, ou vice-versa. O peso é para dar mais ou menos
// relevância a cada categoria ou cor na recomendação.
const oneHotWeighted = (index, length, weight) => tf.oneHot(index, length).cast("float32").mul(weight)
```


Método de Encoding geral de um produto
```javascript
function encodeProduct(product, context) {
  // normalizando os dados para ficar entre 0 e 1 e
  // multiplicando pelos pesos para dar mais ou menos relevância a cada recomendação
  const price = tf.tensor1d([normalize(product.price, context.minPrice, context.maxPrice) * WEIGHTS.price])

  // O produto armazena a idade média já normalizada de seus compradores.
  // Caso não tenha sido comprado, apenas assume que a normalização será 0.5
  const age = tf.tensor1d([(context.productAvgAgeNorm[product.name] ?? 0.5) * WEIGHTS.age])

  const category = oneHotWeighted(context.categoriesIndex[product.category], context.numCategories, WEIGHTS.category)

  const color = oneHotWeighted(context.colorsIndex[product.color], context.numColors, WEIGHTS.color)

  // concatenando todos os vetores em um único vetor de características para cada produto
  return tf.concat1d([price, age, category, color])
}
```

Método de Encoding geral de compras um usuário
```javascript
function encodeUser(user, context) {
  if (user.purchases.length) {
    return tf
      .stack(user.purchases.map((product) => encodeProduct(product, context)))
      .mean(0)
      .reshape([1, context.dimensions])
  }

  // Se o usuário não tiver compras, retornamos um vetor neutro (todos os valores iguais)
  // para que o modelo possa aprender a recomendar produtos com base em características gerais
  return tf
    .concat1d([
      tf.zeros([1]), // preço ignorado
      tf.tensor1d([normalize(user.age, context.minAge, context.maxAge) * WEIGHTS.age]), // para ficar o mais próximo possível do perfil médio de compra, usamos a idade do usuário normalizada, pois a idade é um fator importante para recomendar produtos adequados para cada faixa etária
      tf.zeros([context.numCategories]), // categorias ignoradas
      tf.zeros([context.numColors]) // cores ignoradas
    ])
    .reshape([1, context.dimensions])
}
```

Criação do modelo de treinamento
```javascript
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
      context.products.forEach((product) => {
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
```

Configuração da rede neural
```javascript
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
```

Treinamento da rede neural
```javascript
async function trainModel({ users }) {
  const products = await (await fetch("/data/products.json")).json()

  const context = makeContext(products, users)

  // vector é o vetor de pesos das características do produto
  // (preço, idade média dos compradores, one-hot de categorias e one-hot cores),
  // totalizando 14 dimensões nesse caso, pois temos
  // 2 características contínuas (preço e idade) e
  // 12 categorias variáveis (4 cores + 8 categorias)
  context.productVectors = products.map((product) => {
    return {
      name: product.name,
      meta: { ...product },
      vector: encodeProduct(product, context).dataSync()
    }
  })

  _globalCtx = context

  const trainData = createTrainingData(context)
  _model = await configureNeuralNetAndTrain(trainData)

  postMessage({ type: workerEvents.progressUpdate, progress: { progress: 100 } })
  postMessage({ type: workerEvents.trainingComplete })
}
```

Recomendação com base no aprendizado
```javascript
function recommend(user, context) {
  if (!_model) return

  // Converte o usuario fornecido no vetor de caracteristicas codificadas
  // (preço ignorado, idade normalizada, one-hot de categorias e one-hot de cores ignoradas)
  // isso transforma as informações do usuário em um mesmo formato numérico que foi usado
  // para treinar o modelo
  const userVector = encodeUser(user, context).dataSync()

  // Em aplicações reais:
  //  Armazene todos os vetores de produtos em um banco de dados vetorial (como Postgres, Neo4j ou Pinecone)
  //  Consulta: Encontre os 200 produtos mais próximos do vetor do usuário
  //  Execute _model.predict() apenas nesses produtos

  // Cria pares de entrada: para cada produto, concatena o vetor do usuário
  // com o vetor codificado do produto. Dessa forma o modelo prevê o "score de compatibilidade"
  // para cada par (usuário, produto)
  const inputs = context.productVectors.map(({ vector }) => {
    return [...userVector, ...vector]
  })

  // Converta todos esses pares (usuário, produto) em um único Tensor.
  // Formato: [numProdutos, inputDim]
  const inputVector = tf.tensor2d(inputs)

  // Rode a rede neural treinada em todos os pares (usuário, produto) de uma vez.
  // O resultado é uma pontuação para cada produto entre 0 e 1.
  // Quanto maior, maior a probabilidade do usuário querer aquele produto.
  const predictions = _model.predict(inputVector)

  // Extraia as pontuações para um array JS normal.
  const scores = predictions.dataSync()

  // Mapeia cada produto para um objeto que inclui suas informações originais
  // e a pontuação prevista pelo modelo, para que possamos ordenar os produtos com base
  // nessas pontuações e recomendar os mais relevantes para o usuário.
  const recommendations = context.productVectors.map((item, index) => {
    return {
      ...item.meta,
      name: item.name,
      score: scores[index] // previsão do modelo para este produto
    }
  })

  const sortedItems = recommendations.sort((a, b) => b.score - a.score)

  // Envie a lista ordenada de produtos recomendados
  // para a thread principal (a UI pode exibi-los agora).
  postMessage({
    type: workerEvents.recommend,
    user,
    recommendations: sortedItems
  })
}
```
