import express from 'express';
import { auditService } from './audit.service';
import { asyncHandler } from '../../middleware/asyncHandler';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const { recurso, acao, limite } = req.query as any;
  const logs = await auditService.listar({ recurso, acao, limite: limite ? parseInt(limite) : undefined });
  res.json(logs);
}));

router.get('/usuario/:usuarioId', asyncHandler(async (req, res) => {
  const logs = await auditService.listarPorUsuario(req.params.usuarioId);
  res.json(logs);
}));

export default router;
