import { Persistence } from '../../utils/persistence';
import { isValidCNPJ, formatCNPJ } from '../../utils/cnpj';
import { consultarCNPJ, consultarFiliais } from '../../utils/receita-mock';

interface GrupoEconomico {
  id: string;
  nome: string;
  createdAt: string;
}

export interface Empresa {
  id: string;
  cnpj: string;
  razaoSocial: string;
  apelido: string;
  porte: string;
  atividade: string;
  grupoEconomico: string;
  equipe: string;
  tipo: 'Matriz' | 'Filial';
  matrizCnpj?: string;
  tipoFechamento: string;
  diaFechamento: number;
  createdAt: string;
}

export class EmpresasService {
  private persistence = new Persistence<Empresa>('empresas.json', [
    { id: '1', cnpj: '12.345.678/0001-90', razaoSocial: 'MISA Indústria Ltda', apelido: 'MISA', porte: 'Grande', atividade: 'Indústria', grupoEconomico: 'Carbonil', equipe: 'Alpha', tipo: 'Matriz', tipoFechamento: 'Mensal', diaFechamento: 15, createdAt: '2024-01-15' },
    { id: '2', cnpj: '98.765.432/0001-11', razaoSocial: 'NIBRA Química S/A', apelido: 'NIBRA', porte: 'Grande', atividade: 'Indústria', grupoEconomico: 'Carbonil', equipe: 'Beta', tipo: 'Filial', matrizCnpj: '12.345.678/0001-90', tipoFechamento: 'Mensal', diaFechamento: 15, createdAt: '2024-02-20' },
    { id: '3', cnpj: '55.444.333/0001-22', razaoSocial: 'Química Central Ltda', apelido: 'QUÍMICA', porte: 'Médio', atividade: 'Indústria', grupoEconomico: 'Carbonil', equipe: 'Alpha', tipo: 'Matriz', tipoFechamento: 'Trimestral', diaFechamento: 10, createdAt: '2024-03-10' },
    { id: '4', cnpj: '11.222.333/0001-44', razaoSocial: 'Calbras Serviços ME', apelido: 'CALBRAS', porte: 'Micro', atividade: 'Serviços', grupoEconomico: '', equipe: 'Beta', tipo: 'Matriz', tipoFechamento: 'Sem Movimento', diaFechamento: 5, createdAt: '2025-06-01' },
  ]);
  private gruposPersistence = new Persistence<GrupoEconomico>('grupos.json', [
    { id: 'g1', nome: 'Carbonil', createdAt: '2024-01-01' },
  ]);

  async listar(filtro?: { porte?: string; equipe?: string; atividade?: string; grupoEconomico?: string; search?: string }) {
    let result = this.persistence.getAll();
    if (filtro?.porte && filtro.porte !== 'Todos') result = result.filter(e => e.porte === filtro.porte);
    if (filtro?.atividade && filtro.atividade !== 'Todos') result = result.filter(e => e.atividade === filtro.atividade);
    if (filtro?.equipe && filtro.equipe !== 'Todas') result = result.filter(e => e.equipe === filtro.equipe);
    if (filtro?.grupoEconomico && filtro.grupoEconomico !== 'Todos') result = result.filter(e => e.grupoEconomico === filtro.grupoEconomico);
    if (filtro?.search) {
      const s = filtro.search.toLowerCase();
      result = result.filter(e => e.razaoSocial.toLowerCase().includes(s) || e.apelido.toLowerCase().includes(s) || e.cnpj.includes(s) || e.grupoEconomico.toLowerCase().includes(s));
    }
    return result;
  }

  async buscarPorId(id: string) {
    return this.persistence.getById(id) || null;
  }

  async consultar(cnpj: string) {
    const clean = cnpj.replace(/\D/g, '');
    if (!isValidCNPJ(clean)) throw new Error('CNPJ inválido');
    const data = await consultarCNPJ(clean);
    if (!data) throw new Error('CNPJ não encontrado na Receita Federal');
    const filiais = await consultarFiliais(clean);
    return { empresa: data, filiais };
  }

  async criar(dados: {
    cnpj: string; razaoSocial: string; apelido: string;
    porte: string; atividade: string; grupoEconomico?: string;
    equipe: string; tipo: 'Matriz' | 'Filial'; matrizCnpj?: string;
    tipoFechamento: string; diaFechamento: number;
  }) {
    const cleanCNPJ = dados.cnpj.replace(/\D/g, '');
    if (!isValidCNPJ(cleanCNPJ)) throw new Error('CNPJ inválido');

    const todas = this.persistence.getAll();
    if (todas.find(e => e.cnpj.replace(/\D/g, '') === cleanCNPJ)) throw new Error('CNPJ já cadastrado');

    if (dados.tipo === 'Matriz') {
      const hasMatriz = todas.find(e => e.grupoEconomico === dados.grupoEconomico && e.tipo === 'Matriz');
      if (hasMatriz) throw new Error('Grupo econômico já possui matriz cadastrada');
    }

    if (dados.tipo === 'Filial') {
      if (!dados.matrizCnpj) throw new Error('Filial deve estar vinculada a uma matriz');
      const matriz = await consultarCNPJ(dados.matrizCnpj);
      if (!matriz) throw new Error('Matriz não encontrada na Receita Federal');
    }

    const nova: Empresa = {
      id: Math.random().toString(36).substr(2, 9),
      cnpj: formatCNPJ(cleanCNPJ),
      razaoSocial: dados.razaoSocial,
      apelido: dados.apelido,
      porte: dados.porte,
      atividade: dados.atividade,
      grupoEconomico: dados.grupoEconomico || '',
      equipe: dados.equipe,
      tipo: dados.tipo,
      matrizCnpj: dados.matrizCnpj,
      tipoFechamento: dados.tipoFechamento,
      diaFechamento: dados.diaFechamento,
      createdAt: new Date().toISOString().split('T')[0],
    };

    this.persistence.add(nova);
    return nova;
  }

  async atualizar(id: string, dados: Partial<Empresa>) {
    const existente = this.persistence.getById(id);
    if (!existente) throw new Error('Empresa não encontrada');
    if (dados.cnpj) {
      const clean = dados.cnpj.replace(/\D/g, '');
      if (!isValidCNPJ(clean)) throw new Error('CNPJ inválido');
      const dup = this.persistence.getAll().find(e => e.id !== id && e.cnpj.replace(/\D/g, '') === clean);
      if (dup) throw new Error('CNPJ já cadastrado');
    }
    this.persistence.update(id, dados);
    return this.persistence.getById(id);
  }

  async remover(id: string) {
    const ok = this.persistence.delete(id);
    if (!ok) throw new Error('Empresa não encontrada');
  }

  async gruposEconomicos() {
    const fromEmpresas = [...new Set(this.persistence.getAll().map(e => e.grupoEconomico).filter(Boolean))];
    const fromGrupos = this.gruposPersistence.getAll().map(g => g.nome);
    return [...new Set([...fromGrupos, ...fromEmpresas])].sort();
  }

  async criarGrupo(nome: string) {
    if (!nome.trim()) throw new Error('Nome do grupo é obrigatório');
    const existente = this.gruposPersistence.getAll().find(g => g.nome === nome.trim());
    if (existente) throw new Error('Grupo já existe');
    const novo: GrupoEconomico = {
      id: Math.random().toString(36).substr(2, 9),
      nome: nome.trim(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.gruposPersistence.add(novo);
    return novo;
  }

  async vincularFiliais(cnpjMatriz: string) {
    const filiais = await consultarFiliais(cnpjMatriz);
    const todas = this.persistence.getAll();
    const vinculadas: Empresa[] = [];
    for (const f of filiais) {
      const clean = f.cnpj.replace(/\D/g, '');
      if (!todas.find(e => e.cnpj.replace(/\D/g, '') === clean)) {
        const nova: Empresa = {
          id: Math.random().toString(36).substr(2, 9),
          cnpj: f.cnpj,
          razaoSocial: f.razaoSocial,
          apelido: f.nomeFantasia || f.razaoSocial.split(' ')[0],
          porte: f.porte,
          atividade: f.atividade,
          grupoEconomico: '',
          equipe: '',
          tipo: 'Filial',
          matrizCnpj: formatCNPJ(cnpjMatriz),
          tipoFechamento: 'Mensal',
          diaFechamento: 15,
          createdAt: new Date().toISOString().split('T')[0],
        };
        this.persistence.add(nova);
        vinculadas.push(nova);
      }
    }
    return vinculadas;
  }
}
