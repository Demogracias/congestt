import { Persistence, generateId } from '../../utils/persistence';

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
  private persistence = new Persistence<AuditEntry>('audit.json', [
    { id: 'a1', timestamp: '2026-06-27T08:00:00Z', usuarioId: '1', acao: 'login', recurso: 'auth', detalhes: 'Login realizado' },
    { id: 'a2', timestamp: '2026-06-27T08:15:00Z', usuarioId: '1', acao: 'criar', recurso: 'empresa', recursoId: '5', detalhes: 'Nova empresa: Tech Solutions' },
    { id: 'a3', timestamp: '2026-06-27T09:00:00Z', usuarioId: '1', acao: 'iniciar_timer', recurso: 'planner', recursoId: '2', detalhes: 'Timer iniciado: Fechamento NIBRA' },
  ]);

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
