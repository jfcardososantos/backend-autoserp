import express from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import authRoutes from './routes/auth.js';
import crudRoutes from './routes/crud.js';
import codeRoutes from './routes/code.js';
import cors from 'cors';
import { createClient } from 'redis';

// Carrega variáveis de ambiente
dotenv.config();

const app = express();
app.use(express.json());


app.use(cors());

// Conexão com o banco
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Conexão com o Redis (usando db1, timeout aumentado e logs de reconexão)
export const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: { connectTimeout: 20000 } // 20 segundos
});
redisClient.on('error', (err) => {
  console.error('Erro de conexão com Redis:', err);
});
redisClient.on('reconnecting', () => {
  console.warn('Tentando reconectar ao Redis...');
});
redisClient.on('connect', () => {
  console.log('Reconectado ao Redis!');
});
redisClient.connect().then(async () => {
  await redisClient.select(1); // Seleciona o banco 1
  console.log('Conectado ao Redis no banco db1!');
}).catch((err) => {
  console.error('Erro ao conectar no Redis:', err);
});

// Teste de conexão com o banco
const dbUrl = process.env.DATABASE_URL;
let dbInfo = dbUrl;
try {
  // Tenta extrair host, porta e database da URL
  const match = dbUrl.match(/postgres:\/\/.*:(.*)@(.*):(\d+)\/(.*)\?/);
  if (match) {
    const [, , host, port, database] = match;
    dbInfo = `host: ${host}, porta: ${port}, banco: ${database}`;
  }
} catch {}
pool.query('SELECT 1', (err) => {
  if (err) {
    console.error('Erro ao conectar no banco de dados PostgreSQL:', err.message, '\nString de conexão:', dbUrl);
  } else {
    console.log('Conexão com o banco de dados PostgreSQL bem-sucedida!');
    console.log('Conectado em:', dbInfo);
  }
});

// Rotas
app.use('/auth', authRoutes);
app.use('/crud', crudRoutes);
app.use('/code', codeRoutes);

app.get('/', (req, res) => {
  res.send('autoSERP API started');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 