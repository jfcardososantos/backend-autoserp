import { pool } from '../app.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET || 'WClPBG1pnUepCL&7_dQKx4zoPS?%@sd';

function gerarCodigo6Digitos() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function gerarCodigoSeguro(tamanho = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < tamanho; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function criptografarCodigo(code) {
  if (!jwtSecret) {
    throw new Error('JWT_SECRET não está definido no arquivo .env');
  }
  return jwt.sign({ code }, jwtSecret, { expiresIn: '10m' }); // 10 minutos de validade
}

export async function generateCode(req, res) {
  const { humannumber, webhook_url, email } = req.body;
  
  // Suporte para email (para compatibilidade com frontend)
  const identifier = humannumber || email;
  const url = webhook_url || process.env.WEBHOOK_URL;
  
  if (!identifier) {
    return res.status(400).json({ error: 'humannumber ou email obrigatório.' });
  }
  
  const code6 = gerarCodigo6Digitos();
  const codeJWT = criptografarCodigo(code6);
  
  try {
    // Atualiza tabela com o código de 6 dígitos criptografado
    const result = await pool.query(
      'UPDATE infogeral SET confirm_code = $1 WHERE humannumber = $2 OR email = $2 RETURNING id',
      [codeJWT, identifier]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Telefone/email não encontrado.' });
    }
    
    const prefeitura_id = result.rows[0].id;
    
    // Se não há webhook_url, retorna sucesso sem enviar
    if (!url) {
      return res.json({ 
        message: 'Código gerado com sucesso.', 
        prefeitura_id,
        code: code6 // Retorna o código para teste
      });
    }
    
    // Envia para webhook (envia o código de 6 dígitos)
    await axios.post(url, { prefeitura_id, humannumber: identifier, code: code6 });
    
    res.json({ 
      message: 'Código gerado e enviado.', 
      prefeitura_id
    });
  } catch (err) {
    console.error('Erro ao gerar/enviar código:', err);
    res.status(500).json({ error: 'Erro ao gerar/enviar código.' });
  }
}

export async function confirmCode(req, res) {
  const { humannumber, code } = req.body;
  if (!humannumber || !code) return res.status(400).json({ error: 'humannumber e code obrigatórios.' });
  
  try {
    // Busca o código criptografado atual
    const result = await pool.query('SELECT confirm_code, id FROM infogeral WHERE humannumber = $1', [humannumber]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prefeitura não encontrada.' });
    }
    
    const codeJWT = result.rows[0].confirm_code;
    
    // Decodifica o JWT para comparar o código
    try {
      const decoded = jwt.verify(codeJWT, jwtSecret);
      if (decoded.code !== code) {
        return res.status(400).json({ error: 'Código inválido.' });
      }
    } catch (jwtErr) {
      return res.status(400).json({ error: 'Código expirado ou inválido.' });
    }
    
    // Após confirmação, troca o código por um novo alfanumérico
    const novoCodigo = gerarCodigoSeguro(16);
    const novoCodeJWT = criptografarCodigo(novoCodigo);
    await pool.query('UPDATE infogeral SET confirm_code = $1 WHERE id = $2', [novoCodeJWT, result.rows[0].id]);
    
    res.json({ message: 'Código confirmado e invalidado.' });
  } catch (err) {
    console.error('Erro ao confirmar código:', err);
    res.status(500).json({ error: 'Erro ao confirmar código.' });
  }
} 