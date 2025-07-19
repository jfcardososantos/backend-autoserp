import { Router } from 'express';
import { login, register, logout, validateToken } from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.post('/validate-token', validateToken);

export default router; 