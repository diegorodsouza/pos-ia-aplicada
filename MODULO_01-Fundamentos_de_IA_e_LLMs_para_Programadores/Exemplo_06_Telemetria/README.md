# Telemetria por Agente

Nesse exemplo, temos um cenário onde um sistema de monitoramento de telemetria, como o Grafana, está apresentando um erro 500. O objetivo é configurar um agente que, a partir dos logs de telemetria disponíveis, seja capaz de analisar as informações e identificar a causa raiz do erro, fornecendo insights valiosos para a resolução do problema. Com isso, demonstramos como agentes podem ser utilizados para interpretar dados de telemetria e auxiliar na identificação e solução de falhas em sistemas complexos.

## Stack

**Client:** TypeScript, Node.js

**Server:** Docker com Blackbox, Grafana, Loki, Prometheus, Tempo

## Libs em Destaque

`grafana` via MCP

## Estrutura do Projeto

- `alumnus/_alumnus`: Código da API em TypeScript para consulta de telemetria e análise de logs
- `alumnus/infra`: Configuração de infraestrutura utilizando Docker Compose para Grafana, Prometheus, Loki, Tempo e Blackbox Exporter
- `alumnus/docs`: Exemplo de Prompts individuais para consulta de telemetria e análise de logs utilizando o MCP do Grafana
- `relatorio-de-erro`: Exemplo de relatório gerado pelo agente a partir da análise dos logs de telemetria

## Arquitetura do Projeto

- OpenTelemetry: Padrão aberto para coleta de telemetria, incluindo métricas, logs e rastreamentos (Central Hub)
- Grafana: Interface de visualização de dashboards e análise de telemetria (Visualization Layer)
- Prometheus: Sistema de coleta e armazenamento de métricas (Metrics Layer)
- Loki: Sistema de coleta e armazenamento de logs (Logs Layer)
- Tempo: Sistema de rastreamento de requisições e análise de performance (Traces Layer)
- Blackbox Exporter: Exportador para monitoramento de endpoints externos

```
┌─────────────┐
│  Demo App   │ ──────┐
└─────────────┘       │
                      │ OTLP (gRPC)
                      ▼
            ┌──────────────────────┐
            │ OpenTelemetry        │
            │ Collector            │
            │ (Central Hub)        │
            └──────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        │             │             │             │
        ▼             ▼             ▼             ▼
   ┌────────┐   ┌────────┐   ┌─────────┐   ┌────────┐
   │ Tempo  │   │  Loki  │   │ Prom    │   │        │
   │(Traces)│   │ (Logs) │   │(Metrics)│   │  ....  │
   └────────┘   └────────┘   └─────────┘   └────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
                      ▼
                ┌───────────┐
                │  Grafana  │
                │(Visualize)│
                └───────────┘
```

## Demo

Dashboard de erros do Grafana:
<img width="1846" height="906" alt="image" src="https://github.com/user-attachments/assets/b48c005b-8a01-473d-a1d2-26c3ba38bc03" />


## Roteiro para execução

1. Acessar a pasta do projeto

```
cd alumnus/infra
```

2. Inicializar os serviços de infra utilizando Docker Compose:

```
docker-compose -f docker-compose-infra.yaml up --wait
```

3. Validar o funcionamento da infra de acordo com a seguinte tabela:

| Serviço           | URL de Acesso         | Descrição                                                       |
| ----------------- | --------------------- | --------------------------------------------------------------- |
| Grafana           | http://localhost:3000 | Interface de visualização de dashboards e análise de telemetria |
| Prometheus        | http://localhost:9090 | Sistema de coleta e armazenamento de métricas                   |
| Blackbox Exporter | http://localhost:9115 | Exportador para monitoramento de endpoints externos             |

4. Acessar a pasta do código da API e instalar as dependências:

```
cd ../_alumnus
npm install
```

5. Iniciar a API para consulta de telemetria e análise de logs:

```npm start

```

6. Visualizar os dashboards de telemetria no Grafana e validar a presença de métricas, logs e rastreamentos coletados pela aplicação de demonstração em:

`http://localhost:3000/dashboards`

8. Configurar o MCP do Grafana no VSCode

```
{
  "mcpServers": {
    "grafana": {
			"type": "sse",
			"url": "http://localhost:8000/mcp"
		}
  }
}
```

7. Utilizar o prompt "Single Comprehensive Prompt" disponível na pasta `alumnus/docs/prompt.md` para realizar uma consulta completa de diagnóstico a partir dos dados de telemetria disponíveis, utilizando o MCP do Grafana para obter insights sobre a causa do erro 500 e possíveis soluções.

8. Analisar o relatório gerado pelo agente a partir da consulta de telemetria e validar as conclusões e recomendações fornecidas para resolução do erro 500.

9. Finalizar os serviços de infra utilizando Docker Compose:

```docker-compose -f docker-compose-infra.yaml down -v
```

## Outros Prompts Interessantes

```
List all currently firing alerts from Prometheus

Query Prometheus for HTTP request rate from the alumnus application over the last hour

Search Loki logs for error messages in the last 30 minutes with trace IDs

Find slow database queries in Tempo traces where PostgreSQL operations took longer than 500ms

Query Tempo directly for traces with high latency in the last hour

```
