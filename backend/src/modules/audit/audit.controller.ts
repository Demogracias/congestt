import express from 'express';
import { auditService } from './audit.service';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { recurso, acao, limite } = req.query as any;
    const logs = await auditService.listar({ recurso, acao, limite: limite ? parseInt(limite) : undefined });
    res.json(logs);
  } catch (error: any) {
    console.error('[Audit] GET /', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/usuario/:usuarioId', async (req, res) => {
  try {
    const logs = await auditService.listarPorUsuario(req.params.usuarioId);
    res.json(logs);
  } catch (error: any) {
    console.error('[Audit] GET /usuario/:usuarioId', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;
