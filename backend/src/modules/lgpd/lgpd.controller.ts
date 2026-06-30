import express from 'express';
import { LgpdService } from './lgpd.service';
import { AuthRequest } from '../../middleware/authMiddleware';
import { asyncHandler } from '../../middleware/asyncHandler';
import { ValidationError } from '../../utils/errors';

const router = express.Router();
const service = new LgpdService();

router.get('/consentimentos', asyncHandler(async (req, res) => {
  const { usuarioId } = req.query as any;
  const result = await service.listarConsentimentos(usuarioId);
  res.json(result);
}));

router.post('/consentimentos', asyncHandler(async (req, res) => {
  const { usuarioId, tipo, aceito, ip } = req.body;
  const tiposValidos = ['termos_uso', 'dados_pessoais', 'comunicacao'];
  if (!usuarioId || !tipo || aceito === undefined) throw new ValidationError('usuarioId, tipo e aceito são obrigatórios');
  if (!tiposValidos.includes(tipo)) throw new ValidationError('tipo inválido');
  const result = await service.registrarConsentimento(usuarioId, tipo, aceito, ip);
  res.status(201).json(result);
}));

router.post('/anonimizacao', asyncHandler(async (req: AuthRequest, res) => {
  const { usuarioId } = req.body;
  if (!usuarioId) throw new ValidationError('usuarioId é obrigatório');
  const result = await service.solicitarAnonimizacao(usuarioId, req.usuario?.id || '', req.usuario?.level || 0);
  res.status(201).json(result);
}));

router.post('/anonimizacao/:id/processar', asyncHandler(async (req, res) => {
  const result = await service.processarAnonimizacao(req.params.id);
  res.json(result);
}));

router.get('/anonimizacao', asyncHandler(async (req, res) => {
  const result = await service.listarSolicitacoesAnonimizacao();
  res.json(result);
}));

export default router;
