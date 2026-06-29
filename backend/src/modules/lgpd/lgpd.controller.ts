import express from 'express';
import { LgpdService } from './lgpd.service';

const router = express.Router();
const service = new LgpdService();

router.get('/consentimentos', async (req, res) => {
  try {
    const { usuarioId } = req.query as any;
    const result = await service.listarConsentimentos(usuarioId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/consentimentos', async (req, res) => {
  try {
    const { usuarioId, tipo, aceito, ip } = req.body;
    const result = await service.registrarConsentimento(usuarioId, tipo, aceito, ip);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/anonimizacao', async (req, res) => {
  try {
    const { usuarioId } = req.body;
    const result = await service.solicitarAnonimizacao(usuarioId);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/anonimizacao/:id/processar', async (req, res) => {
  try {
    const result = await service.processarAnonimizacao(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/anonimizacao', async (req, res) => {
  try {
    const result = await service.listarSolicitacoesAnonimizacao();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
