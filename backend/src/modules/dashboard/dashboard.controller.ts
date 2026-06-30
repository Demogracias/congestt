import express from 'express';
import { DashboardService } from './dashboard.service';
import { asyncHandler } from '../../middleware/asyncHandler';

const router = express.Router();
const service = new DashboardService();

router.get('/cards-por-equipe', asyncHandler(async (req, res) => {
  const data = await service.getCardsPorEquipe();
  res.json(data);
}));

router.get('/grade-empresas', asyncHandler(async (req, res) => {
  const { ano, equipe } = req.query as any;
  const data = await service.getGradeEmpresas(parseInt(ano) || new Date().getFullYear(), equipe);
  res.json(data);
}));

router.get('/performance-por-porte', asyncHandler(async (req, res) => {
  const data = await service.getPerformancePorPorte();
  res.json(data);
}));

router.get('/concluidas-mes', asyncHandler(async (req, res) => {
  const data = await service.getConcluidasMes();
  res.json(data);
}));

router.get('/equipe-do-mes', asyncHandler(async (req, res) => {
  const equipe = await service.getEquipeDoMes();
  res.json(equipe);
}));

export default router;
