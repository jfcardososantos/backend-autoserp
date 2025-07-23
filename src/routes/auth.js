import { Router } from 'express';
import { login, register, logout, validateToken, updateInfos } from '../controllers/authController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.post('/validate-token', validateToken);
router.post('/update-infos', authenticateJWT, updateInfos);

export default router; 