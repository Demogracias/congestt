import { SqlitePersistence, generateId } from '../../database/SqlitePersistence';
import { ValidationError, NotFoundError } from '../../utils/errors';

interface Membro {
  id: string;
  nome: string;
  cargo: string;
  nivel: number;
  empresa: string;
  perc: number;
}

interface Equipe {
  id: string;
  nome: string;
  supervisao: string;
  supervisorId: string;
  membros: Membro[];
  empresaIds: string[];
  createdAt: string;
}

export class EquipesService {
  private persistence = new SqlitePersistence<Equipe>('equipes');

  async listar() {
    return this.persistence.getAll();
  }

  async buscarPorId(id: string) {
    const e = this.persistence.getById(id);
    if (!e) throw new NotFoundError('Equipe não encontrada');
    return e;
  }

  async criar(dados: { nome: string; supervisao: string; supervisorId: string }) {
    const todas = this.persistence.getAll();
    if (todas.find(e => e.nome === dados.nome)) throw new ValidationError('Já existe uma equipe com este nome');

    const nova: Equipe = {
      id: generateId(),
      nome: dados.nome,
      supervisao: dados.supervisao,
      supervisorId: dados.supervisorId,
      empresaIds: [],
      membros: [],
      createdAt: new Date().toISOString().split('T')[0],
    };

    await this.persistence.add(nova);
    return nova;
  }

  async atualizar(id: string, dados: Partial<Equipe>) {
    const existente = this.persistence.getById(id);
    if (!existente) throw new NotFoundError('Equipe não encontrada');
    if (dados.nome) {
      const dup = this.persistence.getAll().find(e => e.id !== id && e.nome === dados.nome);
      if (dup) throw new ValidationError('Já existe uma equipe com este nome');
    }
    await this.persistence.update(id, dados);
    return this.persistence.getById(id);
  }

  async adicionarMembro(equipeId: string, membro: { id?: string; nome: string; cargo: string; nivel: number; empresa: string }) {
    const equipe = this.persistence.getById(equipeId);
    if (!equipe) throw new NotFoundError('Equipe não encontrada');

    const novoMembro: Membro = {
      id: generateId(),
      nome: membro.nome,
      cargo: membro.cargo,
      nivel: membro.nivel,
      empresa: membro.empresa || '',
      perc: 0,
    };

    await this.persistence.update(equipeId, { membros: [...equipe.membros, novoMembro] });
    return novoMembro;
  }

  async removerMembro(equipeId: string, membroId: string) {
    const equipe = this.persistence.getById(equipeId);
    if (!equipe) throw new NotFoundError('Equipe não encontrada');
    const idx = equipe.membros.findIndex(m => m.id === membroId);
    if (idx === -1) throw new ValidationError('Membro não encontrado');
    equipe.membros.splice(idx, 1);
    await this.persistence.update(equipeId, { membros: equipe.membros });
    return equipe;
  }

  async remover(id: string) {
    const ok = await this.persistence.delete(id);
    if (!ok) throw new NotFoundError('Equipe não encontrada');
  }
}
