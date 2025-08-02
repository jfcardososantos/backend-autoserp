import { pool } from '../app.js';

export async function getMetrics(req, res) {
  try {
    const { period = 'all', instance } = req.query;
    
    // Validação do período
    const validPeriods = ['day', 'week', 'month', 'year', 'all'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ 
        error: 'Período inválido. Use: day, week, month, year, all' 
      });
    }

    // Construir filtro de data baseado no período
    let dateFilter = '';
    let dateParams = [];
    let paramIndex = 1;

    if (period !== 'all') {
      const now = new Date();
      let startDate;

      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          const dayOfWeek = now.getDay();
          const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToSubtract);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      dateFilter = `WHERE created_at >= $${paramIndex}`;
      dateParams.push(startDate.toISOString());
      paramIndex++;
    }

    // Adicionar filtro de instance se fornecido
    if (instance) {
      const instanceFilter = dateFilter ? 'AND' : 'WHERE';
      dateFilter += ` ${instanceFilter} instance = $${paramIndex}`;
      dateParams.push(instance);
    }

    // Queries para cada tabela
    const queries = {
      funcionarios: `SELECT COUNT(*) as total FROM funcionarios ${dateFilter}`,
      infogeral: `SELECT COUNT(*) as total FROM infogeral ${dateFilter}`,
      informacoes_to_vector: `SELECT COUNT(*) as total FROM informacoes_to_vector ${dateFilter}`,
      n8n_chat_histories_dados_ia: `SELECT COUNT(*) as total FROM n8n_chat_histories_dados_ia ${dateFilter}`,
      n8n_chat_histories_informacoes_ia: `SELECT COUNT(*) as total FROM n8n_chat_histories_informacoes_ia ${dateFilter}`,
      recados: `SELECT COUNT(*) as total FROM recados ${dateFilter}`,
      reunioes: `SELECT COUNT(*) as total FROM reunioes ${dateFilter}`,
      usuarios: `SELECT COUNT(*) as total FROM usuarios ${dateFilter}`
    };

    // Executar todas as queries
    const results = {};
    
    for (const [tableName, query] of Object.entries(queries)) {
      try {
        const result = await pool.query(query, dateParams);
        results[tableName] = parseInt(result.rows[0].total);
      } catch (error) {
        console.error(`Erro ao consultar ${tableName}:`, error);
        results[tableName] = 0;
      }
    }

    // Métricas específicas adicionais
    const additionalMetrics = {};

    // Total de recados por status (com resposta ou sem)
    try {
      const recadosWithResponseQuery = `
        SELECT 
          COUNT(*) as total_with_response,
          COUNT(CASE WHEN respostafuncionario IS NULL OR respostafuncionario = '' THEN 1 END) as total_pending
        FROM recados ${dateFilter}
      `;
      const recadosResult = await pool.query(recadosWithResponseQuery, dateParams);
      additionalMetrics.recados_with_response = parseInt(recadosResult.rows[0].total_with_response);
      additionalMetrics.recados_pending = parseInt(recadosResult.rows[0].total_pending);
    } catch (error) {
      console.error('Erro ao consultar métricas de recados:', error);
      additionalMetrics.recados_with_response = 0;
      additionalMetrics.recados_pending = 0;
    }

    // Reuniões por período (hoje, esta semana, este mês)
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const reunioesPeriodQuery = `
        SELECT 
          COUNT(CASE WHEN starttime >= $1 THEN 1 END) as today,
          COUNT(CASE WHEN starttime >= $2 THEN 1 END) as this_week,
          COUNT(CASE WHEN starttime >= $3 THEN 1 END) as this_month
        FROM reunioes ${dateFilter}
      `;
      
      const reunioesParams = [...dateParams, today.toISOString(), weekStart.toISOString(), monthStart.toISOString()];
      const reunioesResult = await pool.query(reunioesPeriodQuery, reunioesParams);
      
      additionalMetrics.reunioes_today = parseInt(reunioesResult.rows[0].today);
      additionalMetrics.reunioes_this_week = parseInt(reunioesResult.rows[0].this_week);
      additionalMetrics.reunioes_this_month = parseInt(reunioesResult.rows[0].this_month);
    } catch (error) {
      console.error('Erro ao consultar métricas de reuniões:', error);
      additionalMetrics.reunioes_today = 0;
      additionalMetrics.reunioes_this_week = 0;
      additionalMetrics.reunioes_this_month = 0;
    }

    // Funcionários por cargo
    try {
      const funcionariosCargoQuery = `
        SELECT 
          cargo,
          COUNT(*) as total
        FROM funcionarios ${dateFilter}
        GROUP BY cargo
        ORDER BY total DESC
      `;
      const funcionariosResult = await pool.query(funcionariosCargoQuery, dateParams);
      additionalMetrics.funcionarios_por_cargo = funcionariosResult.rows;
    } catch (error) {
      console.error('Erro ao consultar funcionários por cargo:', error);
      additionalMetrics.funcionarios_por_cargo = [];
    }

    // Usuários por zona
    try {
      const usuariosZonaQuery = `
        SELECT 
          zona,
          COUNT(*) as total
        FROM usuarios ${dateFilter}
        GROUP BY zona
        ORDER BY total DESC
      `;
      const usuariosResult = await pool.query(usuariosZonaQuery, dateParams);
      additionalMetrics.usuarios_por_zona = usuariosResult.rows;
    } catch (error) {
      console.error('Erro ao consultar usuários por zona:', error);
      additionalMetrics.usuarios_por_zona = [];
    }

    // Resposta final
    const response = {
      period,
      instance: instance || 'all',
      timestamp: new Date().toISOString(),
      metrics: {
        ...results,
        ...additionalMetrics
      },
      summary: {
        total_records: Object.values(results).reduce((sum, count) => sum + count, 0),
        total_tables: Object.keys(results).length
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Erro ao obter métricas:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor ao obter métricas',
      details: error.message 
    });
  }
}

// Endpoint para métricas em tempo real (últimas 24h)
export async function getRealTimeMetrics(req, res) {
  try {
    const { instance } = req.query;
    
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    let dateFilter = 'WHERE created_at >= $1';
    let params = [last24h.toISOString()];
    
    if (instance) {
      dateFilter += ' AND instance = $2';
      params.push(instance);
    }

    // Métricas das últimas 24h
    const queries = {
      new_recados: `SELECT COUNT(*) as total FROM recados ${dateFilter}`,
      new_reunioes: `SELECT COUNT(*) as total FROM reunioes ${dateFilter}`,
      new_usuarios: `SELECT COUNT(*) as total FROM usuarios ${dateFilter}`,
      new_funcionarios: `SELECT COUNT(*) as total FROM funcionarios ${dateFilter}`,
      chat_interactions: `SELECT COUNT(*) as total FROM n8n_chat_histories_dados_ia ${dateFilter}`,
      info_interactions: `SELECT COUNT(*) as total FROM n8n_chat_histories_informacoes_ia ${dateFilter}`
    };

    const results = {};
    
    for (const [metricName, query] of Object.entries(queries)) {
      try {
        const result = await pool.query(query, params);
        results[metricName] = parseInt(result.rows[0].total);
      } catch (error) {
        console.error(`Erro ao consultar ${metricName}:`, error);
        results[metricName] = 0;
      }
    }

    res.json({
      period: 'last_24h',
      instance: instance || 'all',
      timestamp: now.toISOString(),
      metrics: results
    });

  } catch (error) {
    console.error('Erro ao obter métricas em tempo real:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor ao obter métricas em tempo real',
      details: error.message 
    });
  }
} 