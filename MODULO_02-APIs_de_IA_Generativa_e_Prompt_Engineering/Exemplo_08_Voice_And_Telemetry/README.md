# Modelos Multimodais para trabalhar com voz

Atualmente, apenas (poucos modelos)[https://openrouter.ai/models?fmt=cards&output_modalities=audio] dão suporte a trabalhar recebendo e enviando audio, mas apenas a OpenAI possui o (Realtime API)[https://developers.openai.com/api/docs/guides/realtime] que permite o processamento de áudio em tempo real, mantendo o microfone do usuário aberto e interpretando em tempo de execução, o que é ideal para casos de uso como transcrição de voz, análise de sentimentos em chamadas de atendimento ao cliente ou criação de assistentes virtuais que podem entender e responder a comandos de voz. Apesar disso, os custos de uso dessas APIs de áudio são significativamente mais altos do que os modelos de texto, o que pode ser um fator limitante para muitos projetos, especialmente aqueles com orçamentos limitados ou que exigem processamento de grandes volumes de dados de áudio.

# Telemetria

Uma forma de acompanhar os prompts enviados para o OpenRouter, as respostas recebidas e o desempenho geral do modelo é usar a telemetria integrada do (Langfuse)[https://langfuse.com/docs/demo], que é uma plataforma de monitoramento e análise de IA que se integra facilmente com o Langchain para fornecer insights detalhados sobre as interações do modelo.

Nele, também podemos comparar o desempenho de diferentes prompts utilizando a funcionalidade de (Prompt Management)[https://langfuse.com/docs/prompt-management/overview], que nos permite criar variações de prompts e comparar seus resultados para otimizar a eficácia do modelo.

Por fim, um conceito relevante também é o de testes automatizados de prompts, onde as respostas do modelo são avaliadas com base na framework de (Evaluation)[https://langfuse.com/docs/evaluation/core-concepts] do Langfuse, que nos permite definir critérios de avaliação para as respostas do modelo e automatizar o processo de teste para garantir que os prompts estejam gerando as respostas desejadas de forma consistente.