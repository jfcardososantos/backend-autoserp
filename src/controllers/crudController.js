import { pool } from '../app.js';

// Todas as rotas já são protegidas por authenticateJWT

export async function crudHandler(req, res) {
  const { table, action, filters, data } = req.body;
  if (!table || !action) return res.status(400).json({ error: 'Informe a tabela e a ação.' });
  try {
    let result;
    switch (action) {
      case 'create': {
        if (!data) return res.status(400).json({ error: 'Dados obrigatórios para criar.' });
        const cols = Object.keys(data).join(', ');
        const vals = Object.values(data);
        const params = vals.map((_, i) => `$${i + 1}`).join(', ');
        result = await pool.query(`INSERT INTO ${table} (${cols}) VALUES (${params}) RETURNING *`, vals);
        return res.json(result.rows[0]);
      }
      case 'read': {
        let where = '';
        let values = [];
        if (filters && Object.keys(filters).length) {
          const conds = Object.keys(filters).map((k, i) => `${k} = $${i + 1}`);
          where = 'WHERE ' + conds.join(' AND ');
          values = Object.values(filters);
        }
        result = await pool.query(`SELECT * FROM ${table} ${where}`, values);
        return res.json(result.rows);
      }
      case 'update': {
        if (!filters || !data) return res.status(400).json({ error: 'Filtros e dados obrigatórios para update.' });
        const set = Object.keys(data).map((k, i) => `${k} = $${i + 1}`).join(', ');
        const setVals = Object.values(data);
        const filterConds = Object.keys(filters).map((k, i) => `${k} = $${i + 1 + setVals.length}`);
        const filterVals = Object.values(filters);
        result = await pool.query(`UPDATE ${table} SET ${set} WHERE ${filterConds.join(' AND ')} RETURNING *`, [...setVals, ...filterVals]);
        return res.json(result.rows);
      }
      case 'delete': {
        if (!filters) return res.status(400).json({ error: 'Filtros obrigatórios para delete.' });
        const delConds = Object.keys(filters).map((k, i) => `${k} = $${i + 1}`);
        const delVals = Object.values(filters);
        result = await pool.query(`DELETE FROM ${table} WHERE ${delConds.join(' AND ')} RETURNING *`, delVals);
        return res.json(result.rows);
      }
      default:
        return res.status(400).json({ error: 'Ação inválida.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro no CRUD.', details: err.message });
  }
}

export async function publicUpdateHandler(req, res) {
  const { table, filters, data } = req.body;
  if (!table || !filters || !data) {
    return res.status(400).json({ error: 'table, filters e data obrigatórios.' });
  }
  try {
    const set = Object.keys(data).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const setVals = Object.values(data);
    const filterConds = Object.keys(filters).map((k, i) => `${k} = $${i + 1 + setVals.length}`);
    const filterVals = Object.values(filters);
    const result = await pool.query(`UPDATE ${table} SET ${set} WHERE ${filterConds.join(' AND ')} RETURNING *`, [...setVals, ...filterVals]);
    return res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro no update público.', details: err.message });
  }
}

export async function verifyEmployeeUserInstance(req, res) {
  const { userId, employeeId, instance } = req.body;
  
  if (!userId || !employeeId || !instance) {
    return res.status(400).json({ 
      error: 'userId, employeeId e instance são obrigatórios.' 
    });
  }

  try {
    // Verificar se o usuário existe e pertence à instância especificada
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND instance = $2',
      [userId, instance]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado ou não pertence à instância especificada.' 
      });
    }

    // Verificar se o funcionário existe e pertence à instância especificada
    const employeeResult = await pool.query(
      'SELECT * FROM employees WHERE id = $1 AND instance = $2',
      [employeeId, instance]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Funcionário não encontrado ou não pertence à instância especificada.' 
      });
    }

    // Se ambos existem e pertencem à mesma instância, retornar os dados
    return res.json({
      success: true,
      message: 'Usuário e funcionário pertencem à mesma instância.',
      data: {
        user: userResult.rows[0],
        employee: employeeResult.rows[0],
        instance: instance
      }
    });

  } catch (err) {
    console.error('Erro ao verificar instância:', err);
    res.status(500).json({ 
      error: 'Erro interno do servidor.', 
      details: err.message 
    });
  }
} 