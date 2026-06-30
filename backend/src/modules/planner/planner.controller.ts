import express from 'express';
import { PlannerService } from './planner.service';
import { auditService } from '../audit/audit.service';
import { AuthRequest } from '../../middleware/authMiddleware';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validateBody, validateQuery } from '../../middleware/validate';
import { criarTarefaSchema, listarTarefasSchema, pausarTarefaSchema, iniciarTarefaSchema } from './planner.schema';
import { DashboardService } from '../dashboard/dashboard.service';
import { broadcast } from '../../utils/websocket';
import logger from '../../utils/logger';

const router = express.Router();
const service = new PlannerService();
const dashboardService = new DashboardService();

router.get('/', validateQuery(listarTarefasSchema), asyncHandler(async (req, res) => {
  const q = (req as any).validatedQuery || req.query;
  if (q.page || q.pageSize) {
    const result = await service.listarPaginado(q);
    res.json(result);
  } else {
    const result = await service.listar(q);
    res.json(result);
  }
}));

router.get('/alertas', asyncHandler(async (req, res) => {
  const alertas = await service.verificarAlertas();
  res.json(alertas);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const atv = await service.buscarPorId(req.params.id);
  res.json(atv);
}));

router.post('/', validateBody(criarTarefaSchema), asyncHandler(async (req: AuthRequest, res) => {
  const atv = await service.criar(req.body);
  dashboardService.clearCache();
  broadcast('tarefa:criada', { id: atv.id, titulo: atv.titulo });
  auditService.registrar({ usuarioId: req.usuario?.id || 'unknown', acao: 'criar', recurso: 'planner', recursoId: atv.id, detalhes: `Nova tarefa: ${atv.titulo}` }).catch(e => logger.error({ err: e }, 'audit'));
  res.status(201).json(atv);
}));

router.put('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const atv = await service.atualizar(req.params.id, req.body);
  dashboardService.clearCache();
  res.json(atv);
}));

router.post('/:id/start', validateBody(iniciarTarefaSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { usuarioId } = req.body;
  const atv = await service.iniciarTimer(req.params.id, usuarioId);
  dashboardService.clearCache();
  auditService.registrar({ usuarioId: req.usuario?.id || 'unknown', acao: 'iniciar_timer', recurso: 'planner', recursoId: req.params.id, detalhes: `Timer iniciado: ${atv?.titulo}` }).catch(e => logger.error({ err: e }, 'audit'));
  res.json(atv);
}));

router.post('/:id/pause', validateBody(pausarTarefaSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { justificativa, tipo } = req.body;
  const atv = await service.pausarTimer(req.params.id, justificativa, tipo || 'pausa');
  dashboardService.clearCache();
  auditService.registrar({ usuarioId: req.usuario?.id || 'unknown', acao: 'pausar_timer', recurso: 'planner', recursoId: req.params.id, detalhes: justificativa || 'Pausa' }).catch(e => logger.error({ err: e }, 'audit'));
  res.json(atv);
}));

router.post('/:id/resume', asyncHandler(async (req, res) => {
  const { tipo } = req.body;
  const atv = await service.retomarTimer(req.params.id, tipo || 'normal');
  dashboardService.clearCache();
  res.json(atv);
}));

router.post('/:id/complete', asyncHandler(async (req: AuthRequest, res) => {
  const atv = await service.concluir(req.params.id);
  dashboardService.clearCache();
  broadcast('tarefa:concluida', { id: atv?.id, titulo: atv?.titulo, onTime: atv?.onTime });
  auditService.registrar({ usuarioId: req.usuario?.id || 'unknown', acao: 'concluir', recurso: 'planner', recursoId: req.params.id, detalhes: `Concluída: ${atv?.titulo}` }).catch(e => logger.error({ err: e }, 'audit'));
  res.json(atv);
}));

router.post('/:id/extend', asyncHandler(async (req, res) => {
  const { dias, justificativa } = req.body;
  const atv = await service.estenderPrazo(req.params.id, dias, justificativa);
  res.json(atv);
}));

router.post('/:id/observacoes', asyncHandler(async (req, res) => {
  const { texto, autor } = req.body;
  const bloco = await service.adicionarObservacao(req.params.id, texto, autor);
  res.status(201).json(bloco);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await service.remover(req.params.id);
  dashboardService.clearCache();
  res.status(204).send();
}));

router.post('/batch/complete', asyncHandler(async (req: AuthRequest, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'Informe um array de ids' });
  const results = [];
  for (const id of ids) {
    try {
      const atv = await service.concluir(id);
      results.push({ id, success: true, titulo: atv?.titulo });
      broadcast('tarefa:concluida', { id, titulo: atv?.titulo, onTime: atv?.onTime });
    } catch (e: any) {
      results.push({ id, success: false, error: e.message });
    }
  }
  dashboardService.clearCache();
  res.json({ concluidas: results.filter(r => r.success).length, falhas: results.filter(r => !r.success).length, results });
}));

router.post('/batch/delete', asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'Informe um array de ids' });
  const results = [];
  for (const id of ids) {
    try {
      await service.remover(id);
      results.push({ id, success: true });
    } catch (e: any) {
      results.push({ id, success: false, error: e.message });
    }
  }
  dashboardService.clearCache();
  res.json({ removidas: results.filter(r => r.success).length, falhas: results.filter(r => !r.success).length, results });
}));

export default router;
