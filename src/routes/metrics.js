import { Router } from 'express';
import { getMetrics, getRealTimeMetrics, getMetricsByDateRange } from '../controllers/metricsController.js';

const router = Router();

// Rota principal para métricas com filtros de período
router.get('/', getMetrics);

// Rota para métricas em tempo real (últimas 24h)
router.get('/realtime', getRealTimeMetrics);

// Rota para métricas por intervalo de datas específico
router.get('/range', getMetricsByDateRange);

export default router; 