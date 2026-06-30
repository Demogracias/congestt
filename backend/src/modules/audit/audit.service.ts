import { SqlitePersistence, generateId } from '../../database/SqlitePersistence';

export interface AuditEntry {
  id: string;
  timestamp: string;
  usuarioId: string;
  acao: string;
  recurso: string;
  recursoId?: string;
  detalhes: string;
  ip?: string;
}

export class AuditService {
  private persistence = new SqlitePersistence<AuditEntry>('auditoria');

  async registrar(entry: Omit<AuditEntry, 'id' | 'timestamp'>) {
    const nova: AuditEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    await this.persistence.add(nova);
    return nova;
  }

  async listar(filtro?: { recurso?: string; acao?: string; limite?: number }) {
    let result = this.persistence.getAll();
    if (filtro?.recurso) result = result.filter(l => l.recurso === filtro.recurso);
    if (filtro?.acao) result = result.filter(l => l.acao === filtro.acao);
    result = result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (filtro?.limite) result = result.slice(0, filtro.limite);
    return result;
  }

  async listarPorUsuario(usuarioId: string) {
    return this.persistence.getAll().filter(l => l.usuarioId === usuarioId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export const auditService = new AuditService();
