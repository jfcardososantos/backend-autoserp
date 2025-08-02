import { Router } from 'express';
import { getMetrics, getRealTimeMetrics } from '../controllers/metricsController.js';

const router = Router();

// Rota principal para métricas com filtros de período
router.get('/', getMetrics);

// Rota para métricas em tempo real (últimas 24h)
router.get('/realtime', getRealTimeMetrics);

export default router; 