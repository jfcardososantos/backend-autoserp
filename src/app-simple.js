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
  res.send('autoSERP API started - SIMPLE VERSION');
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

// Rota POST simples
app.post('/code/generate', (req, res) => {
  console.log('POST /code/generate recebido:', req.body);
  res.json({ 
    message: 'Código gerado com sucesso!', 
    data: req.body 
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor SIMPLES rodando na porta ${PORT}`);
}); 