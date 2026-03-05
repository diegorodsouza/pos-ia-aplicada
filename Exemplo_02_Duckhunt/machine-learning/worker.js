importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest")

const MODEL_PATH = `yolov5n_web_model/model.json`
const LABELS_PATH = `yolov5n_web_model/labels.json`
const INPUT_MODEL_DIMENSIONS = 640
const CLASS_THRESHOLD = 0.4

let _labels = []
let _model = null

// Carrega o modelo e as labels, e faz um "warm up" para reduzir a latência
// na primeira predição
// O warm up é importante porque o TensorFlow.js pode precisar compilar o modelo
// para o ambiente de execução (WebGL, WASM, etc.) na primeira vez que ele é carregado.
// Isso pode causar uma latência significativa na primeira predição, então fazemos isso
// logo após o carregamento para garantir que as predições subsequentes sejam mais rápidas.
async function loadModelAndLabels() {
  await tf.ready()

  _labels = await (await fetch(LABELS_PATH)).json()
  _model = await tf.loadGraphModel(MODEL_PATH)

  // O warm up consiste em executar o modelo uma vez com um tensor de entrada dummy
  // para que ele possa compilar e otimizar o modelo para o ambiente de execução.
  const dummyInput = tf.ones(_model.inputs[0].shape)
  await _model.executeAsync(dummyInput)

  // Após o warm up, descartamos o tensor dummy para liberar memória.
  tf.dispose(dummyInput)

  postMessage({ type: "model-loaded" })
}

loadModelAndLabels()

/**
 * Pré-processa a imagem para o formato aceito pelo YOLO:
 * - tf.browser.fromPixels(): converte ImageBitmap/ImageData para tensor [H, W, 3]
 * - tf.image.resizeBilinear(): redimensiona para [INPUT_DIM, INPUT_DIM]
 * - .div(255): normaliza os valores para [0, 1]
 * - .expandDims(0): adiciona dimensão batch [1, H, W, 3]
 *
 * Uso de tf.tidy():
 * - Garante que tensores temporários serão descartados automaticamente,
 *   evitando vazamento de memória.
 */
function preprocessImageData(input) {
  return tf.tidy(() => {
    const image = tf.browser.fromPixels(input)

    return tf.image.resizeBilinear(image, [INPUT_MODEL_DIMENSIONS, INPUT_MODEL_DIMENSIONS]).div(255).expandDims(0)
  })
}

// Executa a inferência no modelo e processa os resultados
// O modelo YOLOv5 retorna uma lista de tensores, onde as 3 primeiras saídas são:
// - boxes: [num_detections, 4] (x1, y1, x2, y2)
// - scores: [num_detections] (confiança de cada detecção)
// - classes: [num_detections] (índice da classe prevista para cada detecção)
async function runInference(tensor) {
  const output = await _model.executeAsync(tensor)
  tf.dispose(tensor)

  // Assume que as 3 primeiras saídas são:
  // caixas (boxes), pontuações (scores) e classes
  const [boxes, scores, classes] = output.slice(0, 3)

  const [boxesData, scoresData, classesData] = await Promise.all([boxes.data(), scores.data(), classes.data()])

  output.forEach((t) => tf.dispose(t))

  return { boxes: boxesData, scores: scoresData, classes: classesData }
}

function* processPrediction({ boxes, scores, classes }, imageWidth, imageHeight) {
  // O loop percorre cada detecção retornada pelo modelo, filtrando por pontuação de
  // confiança mínima e pela classe "pato" (ou "kite" no caso do modelo treinado).
  // Para cada detecção válida, ele calcula as coordenadas da caixa delimitadora em
  // relação ao tamanho original da imagem
  // e retorna um objeto com as coordenadas do centro da caixa e a pontuação de
  // confiança formatada como porcentagem.
  for (let index = 0; index < scores.length; index++) {
    // Filtra por pontuação de confiança mínima
    if (scores[index] < CLASS_THRESHOLD) continue

    const label = _labels[classes[index]]

    // Filtra por classe "pato" (ou "kite" no caso do modelo treinado)
    if (label !== "kite") continue

    // Define as coordenadas da caixa delimitadora em relação
    // ao tamanho original da imagem
    let [x1, y1, x2, y2] = boxes.slice(index * 4, (index + 1) * 4)
    x1 *= imageWidth
    x2 *= imageWidth
    y1 *= imageHeight
    y2 *= imageHeight

    // Calcula o centro da caixa delimitadora
    const boxWidth = x2 - x1
    const boxHeight = y2 - y1
    const centerX = x1 + boxWidth / 2
    const centerY = y1 + boxHeight / 2

    // yield serve para retornar um resultado parcial sem encerrar a função,
    // permitindo que o loop continue processando outras detecções
    yield {
      x: centerX,
      y: centerY,
      score: (scores[index] * 100).toFixed(2)
    }
  }
}

self.onmessage = async ({ data }) => {
  // O worker só processa mensagens do tipo "predict".
  // Se receber outro tipo de mensagem, ele simplesmente ignora.
  if (data.type !== "predict") return

  // Verifica se o modelo foi carregado antes de tentar fazer uma predição.
  if (!_model) {
    postMessage({ type: "error", message: "Model not loaded yet" })
    return
  }

  // Pré-processa a imagem recebida, executa a inferência e processa os resultados.
  const input = preprocessImageData(data.image)

  const { width, height } = data.image

  const inferenceResults = await runInference(input)

  for (const prediction of processPrediction(inferenceResults, width, height)) {
    postMessage({
      type: "prediction",
      ...prediction
    })
  }
}

console.log("🧠 YOLOv5n Web Worker initialized")
