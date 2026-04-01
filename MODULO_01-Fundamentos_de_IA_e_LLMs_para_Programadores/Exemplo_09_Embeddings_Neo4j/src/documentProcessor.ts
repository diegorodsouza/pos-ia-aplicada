import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

import { type TextSplitterConfig } from "./config.ts"

export class DocumentProcessor {
  private pdfPath: string
  private textSplitterConfig: TextSplitterConfig

  constructor(pdfPath: string, textSplitterConfig: TextSplitterConfig) {
    this.pdfPath = pdfPath
    this.textSplitterConfig = textSplitterConfig
  }

  async loadAndSplit() {
    const loader = new PDFLoader(this.pdfPath)
    const rawDocuments = await loader.load()
    // o RecursiveCharacterTextSplitter é uma classe do LangChain que divide o texto em pedaços 
    // menores, respeitando os limites de tokens dos modelos de linguagem. Ele utiliza uma 
    // abordagem recursiva para garantir que os pedaços sejam divididos de forma inteligente, 
    // evitando cortar sentenças ou parágrafos no meio. O chunkSize define o tamanho máximo de 
    // cada pedaço, enquanto o chunkOverlap determina quantos caracteres devem se sobrepor entre 
    // os pedaços para manter a coesão do texto.
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
}
