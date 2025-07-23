import jwt from 'jsonwebtoken';
import { pool } from '../app.js';
import { redisClient } from '../app.js';
import axios from 'axios';

const jwtSecret = process.env.JWT_SECRET || 'WClPBG1pnUepCL&7_dQKx4zoPS?%@sd';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '4h';

export async function register(req, res) {
  const { humannumber, municipio, instance, endereco, cnpj, email, horariofuncionamento, idcalendario, temporeuniao, orgao } = req.body;
  if (!humannumber) return res.status(400).json({ error: 'Telefone (humannumber) obrigatório.' });
  try {
    await pool.query(
      'INSERT INTO infogeral (humannumber, municipio, instance, endereco, cnpj, email, horariofuncionamento, idcalendario, temporeuniao, orgao) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (humannumber) DO NOTHING',
      [humannumber, municipio || null, instance || null, endereco || null, cnpj || null, email || null, horariofuncionamento || null, idcalendario || null, temporeuniao || null, orgao || null]
    );
    res.status(201).json({ message: 'Prefeitura registrada (ou já existente).' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar prefeitura.' });
  }
}

function gerarCodigoSeguro(tamanho = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < tamanho; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function login(req, res) {
  const { humannumber, code } = req.body;
  if (!humannumber || !code) return res.status(400).json({ error: 'Telefone (humannumber) e código obrigatórios.' });
  
  try {
    const result = await pool.query('SELECT * FROM infogeral WHERE humannumber = $1', [humannumber]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Telefone não encontrado.' });
    
    const prefeitura = result.rows[0];
    const codeJWT = prefeitura.confirm_code;
    let codeNoToken = null;
    // Decodifica o JWT para comparar o código
    try {
      const decoded = jwt.verify(codeJWT, jwtSecret);
      codeNoToken = decoded.code;
      console.log('Código esperado:', codeNoToken, 'Código recebido:', code);
      if (decoded.code !== code) {
        return res.status(401).json({ error: 'Código inválido.' });
      }
    } catch (jwtErr) {
      return res.status(401).json({ error: 'Código expirado ou inválido.' });
    }
    
    // Após login, troca o código por um novo alfanumérico (mas o token do usuário continua válido)
    const novoCodigo = gerarCodigoSeguro(16);
    const novoCodeJWT = jwt.sign({ code: novoCodigo }, jwtSecret, { expiresIn: '10m' });
    await pool.query('UPDATE infogeral SET confirm_code = $1 WHERE id = $2', [novoCodeJWT, prefeitura.id]);
    
    // Remove o confirm_code dos dados retornados
    const { confirm_code, ...prefeituraData } = prefeitura;
    
    // Gera JWT com todos os dados da prefeitura (sem o confirm_code), incluindo o código usado
    const token = jwt.sign({ ...prefeituraData, code: codeNoToken }, jwtSecret, { expiresIn: jwtExpiresIn });
    
    res.json({ 
      token,
      prefeitura: prefeituraData // Retorna todos os dados da prefeitura (sem o código)
    });
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    res.status(500).json({ error: 'Erro ao fazer login.' });
  }
}

export async function reauth(req, res) {
  const { humannumber, code } = req.body;
  if (!humannumber || !code) return res.status(400).json({ error: 'humannumber e code obrigatórios.' });
  
  try {
    const result = await pool.query('SELECT confirm_code FROM infogeral WHERE humannumber = $1', [humannumber]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Telefone não encontrado.' });
    
    const codeJWT = result.rows[0].confirm_code;
    
    // Decodifica o JWT para comparar o código
    try {
      const decoded = jwt.verify(codeJWT, jwtSecret);
      if (decoded.code !== code) {
        return res.status(401).json({ error: 'Código inválido.' });
      }
    } catch (jwtErr) {
      return res.status(401).json({ error: 'Código expirado ou inválido.' });
    }
    
    return res.json({ success: true });
  } catch (err) {
    console.error('Erro na reautenticação:', err);
    res.status(500).json({ error: 'Erro na reautenticação.' });
  }
} 

export async function logout(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(400).json({ error: 'Token não fornecido.' });
  const token = authHeader.split(' ')[1];
  // Expira junto com o JWT (exemplo: 1h)
  const exp = 14400; // 1 hora (ajuste conforme JWT_EXPIRES_IN)
  await redisClient.set(token, 'blacklisted', { EX: exp });
  res.json({ message: 'Token invalidado com sucesso.' });
}

export async function isTokenBlacklisted(token) {
  const result = await redisClient.get(token);
  return !!result;
} 

export async function me(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(' ')[1] : null;
  let decoded = null;
  let decodeError = null;
  if (token) {
    try {
      decoded = jwt.decode(token, { complete: true });
    } catch (err) {
      decodeError = err.message;
    }
  }
  res.json({
    token,
    user: req.user,
    decoded,
    decodeError
  });
} 

export async function decodeToken(req, res) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token não fornecido.' });
  try {
    const decoded = jwt.verify(token, jwtSecret);
    res.json({ valid: true, decoded });
  } catch (err) {
    res.status(400).json({ valid: false, error: 'Token inválido.', details: err.message });
  }
} 

export async function validateToken(req, res) {
  const { token } = req.body;
  console.log('Token recebido para validação:', token);
  if (!token) return res.status(400).json({ valid: false });
  try {
    const decoded = jwt.verify(token, jwtSecret);
    res.json({ valid: true, data: decoded });
  } catch (err) {
    console.log('Erro ao validar token:', err.message);
    res.json({ valid: false, error: err.message });
  }
}

// login já está correto: trocar o código de acesso não invalida o token gerado, pois o token é assinado com o código usado no login, não com o novo código. 

export async function updateInfos(req, res) {
  // Token já foi validado pelo middleware authenticateJWT
  // Todos os dados do usuário estão em req.user
  const { functioncode } = req.body;
  if (!functioncode) {
    return res.status(400).json({ error: 'functioncode obrigatório.' });
  }
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'WEBHOOK_URL não configurado no backend.' });
  }
  try {
    const payload = { ...req.user, functioncode };
    const response = await axios.post(webhookUrl, payload);
    return res.json({ success: true, webhookResponse: response.data });
  } catch (err) {
    console.error('Erro ao enviar para webhook:', err?.response?.data || err.message);
    return res.status(500).json({ error: 'Erro ao enviar para webhook.', details: err?.response?.data || err.message });
  }
} 