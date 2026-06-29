import express from 'express';
import { RelatoriosService } from './relatorios.service';

const router = express.Router();
const service = new RelatoriosService();

router.get('/maior-tempo', async (req, res) => {
  try { res.json(await service.maiorTempoAtividade()); }
  catch (e: any) { console.error('[Relatorios] maior-tempo', e); res.status(500).json({ message: 'Erro interno do servidor' }); }
});

router.get('/comparativo-porte', async (req, res) => {
  try { res.json(await service.comparativoPorPorte()); }
  catch (e: any) { console.error('[Relatorios] comparativo-porte', e); res.status(500).json({ message: 'Erro interno do servidor' }); }
});

router.get('/comparativo-atividade', async (req, res) => {
  try { res.json(await service.comparativoPorAtividade()); }
  catch (e: any) { console.error('[Relatorios] comparativo-atividade', e); res.status(500).json({ message: 'Erro interno do servidor' }); }
});

router.get('/analise-colaborador', async (req, res) => {
  try { res.json(await service.analisePorColaborador()); }
  catch (e: any) { console.error('[Relatorios] analise-colaborador', e); res.status(500).json({ message: 'Erro interno do servidor' }); }
});

router.get('/analise-equipe', async (req, res) => {
  try { res.json(await service.analisePorEquipe()); }
  catch (e: any) { console.error('[Relatorios] analise-equipe', e); res.status(500).json({ message: 'Erro interno do servidor' }); }
});

router.get('/analise-supervisao', async (req, res) => {
  try { res.json(await service.analisePorSupervisao()); }
  catch (e: any) { console.error('[Relatorios] analise-supervisao', e); res.status(500).json({ message: 'Erro interno do servidor' }); }
});

export default router;
