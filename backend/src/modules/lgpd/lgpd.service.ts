import { Persistence } from '../../utils/persistence';

export interface Consentimento {
  id: string;
  usuarioId: string;
  tipo: 'termos_uso' | 'dados_pessoais' | 'comunicacao';
  aceito: boolean;
  dataAceite: string;
  ip?: string;
}

export interface AnonimizacaoRequest {
  id: string;
  usuarioId: string;
  dataSolicitacao: string;
  status: 'pendente' | 'concluido';
  dataConclusao?: string;
}

export class LgpdService {
  private consentimentos = new Persistence<Consentimento>('consentimentos.json', [
    { id: 'cg1', usuarioId: '1', tipo: 'termos_uso', aceito: true, dataAceite: '2026-01-01T10:00:00Z', ip: '192.168.1.1' },
    { id: 'cg2', usuarioId: '1', tipo: 'dados_pessoais', aceito: true, dataAceite: '2026-01-01T10:00:00Z' },
    { id: 'cg3', usuarioId: '2', tipo: 'termos_uso', aceito: true, dataAceite: '2026-01-15T09:00:00Z' },
  ]);

  private anonimizacoes = new Persistence<AnonimizacaoRequest>('anonimizacoes.json', []);

  async listarConsentimentos(usuarioId?: string) {
    let result = this.consentimentos.getAll();
    if (usuarioId) result = result.filter(c => c.usuarioId === usuarioId);
    return result;
  }

  async registrarConsentimento(usuarioId: string, tipo: string, aceito: boolean, ip?: string) {
    const todos = this.consentimentos.getAll();
    const existente = todos.find(c => c.usuarioId === usuarioId && c.tipo === tipo);
    const novo: Consentimento = {
      id: Math.random().toString(36).substr(2, 9),
      usuarioId, tipo: tipo as any, aceito,
      dataAceite: new Date().toISOString(),
      ip,
    };

    if (existente) {
      this.consentimentos.update(existente.id, novo);
    } else {
      this.consentimentos.add(novo);
    }

    return novo;
  }

  async solicitarAnonimizacao(usuarioId: string): Promise<AnonimizacaoRequest> {
    const pendente = this.anonimizacoes.getAll().find(a => a.usuarioId === usuarioId && a.status === 'pendente');
    if (pendente) throw new Error('Já existe solicitação pendente');

    const req: AnonimizacaoRequest = {
      id: Math.random().toString(36).substr(2, 9),
      usuarioId,
      dataSolicitacao: new Date().toISOString(),
      status: 'pendente',
    };

    this.anonimizacoes.add(req);
    return req;
  }

  async processarAnonimizacao(requestId: string) {
    const req = this.anonimizacoes.getById(requestId);
    if (!req) throw new Error('Solicitação não encontrada');
    if (req.status === 'concluido') throw new Error('Solicitação já processada');

    this.anonimizacoes.update(requestId, {
      status: 'concluido',
      dataConclusao: new Date().toISOString(),
    });

    return this.anonimizacoes.getById(requestId);
  }

  async listarSolicitacoesAnonimizacao() {
    return this.anonimizacoes.getAll().sort((a, b) => new Date(b.dataSolicitacao).getTime() - new Date(a.dataSolicitacao).getTime());
  }
}
