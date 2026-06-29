import { EmpresasService } from '../empresas/empresas.service';
import { EquipesService } from '../equipes/equipes.service';
import { PlannerService } from '../planner/planner.service';
import { ContasService } from '../contabil/contas.service';

export class RelatoriosService {
  private empresasService = new EmpresasService();
  private equipesService = new EquipesService();
  private plannerService = new PlannerService();
  private contasService = new ContasService();

  async maiorTempoAtividade() {
    const atividades = await this.plannerService.listar();
    return atividades
      .filter(a => a.timerTotal > 0)
      .sort((a, b) => b.timerTotal - a.timerTotal)
      .slice(0, 10)
      .map(a => ({
        titulo: a.titulo,
        tag: a.tag,
        tempoSegundos: a.timerTotal,
        status: a.status,
      }));
  }

  async comparativoPorPorte() {
    const [empresas, atividades] = await Promise.all([
      this.empresasService.listar(),
      this.plannerService.listar(),
    ]);

    const portes = ['Grande', 'Médio', 'Pequeno', 'Micro'];
    return portes.map(porte => {
      const emps = empresas.filter(e => e.porte === porte);
      const ids = emps.map(e => e.id);
      const ativs = atividades.filter(a => a.empresaId && ids.includes(a.empresaId));
      const concluidas = ativs.filter(a => a.status === 'completed');
      const noPrazo = concluidas.filter(a => a.onTime);

      return {
        porte,
        totalEmpresas: emps.length,
        totalAtividades: ativs.length,
        concluidas: concluidas.length,
        noPrazo: noPrazo.length,
        percNoPrazo: concluidas.length > 0 ? Math.round((noPrazo.length / concluidas.length) * 100) : 0,
        tempoMedio: ativs.length > 0 ? Math.round(ativs.reduce((acc, a) => acc + a.timerTotal, 0) / ativs.length) : 0,
      };
    });
  }

  async comparativoPorAtividade() {
    const [empresas, atividades] = await Promise.all([
      this.empresasService.listar(),
      this.plannerService.listar(),
    ]);

    const atividadesMap = new Map<string, { total: number; concluidas: number; noPrazo: number; tempoTotal: number }>();

    for (const atv of atividades) {
      const chave = atv.tag || empresas.find(e => e.id === atv.empresaId)?.atividade || 'Outros';
      const registro = atividadesMap.get(chave) || { total: 0, concluidas: 0, noPrazo: 0, tempoTotal: 0 };
      registro.total++;
      if (atv.status === 'completed') registro.concluidas++;
      if (atv.onTime) registro.noPrazo++;
      registro.tempoTotal += atv.timerTotal;
      atividadesMap.set(chave, registro);
    }

    return Array.from(atividadesMap.entries()).map(([atividade, dados]) => ({
      atividade,
      totalAtividades: dados.total,
      concluidas: dados.concluidas,
      percNoPrazo: dados.concluidas > 0 ? Math.round((dados.noPrazo / dados.concluidas) * 100) : 0,
      tempoMedio: dados.total > 0 ? Math.round(dados.tempoTotal / dados.total) : 0,
    }));
  }

  async analisePorColaborador() {
    const [equipes, atividades] = await Promise.all([
      this.equipesService.listar(),
      this.plannerService.listar(),
    ]);

    const membros = equipes.flatMap(eq => eq.membros);
    return membros.map(m => {
      const ativs = atividades.filter(a => a.responsaveis.includes(m.id));
      const concluidas = ativs.filter(a => a.status === 'completed');
      const noPrazo = concluidas.filter(a => a.onTime);

      return {
        nome: m.nome,
        cargo: m.cargo,
        equipe: equipes.find(eq => eq.membros.some(mm => mm.id === m.id))?.nome || '—',
        totalAtividades: ativs.length,
        concluidas: concluidas.length,
        percNoPrazo: concluidas.length > 0 ? Math.round((noPrazo.length / concluidas.length) * 100) : 0,
        tempoTotal: ativs.reduce((acc, a) => acc + a.timerTotal, 0),
        produtividade: m.perc,
      };
    });
  }

  async analisePorEquipe() {
    const [equipes, atividades] = await Promise.all([
      this.equipesService.listar(),
      this.plannerService.listar(),
    ]);

    return equipes.map(eq => {
      const idsMembros = eq.membros.map(m => m.id);
      const ativs = atividades.filter(a => a.responsaveis.some(r => idsMembros.includes(r)));
      const concluidas = ativs.filter(a => a.status === 'completed');
      const noPrazo = concluidas.filter(a => a.onTime);

      return {
        equipe: eq.nome,
        supervisao: eq.supervisao,
        totalMembros: eq.membros.length,
        totalAtividades: ativs.length,
        concluidas: concluidas.length,
        percNoPrazo: concluidas.length > 0 ? Math.round((noPrazo.length / concluidas.length) * 100) : 0,
      };
    });
  }

  async analisePorSupervisao() {
    const [equipes, atividades] = await Promise.all([
      this.equipesService.listar(),
      this.plannerService.listar(),
    ]);

    const supervisoesMap = new Map<string, { equipes: string[]; totalAtividades: number; concluidas: number; noPrazo: number }>();

    for (const eq of equipes) {
      const sup = eq.supervisao || 'Sem supervisão';
      const registro = supervisoesMap.get(sup) || { equipes: [], totalAtividades: 0, concluidas: 0, noPrazo: 0 };
      registro.equipes.push(eq.nome);
      const idsMembros = eq.membros.map(m => m.id);
      const ativs = atividades.filter(a => a.responsaveis.some(r => idsMembros.includes(r)));
      registro.totalAtividades += ativs.length;
      registro.concluidas += ativs.filter(a => a.status === 'completed').length;
      registro.noPrazo += ativs.filter(a => a.onTime).length;
      supervisoesMap.set(sup, registro);
    }

    return Array.from(supervisoesMap.entries()).map(([supervisao, dados]) => ({
      supervisao,
      equipes: dados.equipes.join(', '),
      totalAtividades: dados.totalAtividades,
      concluidas: dados.concluidas,
      percNoPrazo: dados.concluidas > 0 ? Math.round((dados.noPrazo / dados.concluidas) * 100) : 0,
    }));
  }
}
