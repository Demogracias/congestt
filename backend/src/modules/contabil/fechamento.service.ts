import { SqlitePersistence, generateId } from '../../database/SqlitePersistence';
import { ValidationError, NotFoundError } from '../../utils/errors';

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
  private fechamentos = new SqlitePersistence<FechamentoContabil>('fechamentos_contabeis');
  private historicoPersistence = new SqlitePersistence<{ id: string; fechamentoId: string; acao: string; usuarioId: string; descricao: string; createdAt: string }>('fechamentos_historico');

  async listar(empresaId?: string, periodo?: string) {
    let result = this.fechamentos.getAll();
    if (empresaId) result = result.filter(f => f.empresaId === empresaId);
    if (periodo) result = result.filter(f => f.periodo === periodo);
    return result;
  }

  async buscarPorId(id: string) {
    const f = this.fechamentos.getById(id);
    if (!f) throw new NotFoundError('Fechamento não encontrado');
    return f;
  }

  async historicoPorFechamento(fechamentoId: string) {
    return this.historicoPersistence.getAll().filter(h => h.fechamentoId === fechamentoId);
  }

  async iniciar(empresaId: string, periodo: string, usuarioId: string = '1') {
    const existente = this.fechamentos.getAll().find(f => f.empresaId === empresaId && f.periodo === periodo);
    if (existente) throw new ValidationError('Já existe fechamento para esta empresa/período');

    const novo: FechamentoContabil = {
      id: generateId(),
      empresaId, periodo,
      status: 'em_andamento',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.fechamentos.add(novo);

    await this.historicoPersistence.add({
      id: generateId(),
      fechamentoId: novo.id,
      acao: 'iniciado',
      usuarioId,
      descricao: 'Fechamento iniciado',
      createdAt: new Date().toISOString(),
    });

    return novo;
  }

  async concluir(id: string, usuarioId: string, nivelUsuario: number) {
    if (nivelUsuario < 5) {
      throw new ValidationError('Apenas Supervisor (nível 5+) pode aprovar fechamento');
    }

    const fech = this.fechamentos.getById(id);
    if (!fech) throw new NotFoundError('Fechamento não encontrado');
    if (fech.status === 'concluido') throw new ValidationError('Fechamento já concluído');

    await this.fechamentos.update(id, {
      status: 'concluido',
      aprovadoPor: usuarioId,
      updatedAt: new Date().toISOString(),
    });

    await this.historicoPersistence.add({
      id: generateId(),
      fechamentoId: id,
      acao: 'concluido',
      usuarioId,
      descricao: 'Fechamento aprovado pelo supervisor',
      createdAt: new Date().toISOString(),
    });

    return this.fechamentos.getById(id);
  }

  async adicionarJustificativa(id: string, justificativa: string, usuarioId: string = '1') {
    const fech = this.fechamentos.getById(id);
    if (!fech) throw new NotFoundError('Fechamento não encontrado');

    await this.fechamentos.update(id, {
      justificativa,
      updatedAt: new Date().toISOString(),
    });

    await this.historicoPersistence.add({
      id: generateId(),
      fechamentoId: id,
      acao: 'justificativa',
      usuarioId,
      descricao: `Justificativa: ${justificativa}`,
      createdAt: new Date().toISOString(),
    });

    return this.fechamentos.getById(id);
  }
}
