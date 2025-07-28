import { Router } from 'express';
import { crudHandler, publicUpdateHandler, verifyEmployeeUserInstance, publicScheduleRead, publicScheduleUpdate } from '../controllers/crudController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authenticateJWT, crudHandler);
router.post('/public-update', publicUpdateHandler);
router.post('/verify-instance', verifyEmployeeUserInstance);
router.post('/schedule-read', publicScheduleRead);
router.post('/schedule-update', publicScheduleUpdate);

export default router; 