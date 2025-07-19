import { Router } from 'express';
import { generateCode, confirmCode } from '../controllers/codeController.js';
// import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/generate', generateCode);
router.post('/confirm', confirmCode);

export default router; 