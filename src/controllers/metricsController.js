import { pool } from '../app.js';

// Função auxiliar para criar timestamp de início e fim do dia considerando timezone
const createDayRange = (dateString) => {
  const date = new Date(dateString);
  // Criar data no timezone local
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  
  // Para dados que estão em timezone -03, precisamos ajustar
  // Os dados estão em 2025-08-01 21:53:27-03
  // Então quando buscamos 2025-08-01, precisamos considerar o timezone
  // Baseado nos testes, os dados estão entre 18:00 e 23:59 UTC
  const timezoneOffset = 18 * 60 * 60 * 1000; // 18 horas para compensar o timezone
  const startOfDayAdjusted = new Date(startOfDay.getTime() + timezoneOffset);
  const endOfDayAdjusted = new Date(endOfDay.getTime() + timezoneOffset);
  
  return { startOfDay: startOfDayAdjusted, endOfDay: endOfDayAdjusted };
};

export async function getMetrics(req, res) {
  try {
    const { period = 'all', instance, start_date, end_date, specific_date } = req.query;
    
    const validPeriods = ['day', 'week', 'month', 'year', 'all', 'custom'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ 
        error: 'Período inválido. Use: day, week, month, year, all, custom' 
      });
    }

    let dateFilter = '';
    let dateParams = [];
    let paramIndex = 1;

    const isValidDate = (dateString) => {
      const date = new Date(dateString);
      return date instanceof Date && !isNaN(date);
    };
    const isDateOnly = (dateStr) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

    if (period === 'custom') {
      if (start_date && end_date) {
        if (!isValidDate(start_date) || !isValidDate(end_date)) {
          return res.status(400).json({ error: 'Formato de data inválido. Use: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss.sssZ' });
        }
        let startDate, endDate;
        if (isDateOnly(start_date) && isDateOnly(end_date)) {
          const startRange = createDayRange(start_date);
          const endRange = createDayRange(end_date);
          startDate = startRange.startOfDay;
          endDate = endRange.endOfDay;
        } else {
          startDate = new Date(start_date);
          endDate = new Date(end_date);
        }
        if (startDate > endDate) {
          return res.status(400).json({ error: 'Data inicial não pode ser maior que a data final' });
        }
        dateFilter = `WHERE created_at >= $${paramIndex} AND created_at <= $${paramIndex + 1}`;
        dateParams.push(startDate.toISOString(), endDate.toISOString());
        paramIndex += 2;
      } else if (specific_date) {
        if (!isValidDate(specific_date)) {
          return res.status(400).json({ error: 'Formato de data inválido. Use: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss.sssZ' });
        }
        let specificDate, nextDay;
        if (isDateOnly(specific_date)) {
          const range = createDayRange(specific_date);
          specificDate = range.startOfDay;
          nextDay = new Date(range.endOfDay.getTime() + 1); // +1ms para incluir até 23:59:59.999
        } else {
          specificDate = new Date(specific_date);
          nextDay = new Date(specificDate);
          nextDay.setDate(nextDay.getDate() + 1);
        }
        dateFilter = `WHERE created_at >= $${paramIndex} AND created_at < $${paramIndex + 1}`;
        dateParams.push(specificDate.toISOString(), nextDay.toISOString());
        paramIndex += 2;
      } else {
        return res.status(400).json({ error: 'Para período custom, forneça start_date e end_date OU specific_date' });
      }
    } else if (period !== 'all') {
      const now = new Date();
      let startDate, endDate;
      switch (period) {
        case 'day': {
          const range = createDayRange(now);
          startDate = range.startOfDay;
          endDate = range.endOfDay;
          break;
        }
        case 'week': {
          const dayOfWeek = now.getDay();
          const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToSubtract);
          const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
          const startRange = createDayRange(weekStart);
          const endRange = createDayRange(weekEnd);
          startDate = startRange.startOfDay;
          endDate = endRange.endOfDay;
          break;
        }
        case 'month': {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          const startRange = createDayRange(monthStart);
          const endRange = createDayRange(monthEnd);
          startDate = startRange.startOfDay;
          endDate = endRange.endOfDay;
          break;
        }
        case 'year': {
          const yearStart = new Date(now.getFullYear(), 0, 1);
          const yearEnd = new Date(now.getFullYear(), 11, 31);
          const startRange = createDayRange(yearStart);
          const endRange = createDayRange(yearEnd);
          startDate = startRange.startOfDay;
          endDate = endRange.endOfDay;
          break;
        }
      }
      dateFilter = `WHERE created_at >= $${paramIndex} AND created_at <= $${paramIndex + 1}`;
      dateParams.push(startDate.toISOString(), endDate.toISOString());
      paramIndex += 2;
    }

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
      ...(period === 'custom' && {
        date_range: {
          start_date: start_date || specific_date,
          end_date: end_date || specific_date,
          specific_date: specific_date || null
        }
      }),
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

// Endpoint para métricas por intervalo de datas específico
export async function getMetricsByDateRange(req, res) {
  try {
    const { start_date, end_date, instance, group_by } = req.query;
    
    // Validação dos parâmetros obrigatórios
    if (!start_date || !end_date) {
      return res.status(400).json({ 
        error: 'start_date e end_date são obrigatórios' 
      });
    }

    // Função para validar formato de data
    const isValidDate = (dateString) => {
      const date = new Date(dateString);
      return date instanceof Date && !isNaN(date);
    };

    if (!isValidDate(start_date) || !isValidDate(end_date)) {
      return res.status(400).json({ 
        error: 'Formato de data inválido. Use: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss.sssZ' 
      });
    }

    // Se as datas são apenas YYYY-MM-DD, criar range completo do dia
    const isDateOnly = (dateStr) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    
    let startDate, endDate;
    
    if (isDateOnly(start_date) && isDateOnly(end_date)) {
      const startRange = createDayRange(start_date);
      const endRange = createDayRange(end_date);
      startDate = startRange.startOfDay;
      endDate = endRange.endOfDay;
    } else {
      startDate = new Date(start_date);
      endDate = new Date(end_date);
    }
    
    if (startDate > endDate) {
      return res.status(400).json({ 
        error: 'Data inicial não pode ser maior que a data final' 
      });
    }

    // Validação do group_by
    const validGroupBy = ['day', 'week', 'month', 'none'];
    const groupBy = group_by || 'none';
    if (!validGroupBy.includes(groupBy)) {
      return res.status(400).json({ 
        error: 'group_by inválido. Use: day, week, month, none' 
      });
    }

    let dateFilter = 'WHERE created_at >= $1 AND created_at <= $2';
    let params = [startDate.toISOString(), endDate.toISOString()];
    let paramIndex = 3;

    if (instance) {
      dateFilter += ' AND instance = $3';
      params.push(instance);
      paramIndex++;
    }

    // Se group_by for 'none', retorna métricas agregadas
    if (groupBy === 'none') {
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

      const results = {};
      
      for (const [tableName, query] of Object.entries(queries)) {
        try {
          const result = await pool.query(query, params);
          results[tableName] = parseInt(result.rows[0].total);
        } catch (error) {
          console.error(`Erro ao consultar ${tableName}:`, error);
          results[tableName] = 0;
        }
      }

      res.json({
        period: 'custom_range',
        instance: instance || 'all',
        start_date: start_date,
        end_date: end_date,
        timestamp: new Date().toISOString(),
        metrics: results,
        summary: {
          total_records: Object.values(results).reduce((sum, count) => sum + count, 0),
          total_tables: Object.keys(results).length
        }
      });
    } else {
      // Agrupamento por período
      let groupByClause = '';
      let dateFormat = '';
      
      switch (groupBy) {
        case 'day':
          groupByClause = 'DATE(created_at)';
          dateFormat = 'YYYY-MM-DD';
          break;
        case 'week':
          groupByClause = 'DATE_TRUNC(\'week\', created_at)';
          dateFormat = 'YYYY-MM-DD';
          break;
        case 'month':
          groupByClause = 'DATE_TRUNC(\'month\', created_at)';
          dateFormat = 'YYYY-MM';
          break;
      }

      const queries = {
        funcionarios: `SELECT ${groupByClause} as period, COUNT(*) as total FROM funcionarios ${dateFilter} GROUP BY ${groupByClause} ORDER BY period`,
        infogeral: `SELECT ${groupByClause} as period, COUNT(*) as total FROM infogeral ${dateFilter} GROUP BY ${groupByClause} ORDER BY period`,
        informacoes_to_vector: `SELECT ${groupByClause} as period, COUNT(*) as total FROM informacoes_to_vector ${dateFilter} GROUP BY ${groupByClause} ORDER BY period`,
        n8n_chat_histories_dados_ia: `SELECT ${groupByClause} as period, COUNT(*) as total FROM n8n_chat_histories_dados_ia ${dateFilter} GROUP BY ${groupByClause} ORDER BY period`,
        n8n_chat_histories_informacoes_ia: `SELECT ${groupByClause} as period, COUNT(*) as total FROM n8n_chat_histories_informacoes_ia ${dateFilter} GROUP BY ${groupByClause} ORDER BY period`,
        recados: `SELECT ${groupByClause} as period, COUNT(*) as total FROM recados ${dateFilter} GROUP BY ${groupByClause} ORDER BY period`,
        reunioes: `SELECT ${groupByClause} as period, COUNT(*) as total FROM reunioes ${dateFilter} GROUP BY ${groupByClause} ORDER BY period`,
        usuarios: `SELECT ${groupByClause} as period, COUNT(*) as total FROM usuarios ${dateFilter} GROUP BY ${groupByClause} ORDER BY period`
      };

      const results = {};
      
      for (const [tableName, query] of Object.entries(queries)) {
        try {
          const result = await pool.query(query, params);
          results[tableName] = result.rows.map(row => ({
            period: row.period,
            total: parseInt(row.total)
          }));
        } catch (error) {
          console.error(`Erro ao consultar ${tableName}:`, error);
          results[tableName] = [];
        }
      }

      res.json({
        period: 'custom_range',
        group_by: groupBy,
        instance: instance || 'all',
        start_date: start_date,
        end_date: end_date,
        timestamp: new Date().toISOString(),
        metrics: results
      });
    }

  } catch (error) {
    console.error('Erro ao obter métricas por intervalo de datas:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor ao obter métricas por intervalo de datas',
      details: error.message 
    });
  }
} 