import { Persistence, generateId } from '../../utils/persistence';

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
  private persistence = new Persistence<ContaContabil>('contas.json', [
    { id: 'c1', empresaId: '', codigo: '1', nome: 'Ativo', tipo: 'Ativo', natureza: 'Sintética', categoria: 'Ativo', ativa: true, createdAt: '2024-01-01' },
    { id: 'c2', empresaId: '', codigo: '1.01', nome: 'Circulante', tipo: 'Ativo', natureza: 'Sintética', categoria: 'Ativo', contaPaiId: 'c1', ativa: true, createdAt: '2024-01-01' },
    { id: 'c3', empresaId: '', codigo: '1.01.001', nome: 'Caixa', tipo: 'Ativo', natureza: 'Analítica', categoria: 'Ativo', contaPaiId: 'c2', ativa: true, createdAt: '2024-01-01' },
    { id: 'c4', empresaId: '', codigo: '1.01.002', nome: 'Banco', tipo: 'Ativo', natureza: 'Analítica', categoria: 'Ativo', contaPaiId: 'c2', ativa: true, createdAt: '2024-01-01' },
    { id: 'c5', empresaId: '', codigo: '1.01.003', nome: 'Aplicações', tipo: 'Ativo', natureza: 'Analítica', categoria: 'Ativo', contaPaiId: 'c2', ativa: true, createdAt: '2024-01-01' },
    { id: 'c6', empresaId: '', codigo: '1.01.004', nome: 'Clientes', tipo: 'Ativo', natureza: 'Analítica', categoria: 'Ativo', contaPaiId: 'c2', ativa: true, createdAt: '2024-01-01' },
    { id: 'c7', empresaId: '', codigo: '1.02', nome: 'Não Circulante', tipo: 'Ativo', natureza: 'Sintética', categoria: 'Ativo', contaPaiId: 'c1', ativa: true, createdAt: '2024-01-01' },
    { id: 'c8', empresaId: '', codigo: '1.02.001', nome: 'Imobilizado', tipo: 'Ativo', natureza: 'Analítica', categoria: 'Ativo', contaPaiId: 'c7', ativa: true, createdAt: '2024-01-01' },
    { id: 'c9', empresaId: '', codigo: '2', nome: 'Passivo', tipo: 'Passivo', natureza: 'Sintética', categoria: 'Passivo', ativa: true, createdAt: '2024-01-01' },
    { id: 'c10', empresaId: '', codigo: '2.01', nome: 'Circulante', tipo: 'Passivo', natureza: 'Sintética', categoria: 'Passivo', contaPaiId: 'c9', ativa: true, createdAt: '2024-01-01' },
    { id: 'c11', empresaId: '', codigo: '2.01.001', nome: 'Fiscal', tipo: 'Passivo', natureza: 'Analítica', categoria: 'Passivo', contaPaiId: 'c10', ativa: true, createdAt: '2024-01-01' },
    { id: 'c12', empresaId: '', codigo: '3', nome: 'DRE', tipo: 'DRE', natureza: 'Sintética', categoria: 'DRE', ativa: true, createdAt: '2024-01-01' },
  ]);

  async listar(empresaId?: string) {
    let result = this.persistence.getAll();
    if (empresaId) result = result.filter(c => !c.empresaId || c.empresaId === empresaId);
    return result;
  }

  async buscarPorId(id: string) {
    return this.persistence.getById(id) || null;
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
      throw new Error('Código de conta já existe para esta empresa');
    }

    if (dados.contaPaiId) {
      const pai = todas.find(c => c.id === dados.contaPaiId);
      if (!pai) throw new Error('Conta pai não encontrada');
      if (pai.natureza !== 'Sintética') throw new Error('Apenas contas sintéticas podem ter filhos');
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
      if (!tiposValidos.includes(c.tipo)) throw new Error(`Tipo inválido "${c.tipo}" para conta ${c.codigo}. Use Ativo, Passivo ou DRE.`);
      if (!naturezasValidas.includes(c.natureza)) throw new Error(`Natureza inválida "${c.natureza}" para conta ${c.codigo}. Use Sintética ou Analítica.`);
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
    if (!conta) throw new Error('Conta não encontrada');
    const filhos = this.persistence.getAll().filter(c => c.contaPaiId === id);
    if (filhos.length > 0) throw new Error('Desative contas filhas primeiro');
    await this.persistence.update(id, { ativa: false });
    return this.persistence.getById(id);
  }
}
