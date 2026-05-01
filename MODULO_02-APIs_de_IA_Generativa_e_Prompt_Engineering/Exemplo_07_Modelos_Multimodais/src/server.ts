import { buildDocumentQAGraphInstance } from './graph/factory.ts';
import Fastify from 'fastify';
import { HumanMessage } from '@langchain/core/messages';
import multipart from '@fastify/multipart';

export const createServer = () => {
    const app = Fastify({
        logger: false
    });

    app.register(multipart, {
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB
        },
    });

    const { graph } = buildDocumentQAGraphInstance();

    // Analyze document with question (combined upload + ask)
    app.post('/chat', async function (request, reply) {
        try {
            const data = await request.file();

            if (!data) {
                return reply.status(400).send({ error: 'No file uploaded' });
            }

            if (data.mimetype !== 'application/pdf') {
                return reply.status(400).send({ error: 'Only PDF files are supported' });
            }

            // Get question from form field
            const questionField = data.fields.question;
            const question = questionField && 'value' in questionField ? questionField.value : undefined;

            if (!question || typeof question !== 'string' || question.trim().length < 3) {
                return reply.status(400).send({
                    error: 'Question is required and must be at least 3 characters'
                });
            }

            // Para análise multimodal, apenas adicionamos essas linhas para ler o arquivo enviado, convertê-lo para 
            // base64 e incluí-lo como parte do estado de entrada do grafo, onde o nó de geração de resposta pode 
            // acessar o documento como um input multimodal junto com o prompt de texto do usuário
            // (Idealmente, para arquivos grandes, deveríamos usar um serviço de armazenamento temporário e enviar 
            // apenas um link para o arquivo, mas para simplicidade neste exemplo, estamos enviando o arquivo 
            // diretamente como base64)
            const buffer = await data.toBuffer();
            const documentBase64 = buffer.toString('base64');

            const response = await graph.invoke({
                messages: [new HumanMessage(question)],
                documentBase64,
            });

            return {
                filename: data.filename,
                question,
                answer: response.messages.at(-1)?.text || 'No answer generated',
                error: response.error,
            };
        } catch (error) {
            console.error('Error analyzing document:', error);
            return reply.status(500).send({
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    });

    return app;
};

