import express from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import authRoutes from './routes/auth.js';
import crudRoutes from './routes/crud.js';
import codeRoutes from './routes/code.js';
import metricsRoutes from './routes/metrics.js';
import cors from 'cors';
import { createClient } from 'redis';

// Carrega variáveis de ambiente
dotenv.config();

const app = express();

// CORS - PRIMEIRO MIDDLEWARE (ANTES DE TUDO)
app.use((req, res, next) => {
  // Log para debug
  console.log(`[CORS] ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  
  
  // Headers CORS obrigatórios
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  // Responder imediatamente para requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Preflight OPTIONS respondido');
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());

// Conexão com o banco - com tratamento de erro
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  console.log('Pool PostgreSQL criado com sucesso');
} catch (error) {
  console.error('Erro ao criar pool PostgreSQL:', error);
  pool = null;
}

// Conexão com o Redis - com tratamento de erro
let redisClient;
try {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: { connectTimeout: 20000 }
  });
  
  redisClient.on('error', (err) => {
    console.error('Erro de conexão com Redis:', err);
  });
  redisClient.on('reconnecting', () => {
    console.warn('Tentando reconectar ao Redis...');
  });
  redisClient.on('connect', () => {
    console.log('Conectado ao Redis!');
  });
  
  // Conectar Redis de forma assíncrona
  redisClient.connect().then(async () => {
    try {
      await redisClient.select(1);
      console.log('Conectado ao Redis no banco db1!');
    } catch (err) {
      console.error('Erro ao selecionar banco Redis:', err);
    }
  }).catch((err) => {
    console.error('Erro ao conectar no Redis:', err);
  });
  
  console.log('Cliente Redis criado com sucesso');
} catch (error) {
  console.error('Erro ao criar cliente Redis:', error);
  redisClient = null;
}

// Teste de conexão com o banco - de forma assíncrona
if (pool) {
  const dbUrl = process.env.DATABASE_URL;
  let dbInfo = dbUrl;
  try {
    const match = dbUrl.match(/postgres:\/\/.*:(.*)@(.*):(\d+)\/(.*)\?/);
    if (match) {
      const [, , host, port, database] = match;
      dbInfo = `host: ${host}, porta: ${port}, banco: ${database}`;
    }
  } catch {}
  
  pool.query('SELECT 1', (err) => {
    if (err) {
      console.error('Erro ao conectar no banco de dados PostgreSQL:', err.message);
    } else {
      console.log('Conexão com o banco de dados PostgreSQL bem-sucedida!');
      console.log('Conectado em:', dbInfo);
    }
  });
}

// Exportar as conexões
export { pool, redisClient };

// Rotas
app.use('/auth', authRoutes);
app.use('/crud', crudRoutes);
app.use('/code', codeRoutes);
app.use('/metrics', metricsRoutes);

app.get('/', (req, res) => {
  res.send('autoSERP API started');
});

// Rota de teste CORS
app.get('/test-cors', (req, res) => {
  console.log('Teste CORS acessado');
  res.json({ 
    message: 'CORS funcionando!', 
    timestamp: new Date().toISOString(),
    origin: req.headers.origin 
  });
});

// Rota OPTIONS global para garantir preflight
app.options('*', (req, res) => {
  console.log('OPTIONS global capturado');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro capturado pelo middleware global:', err);
  console.error('Stack trace:', err.stack);
  
  // Garantir que os headers CORS sejam enviados mesmo em caso de erro
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  console.log(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
  
  // Garantir que os headers CORS sejam enviados
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 