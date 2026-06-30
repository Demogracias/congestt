import { SqlitePersistence, generateId } from '../../database/SqlitePersistence';
import * as crypto from 'crypto';

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
  private consentimentos = new SqlitePersistence<Consentimento>('consentimentos');
  private anonimizacoes = new SqlitePersistence<AnonimizacaoRequest>('anonimizacoes');
  private users = new SqlitePersistence<{ id: string; email: string; password: string; role: string; level: number }>('users');

  async listarConsentimentos(usuarioId?: string) {
    let result = this.consentimentos.getAll();
    if (usuarioId) result = result.filter(c => c.usuarioId === usuarioId);
    return result;
  }

  async registrarConsentimento(usuarioId: string, tipo: 'termos_uso' | 'dados_pessoais' | 'comunicacao', aceito: boolean, ip?: string) {
    const todos = this.consentimentos.getAll();
    const existente = todos.find(c => c.usuarioId === usuarioId && c.tipo === tipo);
    const novo: Consentimento = {
      id: generateId(),
      usuarioId, tipo, aceito,
      dataAceite: new Date().toISOString(),
      ip,
    };

    if (existente) {
      await this.consentimentos.update(existente.id, novo);
    } else {
      await this.consentimentos.add(novo);
    }

    return novo;
  }

  async solicitarAnonimizacao(usuarioId: string, solicitanteId: string, solicitanteNivel: number = 0): Promise<AnonimizacaoRequest> {
    if (solicitanteId !== usuarioId && solicitanteNivel < 6) {
      throw new Error('Apenas o próprio usuário ou um Gerente pode solicitar anonimização');
    }
    const pendente = this.anonimizacoes.getAll().find(a => a.usuarioId === usuarioId && a.status === 'pendente');
    if (pendente) throw new Error('Já existe solicitação pendente');

    const req: AnonimizacaoRequest = {
      id: generateId(),
      usuarioId,
      dataSolicitacao: new Date().toISOString(),
      status: 'pendente',
    };

    await this.anonimizacoes.add(req);
    return req;
  }

  async processarAnonimizacao(requestId: string) {
    const req = this.anonimizacoes.getById(requestId);
    if (!req) throw new Error('Solicitação não encontrada');
    if (req.status === 'concluido') throw new Error('Solicitação já processada');

    const user = this.users.getById(req.usuarioId);
    if (user) {
      const hash = crypto.createHash('sha256').update(user.id).digest('hex').slice(0, 12);
      await this.users.update(user.id, {
        email: `anonimo-${hash}@anonimizado.local`,
        password: crypto.randomBytes(32).toString('hex'),
        role: 'Anônimo',
      });
      // Remove consentimentos associados ao usuário anonimizado
      const consents = this.consentimentos.getAll().filter(c => c.usuarioId === req.usuarioId);
      for (const c of consents) {
        await this.consentimentos.delete(c.id);
      }
    }

    await this.anonimizacoes.update(requestId, {
      status: 'concluido',
      dataConclusao: new Date().toISOString(),
    });

    return this.anonimizacoes.getById(requestId);
  }

  async listarSolicitacoesAnonimizacao() {
    return this.anonimizacoes.getAll().sort((a, b) => new Date(b.dataSolicitacao).getTime() - new Date(a.dataSolicitacao).getTime());
  }
}
