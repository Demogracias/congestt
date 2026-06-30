import { SqlitePersistence, generateId } from '../../database/SqlitePersistence';
import { ValidationError, NotFoundError } from '../../utils/errors';

export interface ContaContabil {
  id: string;
  empresaId: string;
  codigo: string;
  nome: string;
  tipo: 'Ativo' | 'Passivo' | 'DRE';
  natureza: 'Sintética' | 'Analítica';
  categoria: string;
  ativa: boolean;
  contaPaiId?: string;
  createdAt: string;
}

export class ContasService {
  private persistence = new SqlitePersistence<ContaContabil>('contas_contabeis');

  async listar(empresaId?: string) {
    let result = this.persistence.getAll();
    if (empresaId) result = result.filter(c => !c.empresaId || c.empresaId === empresaId);
    return result;
  }

  async buscarPorId(id: string) {
    const c = this.persistence.getById(id);
    if (!c) throw new NotFoundError('Conta não encontrada');
    return c;
  }

  async buscarPorEmpresa(empresaId: string) {
    const todas = this.persistence.getAll();
    const proprias = todas.filter(c => c.empresaId === empresaId);
    if (proprias.length > 0) return proprias;
    return todas.filter(c => !c.empresaId);
  }

  async criar(dados: {
    empresaId?: string; codigo: string; nome: string;
    tipo: 'Ativo' | 'Passivo' | 'DRE';
    natureza: 'Sintética' | 'Analítica'; categoria?: string; contaPaiId?: string;
  }) {
    const todas = this.persistence.getAll();
    if (todas.find(c => c.codigo === dados.codigo && c.empresaId === (dados.empresaId || ''))) {
      throw new ValidationError('Código de conta já existe para esta empresa');
    }

    if (dados.contaPaiId) {
      const pai = todas.find(c => c.id === dados.contaPaiId);
      if (!pai) throw new ValidationError('Conta pai não encontrada');
      if (pai.natureza !== 'Sintética') throw new ValidationError('Apenas contas sintéticas podem ter filhos');
    }

    const nova: ContaContabil = {
      id: generateId(),
      empresaId: dados.empresaId || '',
      codigo: dados.codigo,
      nome: dados.nome,
      tipo: dados.tipo,
      natureza: dados.natureza,
      categoria: dados.categoria || dados.tipo,
      ativa: true,
      contaPaiId: dados.contaPaiId,
      createdAt: new Date().toISOString().split('T')[0],
    };

    await this.persistence.add(nova);
    return nova;
  }

  async importarPlanilha(empresaId: string, contas: Array<{ codigo: string; nome: string; tipo: string; natureza: string; contaPaiId?: string }>) {
    const importadas: ContaContabil[] = [];
    const todas = this.persistence.getAll();
    const tiposValidos = ['Ativo', 'Passivo', 'DRE'];
    const naturezasValidas = ['Sintética', 'Analítica'];
    for (const c of contas) {
      if (!tiposValidos.includes(c.tipo)) throw new ValidationError(`Tipo inválido "${c.tipo}" para conta ${c.codigo}. Use Ativo, Passivo ou DRE.`);
      if (!naturezasValidas.includes(c.natureza)) throw new ValidationError(`Natureza inválida "${c.natureza}" para conta ${c.codigo}. Use Sintética ou Analítica.`);
      let paiId = c.contaPaiId;
      if (paiId && !todas.find(t => t.id === paiId)) paiId = undefined;
      const nova: ContaContabil = {
        id: generateId(),
        empresaId,
        codigo: c.codigo,
        nome: c.nome,
        tipo: c.tipo as 'Ativo' | 'Passivo' | 'DRE',
        natureza: c.natureza as 'Sintética' | 'Analítica',
        categoria: c.tipo,
        ativa: true,
        contaPaiId: paiId,
        createdAt: new Date().toISOString().split('T')[0],
      };
      await this.persistence.add(nova);
      importadas.push(nova);
    }
    return importadas;
  }

  async desativar(id: string) {
    const conta = this.persistence.getById(id);
    if (!conta) throw new NotFoundError('Conta não encontrada');
    const filhos = this.persistence.getAll().filter(c => c.contaPaiId === id);
    if (filhos.length > 0) throw new ValidationError('Desative contas filhas primeiro');
    await this.persistence.update(id, { ativa: false });
    return this.persistence.getById(id);
  }
}
