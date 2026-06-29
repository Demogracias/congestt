import express from 'express';
import { DashboardService } from './dashboard.service';

const router = express.Router();
const service = new DashboardService();

router.get('/cards-por-equipe', async (req, res) => {
  try {
    const data = await service.getCardsPorEquipe();
    res.json(data);
  } catch (error: any) {
    console.error('[Dashboard] cards-por-equipe', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/grade-empresas', async (req, res) => {
  try {
    const { ano, equipe } = req.query as any;
    const data = await service.getGradeEmpresas(parseInt(ano) || new Date().getFullYear(), equipe);
    res.json(data);
  } catch (error: any) {
    console.error('[Dashboard] grade-empresas', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/performance-por-porte', async (req, res) => {
  try {
    const data = await service.getPerformancePorPorte();
    res.json(data);
  } catch (error: any) {
    console.error('[Dashboard] performance-por-porte', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/concluidas-mes', async (req, res) => {
  try {
    const data = await service.getConcluidasMes();
    res.json(data);
  } catch (error: any) {
    console.error('[Dashboard] concluidas-mes', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/equipe-do-mes', async (req, res) => {
  try {
    const equipe = await service.getEquipeDoMes();
    res.json(equipe);
  } catch (error: any) {
    console.error('[Dashboard] equipe-do-mes', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;
