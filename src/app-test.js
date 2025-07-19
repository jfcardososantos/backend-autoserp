import express from 'express';
import dotenv from 'dotenv';

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

// Rota de teste simples
app.get('/', (req, res) => {
  res.send('autoSERP API TEST - SEM BANCO');
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

// Rota POST simples para /code/generate
app.post('/code/generate', (req, res) => {
  console.log('POST /code/generate recebido:', req.body);
  res.json({ 
    message: 'Código gerado com sucesso! (TESTE)', 
    data: req.body,
    timestamp: new Date().toISOString()
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
  console.log(`Servidor TESTE rodando na porta ${PORT} - SEM BANCO DE DADOS`);
}); 