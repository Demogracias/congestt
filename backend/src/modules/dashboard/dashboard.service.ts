import { EmpresasService, Empresa } from '../empresas/empresas.service';
import { EquipesService } from '../equipes/equipes.service';
import { PlannerService } from '../planner/planner.service';
import { cacheWrap, cacheClear } from '../../utils/cache';

export class DashboardService {
  private empresasService = new EmpresasService();
  private equipesService = new EquipesService();
  private plannerService = new PlannerService();

  async getCardsPorEquipe() {
    return cacheWrap('cards-por-equipe', async () => {
    const [empresas, equipes, atividades] = await Promise.all([
      this.empresasService.listar(),
      this.equipesService.listar(),
      this.plannerService.listar(),
    ]);

    return equipes.map(eq => {
      const emps = empresas.filter(e => e.equipe === eq.nome);
      const matrizes = emps.filter(e => e.tipo === 'Matriz');
      const portes = { Grande: 0, Medio: 0, Pequeno: 0, Micro: 0 };
      emps.forEach(e => {
        const p = e.porte;
        if (p === 'Grande') portes.Grande++;
        else if (p === 'Médio') portes.Medio++;
        else if (p === 'Pequeno') portes.Pequeno++;
        else if (p === 'Micro') portes.Micro++;
      });
      const maiorPorte = Object.entries(portes).sort((a, b) => b[1] - a[1])[0];
      const porteLabel = maiorPorte && maiorPorte[1] > 0 ? maiorPorte[0] : '—';

      return {
        equipeId: eq.id,
        equipeNome: eq.nome,
        totalEmpresas: emps.length,
        matrizes: matrizes.length,
        filiais: emps.length - matrizes.length,
        portePredominante: porteLabel,
        portes,
      };
    });
    }, 60000);
  }

  async getGradeEmpresas(ano: number, equipeFiltro?: string) {
    const key = `grade-${ano}-${equipeFiltro || 'todas'}`;
    return cacheWrap(key, async () => {
    const [empresas, atividades] = await Promise.all([
      this.empresasService.listar(),
      this.plannerService.listar(),
    ]);

    let empresasFiltradas = empresas;
    if (equipeFiltro && equipeFiltro !== 'Todas') {
      empresasFiltradas = empresas.filter(e => e.equipe === equipeFiltro);
    }

    const meses = Array.from({ length: 12 }, (_, i) => {
      const mes = (i + 1).toString().padStart(2, '0');
      return `${ano}-${mes}`;
    });

    return empresasFiltradas.map(emp => {
      const mesesStatus = meses.map(periodo => {
        const ativs = atividades.filter(a =>
          a.empresaId === emp.id &&
          a.meses.some(m => m.startsWith(periodo))
        );
        if (ativs.length === 0) return { status: 'nao_iniciado', perc: 0 };
        const concluidas = ativs.filter(a => a.status === 'completed').length;
        const perc = Math.round((concluidas / ativs.length) * 100);
        const total = ativs.length;
        const totalConcluidas = ativs.filter(a => a.status === 'completed').length;
        const atrasadas = ativs.filter(a => a.status === 'completed' && !a.onTime).length;
        const andamento = ativs.filter(a => a.status === 'running' || a.status === 'paused').length;
        const aPrazo = ativs.filter(a => a.status === 'completed' && a.onTime).length;
        const naoIniciadas = ativs.filter(a => a.status === 'pending').length;

        let cor = '#EF4444';
        if (perc === 100 && atrasadas === 0) cor = '#4CAF82';
        else if (perc === 100 && atrasadas > 0) cor = '#F59E0B';
        else if (perc > 0) cor = '#F59E0B';

        return {
          status: perc === 100 ? (atrasadas > 0 ? 'fora_do_prazo' : 'concluido') : perc > 0 ? 'em_andamento' : 'nao_iniciado',
          perc, cor, total, concluidas: totalConcluidas, aPrazo, andamento, naoIniciadas, atrasadas,
        };
      });

      return { empresa: emp, meses: mesesStatus };
    });
    }, 60000);
  }

  async getPerformancePorPorte() {
    return cacheWrap('performance-por-porte', async () => {
    const empresas = await this.empresasService.listar();
    const atividades = await this.plannerService.listar();
    const portes = ['Grande', 'Médio', 'Pequeno', 'Micro'];

    return portes.map(porte => {
      const emps = empresas.filter(e => e.porte === porte);
      const ids = emps.map(e => e.id);
      const ativs = atividades.filter(a => a.empresaId && ids.includes(a.empresaId));
      const concluidas = ativs.filter(a => a.status === 'completed');
      const noPrazo = concluidas.filter(a => a.onTime);
      const perc = concluidas.length > 0 ? Math.round((noPrazo.length / concluidas.length) * 100) : 0;

      return { label: porte, value: perc };
    });
    }, 60000);
  }

  async getConcluidasMes() {
    return cacheWrap('concluidas-mes', async () => {
    const atividades = await this.plannerService.listar();
    const mesAtual = new Date().toISOString().slice(0, 7);
    const concluidas = atividades.filter(a =>
      a.status === 'completed' &&
      a.concluidaEm &&
      a.concluidaEm.startsWith(mesAtual)
    );
    return {
      total: concluidas.length,
      noPrazo: concluidas.filter(a => a.onTime).length,
      foraPrazo: concluidas.filter(a => !a.onTime).length,
    };
    }, 60000);
  }

  async getEquipeDoMes() {
    return cacheWrap('equipe-do-mes', async () => {
    const equipes = await this.equipesService.listar();
    const atividades = await this.plannerService.listar();

    const stats = equipes.map(eq => {
      const ativs = atividades.filter(a => a.responsaveis.some(r => eq.membros.some(m => m.id === r)));
      const concluidas = ativs.filter(a => a.status === 'completed' && a.onTime);
      const perc = ativs.length > 0 ? Math.round((concluidas.length / ativs.length) * 100) : 0;
      return { nome: eq.nome, atividades: ativs.length, perc, concluidas: concluidas.length };
    });

    stats.sort((a, b) => b.perc - a.perc);
    return stats[0] || { nome: 'Alpha', atividades: 0, perc: 0, concluidas: 0 };
    }, 60000);
  }

  clearCache() {
    cacheClear('cards-por-equipe');
    cacheClear('grade-');
    cacheClear('performance-por-porte');
    cacheClear('concluidas-mes');
    cacheClear('equipe-do-mes');
  }
}
