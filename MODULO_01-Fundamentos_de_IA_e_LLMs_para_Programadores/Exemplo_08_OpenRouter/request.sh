. ./.env

API_URL="https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_SITE_URL="http://localhost:3000"
OPENROUTER_SITE_NAME="Exemplo OpenRouter"

NLP_MODEL="qwen/qwen3.6-plus-preview:free"

curl --silent -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "HTTP-Referer: $OPENROUTER_SITE_URL" \
  -H "X-Title: $OPENROUTER_SITE_NAME" \
  -d '{
    "model": "'$NLP_MODEL'",
    "messages": [
      {
        "role": "user", 
        "content": "Me conte uma curiosidade sobre LLMs"
      }
    ],
    "temperature": 0.3,
    "max_tokens": 1000
  }' | jq 

# A opção `--silent` é usada para suprimir a barra de progresso do `curl`, tornando a saída mais limpa. O comando `jq` é usado para formatar a resposta JSON de maneira legível.

# Temperature é um parâmetro que controla a aleatoriedade da resposta do
# modelo. Valores mais baixos (como 0.2) tendem a gerar respostas mais 
# conservadoras e repetitivas, enquanto valores mais altos (como 0.8) podem 
# produzir respostas mais criativas e variadas. No exemplo, usamos 0.3 para um 
# equilíbrio entre coerência e criatividade.

# Para executar este script, é preciso ter o `jq` instalado no sistema. 
# Basta executar `sudo apt-get install jq` no Debian/Ubuntu

# Para executar o script, basta usar o comando:
# sh request.sh


# Exemplo de resposta:  

# {
#   "id": "gen-1774934399-ZsKFnQLUuurKBCeY0Yp2",
#   "object": "chat.completion",
#   "created": 1774934399,
#   "model": "qwen/qwen3.6-plus-preview:free",
#   "provider": "Alibaba",
#   "system_fingerprint": null,
#   "choices": [
#     {
#       "index": 0,
#       "logprobs": null,
#       "finish_reason": "stop",
#       "native_finish_reason": "stop",
#       "message": {
#         "role": "assistant",
#         "content": "Uma curiosidade que costuma surpreender é que **LLMs não \"aprendem\" ou se adaptam durante o uso**. Depois do treinamento, os pesos do modelo (que funcionam como sua \"memória de longo prazo\") ficam completamente congelados. \n\nO que parece um aprendizado em tempo real é, na verdade, o modelo usando o histórico da conversa atual como **contexto temporário** para calcular a próxima palavra. Se você fechar a janela ou iniciar um novo chat, ele \"esquece\" tudo instantaneamente. Não é um bug, é uma escolha de arquitetura: isso garante estabilidade, segurança e previsibilidade, já que atualizar pesos em tempo real poderia corromper o modelo ou vazar dados.\n\nPor isso, frases como *\"lembre-se disso para a próxima vez\"* só funcionam dentro da mesma sessão. Para que um LLM realmente \"aprenda\" algo novo, ele precisa passar por um novo ciclo de treinamento ou ajuste fino (fine-tuning) feito pelos desenvolvedores.\n\nQuer que eu explique como o \"contexto temporário\" funciona nos bastidores ou como os desenvolvedores contornam essa limitação na prática?",
#         "refusal": null,
#         "reasoning": "Here's a thinking process:\n\n1.  **Analyze User Input:**\n   - **Language:** Portuguese\n   - **Topic:** LLMs (Large Language Models)\n   - **Request:** \"Me conte uma curiosidade sobre LLMs\" (Tell me a curiosity/fun fact about LLMs)\n\n2.  **Identify Key Requirements:**\n   - Must be in Portuguese\n   - Must be a genuine, interesting curiosity/fact about LLMs\n   - Should be accurate, up-to-date, and engaging\n   - Keep it concise but informative\n\n3.  **Brainstorming Curiosities about LLMs:**\n   - LLMs don't \"understand\" language like humans; they predict the next token based on patterns.\n   - They can exhibit emergent abilities not explicitly trained for.\n   - The training data size is massive (trillions of tokens).\n   - They can be \"jailbroken\" or show unexpected behaviors due to prompt engineering.\n   - They don't have memory between sessions unless explicitly designed to.\n   - The term \"hallucination\" was coined for AI generating false but plausible information.\n   - LLMs are sensitive to prompt formatting (e.g., adding \"Let's think step by step\" improves reasoning).\n   - They can sometimes \"memorize\" training data verbatim, raising privacy/copyright concerns.\n   - The scaling laws show that performance improves predictably with more data/compute/parameters.\n   - Some LLMs can be fine-tuned to mimic specific writing styles or personalities.\n\n4.  **Select the Best Curiosity:**\n   I'll go with the **\"emergent abilities\"** or **\"prompt sensitivity\"** angle, but actually, the **\"LLMs don't understand meaning, they predict tokens\"** is fundamental but maybe too basic. \n   Another great one: **\"LLMs can 'hallucinate' because they're optimized for plausibility, not truth.\"**\n   But I think a more surprising/engaging one is: **\"LLMs não têm consciência nem 'memória' real entre conversas — cada interação é processada do zero, e o que parece 'personalidade' é apenas um padrão estatístico treinado em bilhões de textos.\"** (LLMs don't have consciousness or real memory between conversations — each interaction is processed from scratch, and what seems like 'personality' is just a statistical pattern trained on billions of texts.)\n   Wait, let's pick something more specific and less commonly known but still accurate: **\"A capacidade de 'raciocínio' em LLMs muitas vezes surge não de lógica programada, mas de padrões estatísticos tão complexos que simulam etapas de pensamento — e um simples truque como pedir 'pense passo a passo' pode melhorar drasticamente a precisão, mesmo sem alterar o modelo.\"** (The 'reasoning' ability in LLMs often emerges not from programmed logic, but from statistical patterns so complex they simulate thinking steps — and a simple trick like asking 'think step by step' can drastically improve accuracy, even without changing the model.)\n\n   Actually, let's go with a well-documented, fascinating curiosity: **\"LLMs não 'aprendem' durante o uso — eles são estáticos após o treinamento. O que parece aprendizado em tempo real é apenas o modelo usando o contexto da conversa atual como 'memória temporária', mas seus pesos nunca mudam.\"** (LLMs don't 'learn' during use — they're static after training. What seems like real-time learning is just the model using the current conversation context as 'temporary memory', but its weights never change.)\n\n   This is accurate, counterintuitive, and educational.\n\n5.  **Structure the Response (in Portuguese):**\n   - Start with a clear, engaging statement\n   - Explain the curiosity simply\n   - Add context/why it matters\n   - Keep it concise\n   - Ensure technical accuracy\n\n   Draft:\n   Uma curiosidade fascinante é que **LLMs não \"aprendem\" ou se adaptam durante o uso**. Depois de treinados, seus pesos (os \"conhecimentos\" internos) ficam congelados. O que parece um aprendizado em tempo real é, na verdade, o modelo usando o histórico da conversa atual como contexto temporário para gerar a próxima resposta. Se você fechar o chat e abrir outro, ele \"esquece\" tudo — não por falha, mas por design. Isso também explica por que ele não guarda preferências pessoais ou evolui com o tempo, a menos que seja explicitamente re-treinado ou ajustado pelos desenvolvedores.\n\n   Check accuracy:\n   - True: LLMs are static post-training\n   - True: Context window acts as short-term memory\n   - True: No persistent learning between sessions\n   - Clear, non-technical but precise\n   - In Portuguese\n\n   Could add a fun twist: \"Por isso, pedir 'lembre-se disso para depois' só funciona dentro da mesma sessão!\"\n\n6.  **Refine (Self-Correction/Verification):**\n   - Is it accurate? Yes.\n   - Is it a \"curiosidade\"? Yes, counterintuitive for many users.\n   - Language: Natural Portuguese.\n   - Length: Concise.\n   - No overclaiming, no anthropomorphism.\n   - Matches current AI understanding (as of 2024/2025).\n\n   Final check of facts:\n   - LLM weights are fixed after training/fine-tuning\n   - Inference uses context window, not weight updates\n   - No online learning in standard deployments\n   - Correct.\n\n   Ready. Output matches the refined version.✅\n",
#         "reasoning_details": [
#           {
#             "type": "reasoning.text",
#             "text": "Here's a thinking process:\n\n1.  **Analyze User Input:**\n   - **Language:** Portuguese\n   - **Topic:** LLMs (Large Language Models)\n   - **Request:** \"Me conte uma curiosidade sobre LLMs\" (Tell me a curiosity/fun fact about LLMs)\n\n2.  **Identify Key Requirements:**\n   - Must be in Portuguese\n   - Must be a genuine, interesting curiosity/fact about LLMs\n   - Should be accurate, up-to-date, and engaging\n   - Keep it concise but informative\n\n3.  **Brainstorming Curiosities about LLMs:**\n   - LLMs don't \"understand\" language like humans; they predict the next token based on patterns.\n   - They can exhibit emergent abilities not explicitly trained for.\n   - The training data size is massive (trillions of tokens).\n   - They can be \"jailbroken\" or show unexpected behaviors due to prompt engineering.\n   - They don't have memory between sessions unless explicitly designed to.\n   - The term \"hallucination\" was coined for AI generating false but plausible information.\n   - LLMs are sensitive to prompt formatting (e.g., adding \"Let's think step by step\" improves reasoning).\n   - They can sometimes \"memorize\" training data verbatim, raising privacy/copyright concerns.\n   - The scaling laws show that performance improves predictably with more data/compute/parameters.\n   - Some LLMs can be fine-tuned to mimic specific writing styles or personalities.\n\n4.  **Select the Best Curiosity:**\n   I'll go with the **\"emergent abilities\"** or **\"prompt sensitivity\"** angle, but actually, the **\"LLMs don't understand meaning, they predict tokens\"** is fundamental but maybe too basic. \n   Another great one: **\"LLMs can 'hallucinate' because they're optimized for plausibility, not truth.\"**\n   But I think a more surprising/engaging one is: **\"LLMs não têm consciência nem 'memória' real entre conversas — cada interação é processada do zero, e o que parece 'personalidade' é apenas um padrão estatístico treinado em bilhões de textos.\"** (LLMs don't have consciousness or real memory between conversations — each interaction is processed from scratch, and what seems like 'personality' is just a statistical pattern trained on billions of texts.)\n   Wait, let's pick something more specific and less commonly known but still accurate: **\"A capacidade de 'raciocínio' em LLMs muitas vezes surge não de lógica programada, mas de padrões estatísticos tão complexos que simulam etapas de pensamento — e um simples truque como pedir 'pense passo a passo' pode melhorar drasticamente a precisão, mesmo sem alterar o modelo.\"** (The 'reasoning' ability in LLMs often emerges not from programmed logic, but from statistical patterns so complex they simulate thinking steps — and a simple trick like asking 'think step by step' can drastically improve accuracy, even without changing the model.)\n\n   Actually, let's go with a well-documented, fascinating curiosity: **\"LLMs não 'aprendem' durante o uso — eles são estáticos após o treinamento. O que parece aprendizado em tempo real é apenas o modelo usando o contexto da conversa atual como 'memória temporária', mas seus pesos nunca mudam.\"** (LLMs don't 'learn' during use — they're static after training. What seems like real-time learning is just the model using the current conversation context as 'temporary memory', but its weights never change.)\n\n   This is accurate, counterintuitive, and educational.\n\n5.  **Structure the Response (in Portuguese):**\n   - Start with a clear, engaging statement\n   - Explain the curiosity simply\n   - Add context/why it matters\n   - Keep it concise\n   - Ensure technical accuracy\n\n   Draft:\n   Uma curiosidade fascinante é que **LLMs não \"aprendem\" ou se adaptam durante o uso**. Depois de treinados, seus pesos (os \"conhecimentos\" internos) ficam congelados. O que parece um aprendizado em tempo real é, na verdade, o modelo usando o histórico da conversa atual como contexto temporário para gerar a próxima resposta. Se você fechar o chat e abrir outro, ele \"esquece\" tudo — não por falha, mas por design. Isso também explica por que ele não guarda preferências pessoais ou evolui com o tempo, a menos que seja explicitamente re-treinado ou ajustado pelos desenvolvedores.\n\n   Check accuracy:\n   - True: LLMs are static post-training\n   - True: Context window acts as short-term memory\n   - True: No persistent learning between sessions\n   - Clear, non-technical but precise\n   - In Portuguese\n\n   Could add a fun twist: \"Por isso, pedir 'lembre-se disso para depois' só funciona dentro da mesma sessão!\"\n\n6.  **Refine (Self-Correction/Verification):**\n   - Is it accurate? Yes.\n   - Is it a \"curiosidade\"? Yes, counterintuitive for many users.\n   - Language: Natural Portuguese.\n   - Length: Concise.\n   - No overclaiming, no anthropomorphism.\n   - Matches current AI understanding (as of 2024/2025).\n\n   Final check of facts:\n   - LLM weights are fixed after training/fine-tuning\n   - Inference uses context window, not weight updates\n   - No online learning in standard deployments\n   - Correct.\n\n   Ready. Output matches the refined version.✅\n",
#             "format": "unknown",
#             "index": 0
#           }
#         ]
#       }
#     }
#   ],
#   "usage": {
#     "prompt_tokens": 19,
#     "completion_tokens": 1450,
#     "total_tokens": 1469,
#     "cost": 0,
#     "is_byok": false,
#     "prompt_tokens_details": {
#       "cached_tokens": 0,
#       "cache_write_tokens": 0,
#       "audio_tokens": 0,
#       "video_tokens": 0
#     },
#     "cost_details": {
#       "upstream_inference_cost": 0,
#       "upstream_inference_prompt_cost": 0,
#       "upstream_inference_completions_cost": 0
#     },
#     "completion_tokens_details": {
#       "reasoning_tokens": 1203,
#       "image_tokens": 0,
#       "audio_tokens": 0
#     }
#   }
# }