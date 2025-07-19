import jwt from 'jsonwebtoken';
import { isTokenBlacklisted } from '../controllers/authController.js';

export async function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.error('Token não fornecido no header Authorization');
    return res.status(401).json({ error: 'Token não fornecido.' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    console.error('Token não encontrado após Bearer');
    return res.status(401).json({ error: 'Token não fornecido.' });
  }
  if (await isTokenBlacklisted(token)) {
    console.error('Token está na blacklist (logout)');
    return res.status(401).json({ error: 'Token inválido (logout).' });
  }
  jwt.verify(token, process.env.JWT_SECRET || 'WClPBG1pnUepCL&7_dQKx4zoPS?%@sd', (err, user) => {
    if (err) {
      console.error('Erro ao verificar token:', err);
      return res.status(403).json({ error: 'Token inválido.' });
    }
    req.user = user;
    next();
  });
} 