import { Router } from 'express';
import { generateCode, confirmCode, getRecadoByInstanceAndMessageId, answer } from '../controllers/codeController.js';
// import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/generate', generateCode);
router.post('/confirm', confirmCode);
router.post('/get-recado', getRecadoByInstanceAndMessageId);
router.post('/answer', answer);


export default router; 