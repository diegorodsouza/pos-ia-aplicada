# Embeddings Locais com Neo4j

Nesse exemplo, exploramos o uso de embeddings locais utilizando o banco de dados gráfico Neo4j. O objetivo é demonstrar como configurar e utilizar o Neo4j para armazenar e consultar embeddings gerados por modelos de linguagem, permitindo a criação de aplicações inteligentes que podem realizar buscas semânticas e análises de relacionamentos entre dados. 

## Stack

**Client:** TypeScript, Node.js

## Libs em Destaque

`@huggingface/transformers` para geração de embeddings
`@langchain` para divisão de documentos e processamento de texto

## Estrutura do Projeto

- `config.ts` - Configurações de conexão com o Neo4j e parâmetros para geração de embeddings
- `documentProcessor.ts` - Carregamento e divisão de documentos em trechos para geração de embeddings
- `utils.ts` - Função para visualização de perguntas e respostas mais relevantes
- `index.ts` - Script principal para geração de embeddings, armazenamento no Neo4j e consulta semântica

## Demo

Para a demo, utilizamos um PDF de uma transcrição de uma videoaula sobre LLMs, gerando embeddings para cada trecho do texto e armazenando esses embeddings no Neo4j. Em seguida, realizamos uma consulta semântica utilizando um prompt para encontrar o trecho mais relevante relacionado a uma pergunta específica sobre LLMs. O Neo4j retorna o texto mais relevante com base na similaridade dos embeddings, demonstrando como é possível realizar buscas semânticas eficazes utilizando um banco de dados gráfico.

Podemos visualizar os resultados para uma das perguntas feitas:

<img width="945" height="570" alt="image" src="https://github.com/user-attachments/assets/989a2643-b582-4389-bfda-8fd0c7a8caa2" />


E também a representação gráfica dos dados armazenados no Neo4j, onde cada nó representa um trecho do texto:

<img width="1872" height="950" alt="image" src="https://github.com/user-attachments/assets/6bc402ef-24cb-4691-80e8-766742d9b5f2" />


## Roteiro para execução

1. Instalar as dependências do projeto:
```
npm install
```

2. Instalar as dependencias da imagem Docker:
```
npm run infra:up
```


3. Executar o script principal para gerar os embeddings, armazenar no Neo4j e realizar a consulta semântica:
```
npm start
```

4. Observar os resultados no console, onde serão exibidos os trechos de texto mais relevantes para a pergunta feita, juntamente com a similaridade dos embeddings.

5. Opcionalmente, acessar o Neo4j Browser em `http://localhost:7474` para visualizar os dados armazenados e realizar consultas adicionais utilizando a linguagem Cypher.

6. Finalizar os serviços de infra utilizando Docker Compose:
```
npm run infra:down
```

## Métodos em Destaque

Método para divisão de documentos em trechos menores utilizando o RecursiveCharacterTextSplitter do LangChain, que respeita os limites de tokens dos modelos de linguagem e mantém a coesão do texto.
```javascript
 async loadAndSplit() {
    const loader = new PDFLoader(this.pdfPath)
    const rawDocuments = await loader.load()
    const splitter = new RecursiveCharacterTextSplitter(this.textSplitterConfig)
    const documents = await splitter.splitDocuments(rawDocuments)

    console.log(`📄 Loaded ${rawDocuments.length} pages from PDF`)
    console.log(`✂️  Split into ${documents.length} chunks.`)

    return documents.map((doc) => ({
      ...doc,
      metadata: {
        source: doc.metadata.source
      }
    }))
  }
```

Processo de geração de embeddings utilizando o HuggingFaceTransformersEmbeddings, que permite a criação de representações vetoriais dos trechos de texto para armazenamento e consulta no Neo4j. 
```javascript
const embeddings = new HuggingFaceTransformersEmbeddings({
    // como modelo de embedding, foi utilizado o Xenova/all-MiniLM-L6-v2 que é um modelo leve e
    // eficiente para geração de embeddings, adequado para tarefas de similaridade semântica e 
    // busca de informações
    model: CONFIG.embedding.modelName,
    // como pretrainedOptions, foi utilizado o fp32 que é uma opção de quantização mantém a 
    // precisão dos embeddings, garantindo resultados mais precisos nas consultas semânticas, 
    // embora possa consumir mais recursos computacionais em comparação com opções de quantização 
    // mais agressivas como o int8
    pretrainedOptions: CONFIG.embedding.pretrainedOptions as PretrainedOptions
  })
```

Processo de limpeza do banco de dados Neo4j para garantir que os dados anteriores sejam removidos antes de inserir os novos embeddings, evitando duplicações e garantindo a integridade dos dados. 
```javascript
 clearAll(_neo4jVectorStore, CONFIG.neo4j.nodeLabel)

  for (const [index, document] of documents.entries()) {
    console.log(`✅ Adicionando documento ${index + 1}/${documents.length}...`)
    await _neo4jVectorStore.addDocuments([document])
  }
```

Processo de consulta semântica utilizando o método similaritySearch do Neo4jVectorStore, que retorna os trechos de texto mais relevantes com base na similaridade dos embeddings em relação à pergunta feita. 
```javascript
 const questions = [
    "O que são tensores e como são representados em JavaScript?",
    "Como converter objetos JavaScript em tensores?",
    "O que é normalização de dados e por que é necessária?",
    "Como funciona uma rede neural no TensorFlow.js?",
    "O que significa treinar uma rede neural?",
    "o que é hot enconding e quando usar?"
  ]
  for (const question of questions) {
    console.log(`\n${"=".repeat(50)}`)
    console.log(`📌 Pergunta: "${question}"`)
    console.log(`${"=".repeat(50)}`)

    const results = await _neo4jVectorStore.similaritySearch(question, CONFIG.similarity.topK)

    displayResults(results)
```
