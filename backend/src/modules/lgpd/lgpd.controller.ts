import express from 'express';
import { LgpdService } from './lgpd.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const router = express.Router();
const service = new LgpdService();

router.get('/consentimentos', async (req, res) => {
  try {
    const { usuarioId } = req.query as any;
    const result = await service.listarConsentimentos(usuarioId);
    res.json(result);
  } catch (error: any) {
    console.error('[LGPD] GET /consentimentos', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/consentimentos', async (req, res) => {
  try {
    const { usuarioId, tipo, aceito, ip } = req.body;
    if (!usuarioId || !tipo || aceito === undefined) return res.status(400).json({ message: 'usuarioId, tipo e aceito são obrigatórios' });
    if (!['termos_uso', 'dados_pessoais', 'comunicacao'].includes(tipo)) return res.status(400).json({ message: 'tipo inválido' });
    const result = await service.registrarConsentimento(usuarioId, tipo, aceito, ip);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/anonimizacao', async (req: AuthRequest, res) => {
  try {
    const { usuarioId } = req.body;
    if (!usuarioId) return res.status(400).json({ message: 'usuarioId é obrigatório' });
    const result = await service.solicitarAnonimizacao(usuarioId, req.usuario?.id || '', req.usuario?.level || 0);
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
    console.error('[LGPD] GET /anonimizacao', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;
