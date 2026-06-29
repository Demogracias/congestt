import express from 'express';
import { auditService } from './audit.service';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { recurso, acao, limite } = req.query as any;
    const logs = await auditService.listar({ recurso, acao, limite: limite ? parseInt(limite) : undefined });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/usuario/:usuarioId', async (req, res) => {
  try {
    const logs = await auditService.listarPorUsuario(req.params.usuarioId);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
