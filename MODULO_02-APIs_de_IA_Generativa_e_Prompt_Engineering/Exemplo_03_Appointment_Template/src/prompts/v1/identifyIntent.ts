import { z } from 'zod';

export const IntentSchema = z.object({
  intent: z.enum(['schedule', 'cancel', 'unknown']).describe('The user intent'),
  professionalId: z.number().optional().describe('ID of the medical professional'),
  professionalName: z.string().optional().describe('Name of the medical professional'),
  datetime: z.string().optional().describe('Appointment date and time in ISO format'),
  patientName: z.string().optional().describe('Patient name extracted from question'),
  reason: z.string().optional().describe('Reason for appointment (for scheduling)'),
});

export type IntentData = z.infer<typeof IntentSchema>;

// O SystemPrompt fornece as regras e exemplos para a IA entender como identificar a intenção do usuário e extrair os 
// detalhes relevantes, antes mesmo da pergunta real do usuário ser processada.
export const getSystemPrompt = (professionals: any[]) => {
  return JSON.stringify({
    role: 'Intent Classifier for Medical Appointments',
    task: 'Identify user intent and extract all appointment-related details',
    // O campo "professionals" é uma lista de profissionais de saúde disponíveis, 
    // que a IA pode usar para fazer correspondências com os nomes mencionados pelo usuário.
    // Poderia vir de um banco de dados ou API externa
    professionals: professionals.map(p => ({ id: p.id, name: p.name, specialty: p.specialty })),
    // O campo "current_date" é usado como referência para interpretar datas relativas como "hoje" ou "amanhã", 
    // garantindo que a IA possa converter essas expressões em datas absolutas no formato ISO.
    current_date: new Date().toISOString(),
    rules: {
      schedule: {
        description: 'User wants to book/schedule a new appointment',
        keywords: ['schedule', 'book', 'appointment', 'I want to', 'make an appointment'],
        required_fields: ['professionalId', 'datetime', 'patientName'],
        optional_fields: ['reason']
      },
      cancel: {
        description: 'User wants to cancel an existing appointment',
        keywords: ['cancel', 'remove', 'delete', 'cancel my appointment'],
        required_fields: ['professionalId', 'datetime', 'patientName']
      },
      unknown: {
        description: 'Anything not related to scheduling or cancelling appointments',
        examples: ['weather questions', 'general info', 'unrelated queries']
      }
    },

    // ===== IMPORTANTE ===== 
    // As "extraction_instructions" fornecem orientações específicas para a IA sobre como extrair cada 
    // detalhe relevante da pergunta do usuário, garantindo que os dados sejam formatados corretamente e correspondam às 
    // informações disponíveis (como os IDs dos profissionais).
    extraction_instructions: {
      professionalId: 'Match the professional name mentioned in the question to the ID from the professionals list. Use fuzzy matching.',
      professionalName: 'Extract the professional name as mentioned by the user',
      datetime: 'Parse relative dates (today, tomorrow) and times. Convert to ISO format. Use current_date as reference.',
      patientName: 'Extract the patient name from the question or context',
      reason: 'Extract the reason/purpose for the appointment (only for scheduling)'
    },

    // ===== IMPORTANTE ===== 
    // Os "examples" fornecem casos de uso concretos para a IA, mostrando como perguntas típicas dos usuários devem 
    // ser interpretadas e quais dados devem ser extraídos.
    examples: [
      {
        input: 'I want to schedule with Dr. Alicio da Silva for tomorrow at 4pm for a check-up',
        output: { intent: 'schedule', professionalId: 1, professionalName: 'Dr. Alicio da Silva', datetime: '2026-02-12T16:00:00.000Z', reason: 'check-up' }
      },
      {
        input: 'Cancel my appointment with Dr. Ana Pereira today at 11am',
        output: { intent: 'cancel', professionalId: 2, professionalName: 'Dr. Ana Pereira', datetime: '2026-02-11T11:00:00.000Z' }
      },
      {
        input: 'What is the weather today?',
        output: { intent: 'unknown' }
      }
    ]
  });
};

export const getUserPromptTemplate = (question: string) => {
  return JSON.stringify({
    question,
    // ===== IMPORTANTE ===== 
    // As "instructions" fornecem orientações claras para a IA sobre como processar a pergunta do usuário,
    // garantindo que ela siga os passos corretos para identificar a intenção e extrair os detalhes relevantes 
    // de forma precisa.
    instructions: [
      'Carefully analyze the question to determine the user intent',
      'Extract all relevant appointment details',
      'Convert dates and times to ISO format',
      'Match professional names to their IDs',
      'Return only the fields that are present in the question'
    ]
  });
};
