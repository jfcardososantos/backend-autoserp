import { Router } from 'express';
import { generateCode, confirmCode } from '../controllers/codeController.js';
// import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = Router();

// Middleware CORS específico para rotas de código
router.use((req, res, next) => {
  console.log(`CORS para rota /code: ${req.method} ${req.path}`);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight para /code');
    return res.status(200).end();
  }
  next();
});

router.post('/generate', generateCode);
router.post('/confirm', confirmCode);

export default router; 