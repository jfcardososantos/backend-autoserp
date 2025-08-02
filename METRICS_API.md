# API de Métricas - autoSERP Backend

## Visão Geral

O endpoint de métricas fornece estatísticas detalhadas sobre o sistema, permitindo filtrar por período e instância específica.

## Endpoints Disponíveis

### 1. Métricas Gerais
**GET** `/metrics`

Retorna métricas completas do sistema com filtros de período.

#### Parâmetros de Query:
- `period` (opcional): Período de filtro
  - `day` - Hoje
  - `week` - Esta semana (segunda a domingo)
  - `month` - Este mês
  - `year` - Este ano
  - `all` - Todos os registros (padrão)
- `instance` (opcional): Filtrar por instância específica

#### Exemplos de Uso:
```bash
# Todas as métricas
GET /metrics

# Métricas do dia
GET /metrics?period=day

# Métricas da semana para uma instância específica
GET /metrics?period=week&instance=prefeitura_sp

# Métricas do mês
GET /metrics?period=month
```

#### Resposta:
```json
{
  "period": "day",
  "instance": "prefeitura_sp",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "metrics": {
    "funcionarios": 25,
    "infogeral": 1,
    "informacoes_to_vector": 150,
    "n8n_chat_histories_dados_ia": 1200,
    "n8n_chat_histories_informacoes_ia": 800,
    "recados": 45,
    "reunioes": 12,
    "usuarios": 180,
    "recados_with_response": 38,
    "recados_pending": 7,
    "reunioes_today": 3,
    "reunioes_this_week": 8,
    "reunioes_this_month": 12,
    "funcionarios_por_cargo": [
      {
        "cargo": "Secretário",
        "total": 5
      },
      {
        "cargo": "Assessor",
        "total": 3
      }
    ],
    "usuarios_por_zona": [
      {
        "zona": "Centro",
        "total": 45
      },
      {
        "zona": "Norte",
        "total": 32
      }
    ]
  },
  "summary": {
    "total_records": 2413,
    "total_tables": 8
  }
}
```

### 2. Métricas em Tempo Real
**GET** `/metrics/realtime`

Retorna métricas das últimas 24 horas.

#### Parâmetros de Query:
- `instance` (opcional): Filtrar por instância específica

#### Exemplo de Uso:
```bash
# Métricas das últimas 24h
GET /metrics/realtime

# Métricas das últimas 24h para uma instância específica
GET /metrics/realtime?instance=prefeitura_sp
```

#### Resposta:
```json
{
  "period": "last_24h",
  "instance": "prefeitura_sp",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "metrics": {
    "new_recados": 5,
    "new_reunioes": 2,
    "new_usuarios": 3,
    "new_funcionarios": 1,
    "chat_interactions": 45,
    "info_interactions": 28
  }
}
```

## Métricas Disponíveis

### Contadores Básicos
- **funcionarios**: Total de funcionários cadastrados
- **infogeral**: Total de informações gerais
- **informacoes_to_vector**: Total de informações para vetorização
- **n8n_chat_histories_dados_ia**: Total de interações do chat de dados
- **n8n_chat_histories_informacoes_ia**: Total de interações do chat de informações
- **recados**: Total de recados
- **reunioes**: Total de reuniões
- **usuarios**: Total de usuários

### Métricas Específicas
- **recados_with_response**: Recados com resposta do funcionário
- **recados_pending**: Recados pendentes de resposta
- **reunioes_today**: Reuniões agendadas para hoje
- **reunioes_this_week**: Reuniões agendadas para esta semana
- **reunioes_this_month**: Reuniões agendadas para este mês

### Agrupamentos
- **funcionarios_por_cargo**: Distribuição de funcionários por cargo
- **usuarios_por_zona**: Distribuição de usuários por zona

## Códigos de Erro

- `400`: Parâmetros inválidos (período não reconhecido)
- `500`: Erro interno do servidor

## Observações

1. **Filtros de Data**: Os filtros de período são baseados no campo `created_at` das tabelas
2. **Filtros de Instância**: Permitem segmentar métricas por instância específica
3. **Performance**: Para grandes volumes de dados, considere implementar cache
4. **Segurança**: Considere adicionar autenticação para endpoints de métricas em produção

## Implementação Futura

- Cache Redis para melhorar performance
- Métricas agregadas por hora/dia
- Exportação de relatórios em CSV/PDF
- Dashboards em tempo real
- Alertas baseados em thresholds 