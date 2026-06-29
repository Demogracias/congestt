import express from 'express';
import { PlannerService } from './planner.service';
import { auditService } from '../audit/audit.service';

const router = express.Router();
const service = new PlannerService();

router.get('/', async (req, res) => {
  try {
    const { empresaId, equipe, mes, status, responsavel } = req.query as any;
    const result = await service.listar({ empresaId, equipe, mes, status, responsavel });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/alertas', async (req, res) => {
  try {
    const alertas = await service.verificarAlertas();
    res.json(alertas);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const atv = await service.buscarPorId(req.params.id);
    if (!atv) return res.status(404).json({ message: 'Atividade não encontrada' });
    res.json(atv);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req: any, res) => {
  try {
    const atv = await service.criar(req.body);
    auditService.registrar({ usuarioId: req.usuario?.id || 'unknown', acao: 'criar', recurso: 'planner', recursoId: atv.id, detalhes: `Nova tarefa: ${atv.titulo}` }).catch(() => {});
    res.status(201).json(atv);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req: any, res) => {
  try {
    const atv = await service.atualizar(req.params.id, req.body);
    res.json(atv);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/start', async (req: any, res) => {
  try {
    const { usuarioId } = req.body;
    const atv = await service.iniciarTimer(req.params.id, usuarioId);
    auditService.registrar({ usuarioId: req.usuario?.id || 'unknown', acao: 'iniciar_timer', recurso: 'planner', recursoId: req.params.id, detalhes: `Timer iniciado: ${atv?.titulo}` }).catch(() => {});
    res.json(atv);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/pause', async (req: any, res) => {
  try {
    const { justificativa, tipo, tarefaVinculadaId } = req.body;
    const atv = await service.pausarTimer(req.params.id, justificativa, tipo || 'pausa', tarefaVinculadaId);
    auditService.registrar({ usuarioId: req.usuario?.id || 'unknown', acao: 'pausar_timer', recurso: 'planner', recursoId: req.params.id, detalhes: justificativa || 'Pausa' }).catch(() => {});
    res.json(atv);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/resume', async (req, res) => {
  try {
    const { tipo } = req.body;
    const atv = await service.retomarTimer(req.params.id, tipo || 'normal');
    res.json(atv);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/complete', async (req: any, res) => {
  try {
    const atv = await service.concluir(req.params.id);
    auditService.registrar({ usuarioId: req.usuario?.id || 'unknown', acao: 'concluir', recurso: 'planner', recursoId: req.params.id, detalhes: `Concluída: ${atv?.titulo}` }).catch(() => {});
    res.json(atv);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/extend', async (req, res) => {
  try {
    const { dias, justificativa } = req.body;
    const atv = await service.estenderPrazo(req.params.id, dias, justificativa);
    res.json(atv);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/observacoes', async (req, res) => {
  try {
    const { texto, autor } = req.body;
    const bloco = await service.adicionarObservacao(req.params.id, texto, autor);
    res.status(201).json(bloco);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await service.remover(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
});

export default router;
