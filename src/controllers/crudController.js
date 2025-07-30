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
      'SELECT id, name, funcao, zona, instance FROM usuarios WHERE id = $1 AND instance = $2',
      [userId, instance]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado ou não pertence à instância especificada.' 
      });
    }

    // Verificar se o funcionário existe e pertence à instância especificada
    const employeeResult = await pool.query(
      `SELECT id, nome, cargo, instance, permiteagendamento, temporeuniao, permiterecado,
              seg_mat, seg_ves, ter_mat, ter_ves, qua_mat, qua_ves, 
              qui_mat, qui_ves, sex_mat, sex_ves, sab_mat, sab_ves, 
              dom_mat, dom_ves
       FROM funcionarios WHERE id = $1 AND instance = $2`,
      [employeeId, instance]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Funcionário não encontrado ou não pertence à instância especificada.' 
      });
    }

    // Se ambos existem e pertencem à mesma instância, retornar os dados (sem telefone)
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

export async function publicScheduleRead(req, res) {
  const { instance, funcionarioid } = req.body;
  
  if (!instance || !funcionarioid) {
    return res.status(400).json({ 
      error: 'instance e funcionarioid são obrigatórios.' 
    });
  }

  try {
    // Buscar apenas os horários das reuniões da instância e funcionário especificados
    const reunioesResult = await pool.query(
      'SELECT starttime, endtime FROM reunioes WHERE instance = $1 AND funcionarioid = $2 ORDER BY starttime ASC',
      [instance, funcionarioid]
    );

    return res.json({
      success: true,
      message: 'Horários de reuniões encontrados.',
      data: {
        instance: instance,
        funcionarioid: funcionarioid,
        horarios: reunioesResult.rows,
        total: reunioesResult.rows.length
      }
    });

  } catch (err) {
    console.error('Erro ao buscar horários de reuniões:', err);
    res.status(500).json({ 
      error: 'Erro interno do servidor.', 
      details: err.message 
    });
  }
}

export async function publicScheduleUpdate(req, res) {
  const { code, instance, funcionarioid, usuarioid, starttime, endtime, assunto } = req.body;
  
  if (!code || !instance || !funcionarioid) {
    return res.status(400).json({ 
      error: 'code, instance e funcionarioid são obrigatórios.' 
    });
  }

  try {
    // Verificar se o funcionário existe e pertence à instância especificada
    const employeeResult = await pool.query(
      'SELECT * FROM funcionarios WHERE id = $1 AND instance = $2',
      [funcionarioid, instance]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Funcionário não encontrado ou não pertence à instância especificada.' 
      });
    }

    // Verificar se existe uma reunião com o code especificado
    const existingReuniaoResult = await pool.query(
      'SELECT * FROM reunioes WHERE code = $1 AND instance = $2',
      [code, instance]
    );

    if (existingReuniaoResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Reunião com o código especificado não encontrada.' 
      });
    }

    // Atualizar a reunião existente
    const updateReuniaoResult = await pool.query(
      'UPDATE reunioes SET funcionarioid = $1, usuarioid = $2, starttime = $3, endtime = $4, assunto = $5 WHERE code = $6 AND instance = $7 RETURNING *',
      [funcionarioid, usuarioid || null, starttime, endtime || null, assunto || null, code, instance]
    );

    return res.json({
      success: true,
      message: 'Reunião atualizada com sucesso.',
      data: updateReuniaoResult.rows[0]
    });

  } catch (err) {
    console.error('Erro ao atualizar reunião:', err);
    res.status(500).json({ 
      error: 'Erro interno do servidor.', 
      details: err.message 
    });
  }
} 

export async function publicScheduleDelete(req, res) {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ 
      error: 'code é obrigatório.' 
    });
  }

  try {
    // Verificar se existe uma reunião com o code especificado
    const existingReuniaoResult = await pool.query(
      'SELECT * FROM reunioes WHERE code = $1',
      [code]
    );

    if (existingReuniaoResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Reunião com o código especificado não encontrada.' 
      });
    }

    // Deletar a reunião
    const deleteReuniaoResult = await pool.query(
      'DELETE FROM reunioes WHERE code = $1 RETURNING *',
      [code]
    );

    return res.json({
      success: true,
      message: `Reunião ${code} deletada com sucesso.`,
    });

  } catch (err) {
    console.error('Erro ao deletar reunião:', err);
    res.status(500).json({ 
      error: 'Erro interno do servidor.', 
      details: err.message 
    });
  }
} 