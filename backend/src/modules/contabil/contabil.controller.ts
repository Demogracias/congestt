import express from 'express';
import { ContasService } from './contas.service';
import { FechamentoService } from './fechamento.service';
import { PlannerService } from '../planner/planner.service';
import { AuthService } from '../auth/auth.service';

const router = express.Router();
const contasService = new ContasService();
const fechamentoService = new FechamentoService();
const plannerService = new PlannerService();
const authService = new AuthService();

// Contas Contábeis
router.get('/contas', async (req, res) => {
  try {
    const { empresaId } = req.query as any;
    const result = await contasService.listar(empresaId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/contas/:id', async (req, res) => {
  try {
    const conta = await contasService.buscarPorId(req.params.id);
    if (!conta) return res.status(404).json({ message: 'Conta não encontrada' });
    res.json(conta);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/contas', async (req, res) => {
  try {
    const conta = await contasService.criar(req.body);
    res.status(201).json(conta);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/contas/importar', async (req, res) => {
  try {
    const { empresaId, contas } = req.body;
    if (!empresaId || !contas || !Array.isArray(contas)) {
      return res.status(400).json({ message: 'Informe empresaId e array contas' });
    }
    const result = await contasService.importarPlanilha(empresaId, contas);
    res.status(201).json({ importadas: result.length, contas: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/contas/:id', async (req, res) => {
  try {
    const conta = await contasService.desativar(req.params.id);
    res.json(conta);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Grade por empresa/período
router.get('/grade', async (req, res) => {
  try {
    const { empresaId, ano } = req.query as any;
    if (!empresaId) return res.status(400).json({ message: 'empresaId é obrigatório' });
    const contas = await contasService.buscarPorEmpresa(empresaId);
    const atividades = await plannerService.listar({ empresaId });
    const year = parseInt(ano) || new Date().getFullYear();
    const meses = Array.from({ length: 12 }, (_, i) => `${year}-${(i + 1).toString().padStart(2, '0')}`);
    const usuarios = await authService.listarUsuarios();

    const grade = contas.filter(c => c.ativa).map(conta => {
      const mesesStatus = meses.map(periodo => {
        const ativ = atividades.find(a =>
          (a.contaContabilIds?.includes(conta.id) || a.contaContabilId === conta.id) &&
          a.meses.some(m => m.startsWith(periodo))
        );
        if (!ativ) return { status: 'nao_iniciado', cor: '#EF4444', label: 'Não iniciado', responsavelNome: '' };
        const nomes = ativ.responsaveis.map(r => {
          const u = usuarios.find(usr => usr.id === r);
          return u ? u.email.split('@')[0] : '';
        }).filter(Boolean);
        if (ativ.status === 'completed') {
          const cor = ativ.onTime ? '#4CAF82' : '#F59E0B';
          const label = ativ.onTime ? 'Concluída' : 'Fora do prazo';
          return { status: ativ.onTime ? 'concluida' : 'fora_prazo', cor, label, responsavelNome: nomes.join(', ') };
        }
        return { status: 'em_andamento', cor: '#F59E0B', label: 'Em andamento', responsavelNome: nomes.join(', ') };
      });
      return { conta, meses: mesesStatus };
    });

    res.json({ empresaId, ano: year, grade });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Fechamentos
router.get('/fechamentos', async (req, res) => {
  try {
    const { empresaId, periodo } = req.query as any;
    const result = await fechamentoService.listar(empresaId, periodo);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/fechamentos/:id', async (req, res) => {
  try {
    const fech = await fechamentoService.buscarPorId(req.params.id);
    if (!fech) return res.status(404).json({ message: 'Fechamento não encontrado' });
    res.json(fech);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/fechamentos/:id/historico', async (req, res) => {
  try {
    const hist = await fechamentoService.historicoPorFechamento(req.params.id);
    res.json(hist);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/fechamentos', async (req, res) => {
  try {
    const { empresaId, periodo } = req.body;
    const fech = await fechamentoService.iniciar(empresaId, periodo);
    res.status(201).json(fech);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/fechamentos/:id/concluir', async (req, res) => {
  try {
    const { usuarioId, nivelUsuario } = req.body;
    const fech = await fechamentoService.concluir(req.params.id, usuarioId, nivelUsuario);
    res.json(fech);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/fechamentos/:id/justificativa', async (req, res) => {
  try {
    const { justificativa } = req.body;
    const fech = await fechamentoService.adicionarJustificativa(req.params.id, justificativa);
    res.json(fech);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
