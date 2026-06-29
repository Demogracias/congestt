import { Persistence } from '../../utils/persistence';

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
  private persistence = new Persistence<Equipe>('equipes.json', [
    { id: '1', nome: 'Alpha', supervisao: 'Gerência Regional SP', supervisorId: '', empresaIds: [], membros: [
      { id: 'm1', nome: 'Carlos Silva', cargo: 'Analista', nivel: 4, empresa: 'MISA', perc: 94 },
      { id: 'm2', nome: 'Ana Rodrigues', cargo: 'Assistente', nivel: 3, empresa: 'NIBRA', perc: 88 },
      { id: 'm3', nome: 'Lucas Melo', cargo: 'Estagiário', nivel: 1, empresa: 'QUÍMICA', perc: 76 },
    ], createdAt: '2024-01-01' },
    { id: '2', nome: 'Beta', supervisao: 'Gerência Regional RJ', supervisorId: '', empresaIds: [], membros: [
      { id: 'm4', nome: 'Fernanda Costa', cargo: 'Analista', nivel: 4, empresa: 'CALBRAS', perc: 91 },
      { id: 'm5', nome: 'Rafael Lima', cargo: 'Auxiliar', nivel: 2, empresa: 'MISA', perc: 72 },
    ], createdAt: '2024-02-01' },
  ]);

  async listar() {
    return this.persistence.getAll();
  }

  async buscarPorId(id: string) {
    return this.persistence.getById(id) || null;
  }

  async criar(dados: { nome: string; supervisao: string; supervisorId: string }) {
    const todas = this.persistence.getAll();
    if (todas.find(e => e.nome === dados.nome)) throw new Error('Já existe uma equipe com este nome');

    const nova: Equipe = {
      id: Math.random().toString(36).substr(2, 9),
      nome: dados.nome,
      supervisao: dados.supervisao,
      supervisorId: dados.supervisorId,
      empresaIds: [],
      membros: [],
      createdAt: new Date().toISOString().split('T')[0],
    };

    this.persistence.add(nova);
    return nova;
  }

  async atualizar(id: string, dados: Partial<Equipe>) {
    const existente = this.persistence.getById(id);
    if (!existente) throw new Error('Equipe não encontrada');
    if (dados.nome) {
      const dup = this.persistence.getAll().find(e => e.id !== id && e.nome === dados.nome);
      if (dup) throw new Error('Já existe uma equipe com este nome');
    }
    this.persistence.update(id, dados);
    return this.persistence.getById(id);
  }

  async adicionarMembro(equipeId: string, membro: { id?: string; nome: string; cargo: string; nivel: number; empresa: string }) {
    const equipe = this.persistence.getById(equipeId);
    if (!equipe) throw new Error('Equipe não encontrada');

    const novoMembro: Membro = {
      id: membro.id || Math.random().toString(36).substr(2, 9),
      nome: membro.nome,
      cargo: membro.cargo,
      nivel: membro.nivel,
      empresa: membro.empresa || '',
      perc: 0,
    };

    equipe.membros.push(novoMembro);
    this.persistence.update(equipeId, { membros: equipe.membros });
    return novoMembro;
  }

  async removerMembro(equipeId: string, membroId: string) {
    const equipe = this.persistence.getById(equipeId);
    if (!equipe) throw new Error('Equipe não encontrada');
    const idx = equipe.membros.findIndex(m => m.id === membroId);
    if (idx === -1) throw new Error('Membro não encontrado');
    equipe.membros.splice(idx, 1);
    this.persistence.update(equipeId, { membros: equipe.membros });
    return equipe;
  }

  async remover(id: string) {
    const ok = this.persistence.delete(id);
    if (!ok) throw new Error('Equipe não encontrada');
  }
}
