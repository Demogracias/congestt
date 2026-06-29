import { Persistence } from '../../utils/persistence';

export interface FechamentoContabil {
  id: string;
  empresaId: string;
  periodo: string;
  status: 'nao_iniciado' | 'em_andamento' | 'concluido';
  aprovadoPor?: string;
  justificativa?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoricoFechamento {
  id: string;
  fechamentoId: string;
  acao: string;
  usuarioId: string;
  descricao: string;
  createdAt: string;
}

export class FechamentoService {
  private fechamentos = new Persistence<FechamentoContabil>('fechamentos.json', [
    { id: 'f1', empresaId: '1', periodo: '2026-01', status: 'concluido', aprovadoPor: '1', createdAt: '2026-02-01', updatedAt: '2026-02-05' },
    { id: 'f2', empresaId: '2', periodo: '2026-01', status: 'em_andamento', createdAt: '2026-02-01', updatedAt: '2026-02-10' },
    { id: 'f3', empresaId: '3', periodo: '2026-01', status: 'nao_iniciado', createdAt: '2026-02-01', updatedAt: '2026-02-01' },
    { id: 'f4', empresaId: '1', periodo: '2026-02', status: 'em_andamento', createdAt: '2026-03-01', updatedAt: '2026-03-05' },
  ]);

  private historicoPersistence = new Persistence<{ id: string; fechamentoId: string; acao: string; usuarioId: string; descricao: string; createdAt: string }>('fechamentos_historico.json', []);

  async listar(empresaId?: string, periodo?: string) {
    let result = this.fechamentos.getAll();
    if (empresaId) result = result.filter(f => f.empresaId === empresaId);
    if (periodo) result = result.filter(f => f.periodo === periodo);
    return result;
  }

  async buscarPorId(id: string) {
    return this.fechamentos.getById(id) || null;
  }

  async historicoPorFechamento(fechamentoId: string) {
    return this.historicoPersistence.getAll().filter(h => h.fechamentoId === fechamentoId);
  }

  async iniciar(empresaId: string, periodo: string) {
    const existente = this.fechamentos.getAll().find(f => f.empresaId === empresaId && f.periodo === periodo);
    if (existente) throw new Error('Já existe fechamento para esta empresa/período');

    const novo: FechamentoContabil = {
      id: Math.random().toString(36).substr(2, 9),
      empresaId, periodo,
      status: 'em_andamento',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.fechamentos.add(novo);

    this.historicoPersistence.add({
      id: Math.random().toString(36).substr(2, 9),
      fechamentoId: novo.id,
      acao: 'iniciado',
      usuarioId: '1',
      descricao: 'Fechamento iniciado',
      createdAt: new Date().toISOString(),
    });

    return novo;
  }

  async concluir(id: string, usuarioId: string, nivelUsuario: number) {
    if (nivelUsuario < 5) {
      throw new Error('Apenas Supervisor (nível 5+) pode aprovar fechamento');
    }

    const fech = this.fechamentos.getById(id);
    if (!fech) throw new Error('Fechamento não encontrado');
    if (fech.status === 'concluido') throw new Error('Fechamento já concluído');

    this.fechamentos.update(id, {
      status: 'concluido',
      aprovadoPor: usuarioId,
      updatedAt: new Date().toISOString(),
    });

    this.historicoPersistence.add({
      id: Math.random().toString(36).substr(2, 9),
      fechamentoId: id,
      acao: 'concluido',
      usuarioId,
      descricao: 'Fechamento aprovado pelo supervisor',
      createdAt: new Date().toISOString(),
    });

    return this.fechamentos.getById(id);
  }

  async adicionarJustificativa(id: string, justificativa: string) {
    const fech = this.fechamentos.getById(id);
    if (!fech) throw new Error('Fechamento não encontrado');

    this.fechamentos.update(id, {
      justificativa,
      updatedAt: new Date().toISOString(),
    });

    this.historicoPersistence.add({
      id: Math.random().toString(36).substr(2, 9),
      fechamentoId: id,
      acao: 'justificativa',
      usuarioId: '1',
      descricao: `Justificativa: ${justificativa}`,
      createdAt: new Date().toISOString(),
    });

    return this.fechamentos.getById(id);
  }
}
