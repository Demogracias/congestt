import express from 'express';
import { RelatoriosService } from './relatorios.service';
import { asyncHandler } from '../../middleware/asyncHandler';

const router = express.Router();
const service = new RelatoriosService();

router.get('/maior-tempo', asyncHandler(async (req, res) => {
  res.json(await service.maiorTempoAtividade());
}));

router.get('/comparativo-porte', asyncHandler(async (req, res) => {
  res.json(await service.comparativoPorPorte());
}));

router.get('/comparativo-atividade', asyncHandler(async (req, res) => {
  res.json(await service.comparativoPorAtividade());
}));

router.get('/analise-colaborador', asyncHandler(async (req, res) => {
  res.json(await service.analisePorColaborador());
}));

router.get('/analise-equipe', asyncHandler(async (req, res) => {
  res.json(await service.analisePorEquipe());
}));

router.get('/analise-supervisao', asyncHandler(async (req, res) => {
  res.json(await service.analisePorSupervisao());
}));

export default router;
