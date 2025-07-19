import { Router } from 'express';
import { crudHandler } from '../controllers/crudController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authenticateJWT, crudHandler);

export default router; 