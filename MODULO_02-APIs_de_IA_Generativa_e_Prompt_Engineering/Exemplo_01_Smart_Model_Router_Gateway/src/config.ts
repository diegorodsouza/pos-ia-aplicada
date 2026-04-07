// Garante que a variável de ambiente OPENROUTER_API_KEY esteja definida
console.assert(
    process.env.OPENROUTER_API_KEY,
    'OPENROUTER_API_KEY is not set in env variables'
)

export type ModelConfig = {
    apiKey: string;
    httpReferer: string;
    xTitle: string;
    port: number;
    models: string[];
    temperature: number;
    maxTokens: number;
    systemPrompt: string;

    provider: {
        sort: {
            by: string,
            partition: string,
        }
    }
}

// Configuração do modelo para o Smart Model Router Gateway
// com base na documentação da OpenRouter API 
// https://openrouter.ai/docs/quickstart#using-the-openai-sdk
export const config: ModelConfig = {
    // O "!" é usado para garantir que o valor não seja undefined
    apiKey: process.env.OPENROUTER_API_KEY!, 
    httpReferer: 'http://pos-ia.com',
    xTitle: 'SmartModelRouterGateway',
    port: 3000,
    models: [
        // top 4 para a listagem ordenada por preço
        'arcee-ai/trinity-large-preview:free',

        // top 3 para listagem de throughput
        'nvidia/nemotron-3-nano-30b-a3b:free',
    ],
    temperature: 0.2,
    maxTokens: 100,
    systemPrompt: 'You are a helpful assistant.',
    provider: {
        sort: {
            by: 'throughput', // taxa de processamento do modelo, medida em tokens por segundo
            // by: 'latency', // tempo de resposta do modelo
            // by: 'price', // custo do modelo por 1k tokens
            partition: 'none'
        }
    }
}