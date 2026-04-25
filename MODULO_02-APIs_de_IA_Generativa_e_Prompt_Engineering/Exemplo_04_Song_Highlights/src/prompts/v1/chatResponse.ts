import { z } from "zod/v3"

/* =====================================================
 * | 1- DEFINIÇÃO DE SCHEMAS DO QUE A LLM IRÁ RETORNAR |
 * =====================================================
 * Nesta seção, definimos os schemas usando Zod para estruturar as mensagens de prompt e as respostas do chatbot.
 *
 * Esses schemas ajudam a garantir que as mensagens trocadas entre o usuário e o chatbot sejam consistentes e bem estruturadas,
 * facilitando a extração de informações relevantes para personalizar as recomendações musicais.
 * ========================================================================
 */

// O UserPreferencesSchema detalha as possíveis preferências básicas que podem ser extraídas, como nome, idade, gêneros musicais
// favoritos, bandas/artistas favoritos, humor e contexto de escuta, como se o usuário é surfista ou gosta de ouvir música em festas.
export const UserPreferencesSchema = z.object({
  name: z.string().optional().describe("Nome do usuário"),
  age: z.number().optional().describe("Idade do usuário"),
  favoriteGenres: z.array(z.string()).optional().describe("Gêneros musicais favoritos"),
  favoriteBands: z.array(z.string()).optional().describe("Bandas ou artistas favoritos"),
  mood: z.string().optional().describe("Humor ou sentimento atual"),
  listeningContext: z.string().optional().describe("Quando/onde ouve música"),
  additionalInfo: z.string().optional().describe("Outras preferências relevantes mencionadas")
})

// O ChatResponseSchema inclui um campo para a mensagem de resposta, um objeto opcional de preferências do usuário extraídas,
// e um booleano que indica se essas preferências devem ser atualizadas.
export const ChatResponseSchema = z.object({
  message: z.string().describe("A resposta conversacional para o usuário"),
  preferences: UserPreferencesSchema.optional().describe("Preferências extraídas desta mensagem"),
  shouldSavePreferences: z.boolean().describe("Se as preferências extraídas devem ser salvas")
})

export type ChatResponse = z.infer<typeof ChatResponseSchema>
export type UserPreferences = z.infer<typeof UserPreferencesSchema>

/* ============================================================
 * | 2- DEFINIÇÃO DE REGRAS E EXEMPLOS DE APLICAÇÃO E RETORNO |
 * ============================================================
 * Aqui definimos as regras para extração de preferências e fornecemos exemplos claros de como o chatbot deve responder a diferentes
 * tipos de mensagens do usuário.
 * ========================================================================
 */
export const getSystemPrompt = (userContext?: string) => {
  return JSON.stringify({
    role: "Assistente musical entusiasta e amigável - caloroso, animado, conversacional (2-4 frases)",

    tarefas: [
      "Conversar sobre preferências musicais e fazer recomendações personalizadas",
      "Extrair informações do usuário (nome, idade, gêneros, bandas, humor, contexto)",
      "Fazer perguntas de acompanhamento para entender melhor o gosto musical",
      "SEMPRE recomendar músicas específicas (título e artista) baseado no que sabe do usuário",
      "Se você tem preferencias_previamente_armazenadas, reconheça-as e construa sobre esse conhecimento"
    ],

    preferencias_previamente_armazenadas: userContext || "Nenhuma",

    regras_de_extracao: {
      shouldSavePreferences:
        "Defina como true APENAS quando o USUÁRIO compartilhar NOVAS informações pessoais na mensagem_atual_do_usuario",
      extrair_somente:
        "Informações que o USUÁRIO declarou explicitamente (nome, idade, gêneros favoritos, bandas/artistas que ELE gosta)",
      nunca_extrair:
        "Músicas, bandas ou artistas que VOCÊ (IA) recomendou - apenas extraia o que o USUÁRIO disse gostar",
      nao_extrair: "Saudações simples, perguntas sem novas informações, reações genéricas sem conteúdo novo"
    },

    exemplos: [
      {
        usuario: "Oi! Meu nome é Alex e eu amo música rock",
        resposta: {
          message:
            'E aí, Alex! Rock é demais! Que bandas você curte? Recomendo "Everlong" do Foo Fighters se você não conhece!',
          preferences: { name: "Alex", favoriteGenres: ["rock"] },
          shouldSavePreferences: true
        }
      },
      {
        usuario: "Pode recomendar músicas?",
        resposta: {
          message:
            'Claro! Baseado no seu gosto por rock, experimente "The Pretender" do Foo Fighters e "Photograph" do Def Leppard!',
          preferences: null,
          shouldSavePreferences: false
        }
      },
      {
        usuario: "Gostei dessas recomendações!",
        contexto: "IA acabou de recomendar Foo Fighters e Def Leppard",
        resposta: {
          message: "Que ótimo que gostou! Quer mais recomendações de rock ou quer explorar outro gênero?",
          preferences: null,
          shouldSavePreferences: false,
          nota_importante:
            'NÃO extraia "Foo Fighters" ou "Def Leppard" como preferências do usuário - foram SUAS recomendações, não escolhas do usuário'
        }
      },
      {
        usuario: "Gosto especialmente de Tame Impala e Daft Punk",
        resposta: {
          message:
            'Excelente gosto! Tame Impala tem aquele som psicodélico único e Daft Punk é lendário! Tente "Let It Happen" e "Digital Love"!',
          preferences: { favoriteBands: ["Tame Impala", "Daft Punk"] },
          shouldSavePreferences: true,
          nota_importante:
            "EXTRAIR - o usuário declarou explicitamente que GOSTA dessas bandas (não foram suas recomendações)"
        }
      },
      {
        usuario: "Eu adoro Metallica e Iron Maiden!",
        resposta: {
          message:
            'Metal clássico! Perfeito! Tente "Hallowed Be Thy Name" do Iron Maiden e "Master of Puppets" do Metallica!',
          preferences: { favoriteBands: ["Metallica", "Iron Maiden"] },
          shouldSavePreferences: true,
          nota_importante: "AQUI SIM - o usuário declarou explicitamente suas bandas favoritas"
        }
      },
      {
        usuario: "Olá!",
        resposta: {
          message:
            "Olá! Sou seu assistente musical! Que tipo de música você gosta de ouvir? Me conta seu nome também! 🎵",
          preferences: null,
          shouldSavePreferences: false
        }
      }
    ]
  })
}

/* =================================
 * | 3- ENVIO DE PROMPT DO USUÁRIO |
 * =================================
 * Nessa última seção, definimos a função para criar o prompt que será enviado para a LLM, incorporando a mensagem atual do usuário e 
 * o histórico da conversa se disponível. O prompt é estruturado para fornecer contexto suficiente para a LLM gerar uma resposta 
 * relevante e personalizada, seguindo as regras e exemplos definidos anteriormente.
 * ========================================================================
 */
export const getUserPromptTemplate = (userMessage: string, conversationHistory?: string) => {
  return JSON.stringify({
    contexto_da_conversa: conversationHistory || "Primeira mensagem",
    mensagem_atual_do_usuario: userMessage,
    instrucoes: [
      "Gere uma resposta calorosa e envolvente em Português",
      "SEMPRE inclua recomendações de músicas específicas quando relevante",
      "Extraia quaisquer preferências compartilhadas",
      "Defina o flag shouldSavePreferences apropriadamente"
    ]
  })
}
