import express from 'express';
import { ContasService } from './contas.service';
import { FechamentoService } from './fechamento.service';
import { PlannerService } from '../planner/planner.service';
import { authService } from '../auth/auth.service';
import { auditService } from '../audit/audit.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const router = express.Router();
const contasService = new ContasService();
const fechamentoService = new FechamentoService();
const plannerService = new PlannerService();

// Contas Contábeis
router.get('/contas', async (req, res) => {
  try {
    const { empresaId } = req.query as any;
    const result = await contasService.listar(empresaId);
    res.json(result);
  } catch (error: any) {
    console.error('[Contabil] GET /contas', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/contas/:id', async (req, res) => {
  try {
    const conta = await contasService.buscarPorId(req.params.id);
    if (!conta) return res.status(404).json({ message: 'Conta não encontrada' });
    res.json(conta);
  } catch (error: any) {
    console.error('[Contabil] GET /contas/:id', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/contas', async (req: AuthRequest, res) => {
  try {
    const conta = await contasService.criar(req.body);
    auditService.registrar({ usuarioId: req.usuario?.id || 'unknown', acao: 'criar', recurso: 'contabil', recursoId: conta.id, detalhes: `Nova conta: ${conta.codigo} - ${conta.nome}` }).catch(e => console.error('[Audit]', e));
    res.status(201).json(conta);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/contas/importar', async (req: AuthRequest, res) => {
  try {
    const { empresaId, contas } = req.body;
    if (!empresaId || !contas || !Array.isArray(contas)) {
      return res.status(400).json({ message: 'Informe empresaId e array contas' });
    }
    const result = await contasService.importarPlanilha(empresaId, contas);
    auditService.registrar({ usuarioId: req.usuario?.id || 'unknown', acao: 'importar', recurso: 'contabil', recursoId: empresaId, detalhes: `Importadas ${result.length} contas` }).catch(e => console.error('[Audit]', e));
    res.status(201).json({ importadas: result.length, contas: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/contas/:id', async (req: AuthRequest, res) => {
  try {
    const conta = await contasService.desativar(req.params.id);
    auditService.registrar({ usuarioId: req.usuario?.id || 'unknown', acao: 'desativar', recurso: 'contabil', recursoId: req.params.id, detalhes: `Conta desativada: ${conta?.codigo} - ${conta?.nome}` }).catch(e => console.error('[Audit]', e));
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
    console.error('[Contabil] GET /grade', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Fechamentos
router.get('/fechamentos', async (req, res) => {
  try {
    const { empresaId, periodo } = req.query as any;
    const result = await fechamentoService.listar(empresaId, periodo);
    res.json(result);
  } catch (error: any) {
    console.error('[Contabil] GET /fechamentos', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/fechamentos/:id', async (req, res) => {
  try {
    const fech = await fechamentoService.buscarPorId(req.params.id);
    if (!fech) return res.status(404).json({ message: 'Fechamento não encontrado' });
    res.json(fech);
  } catch (error: any) {
    console.error('[Contabil] GET /fechamentos/:id', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/fechamentos/:id/historico', async (req, res) => {
  try {
    const hist = await fechamentoService.historicoPorFechamento(req.params.id);
    res.json(hist);
  } catch (error: any) {
    console.error('[Contabil] GET /fechamentos/:id/historico', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/fechamentos', async (req: AuthRequest, res) => {
  try {
    const { empresaId, periodo } = req.body;
    const fech = await fechamentoService.iniciar(empresaId, periodo, req.usuario?.id);
    res.status(201).json(fech);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/fechamentos/:id/concluir', async (req: AuthRequest, res) => {
  try {
    const { usuarioId } = req.body;
    const fech = await fechamentoService.concluir(req.params.id, usuarioId, req.usuario?.level || 0);
    res.json(fech);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/fechamentos/:id/justificativa', async (req: AuthRequest, res) => {
  try {
    const { justificativa } = req.body;
    const fech = await fechamentoService.adicionarJustificativa(req.params.id, justificativa, req.usuario?.id);
    res.json(fech);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
