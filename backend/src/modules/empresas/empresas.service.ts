import { SqlitePersistence, generateId } from '../../database/SqlitePersistence';
import { isValidCNPJ, formatCNPJ } from '../../utils/cnpj';
import { consultarCNPJ, consultarFiliais } from '../../utils/receita-api';
import { ValidationError, NotFoundError } from '../../utils/errors';

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
  private persistence = new SqlitePersistence<Empresa>('empresas');
  private gruposPersistence = new SqlitePersistence<GrupoEconomico>('grupos_economicos');

  async listar(filtro?: { porte?: string; equipe?: string; atividade?: string; grupoEconomico?: string; search?: string; page?: number; pageSize?: number }) {
    let result = this.persistence.getAll();
    if (filtro?.porte && filtro.porte !== 'Todos') result = result.filter(e => e.porte === filtro.porte);
    if (filtro?.atividade && filtro.atividade !== 'Todos') result = result.filter(e => e.atividade === filtro.atividade);
    if (filtro?.equipe && filtro.equipe !== 'Todas') result = result.filter(e => e.equipe === filtro.equipe);
    if (filtro?.grupoEconomico && filtro.grupoEconomico !== 'Todos') result = result.filter(e => e.grupoEconomico === filtro.grupoEconomico);
    if (filtro?.search) {
      const s = filtro.search.toLowerCase();
      result = result.filter(e => e.razaoSocial.toLowerCase().includes(s) || e.apelido.toLowerCase().includes(s) || e.cnpj.includes(s) || e.grupoEconomico.toLowerCase().includes(s));
    }
    if (filtro?.page || filtro?.pageSize) {
      const total = result.length;
      const page = Math.max(1, filtro.page || 1);
      const pageSize = Math.min(200, Math.max(1, filtro.pageSize || 100));
      const start = (page - 1) * pageSize;
      const data = result.slice(start, start + pageSize);
      return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) } as any;
    }
    return result;
  }

  async buscarPorId(id: string) {
    const e = this.persistence.getById(id);
    if (!e) throw new NotFoundError('Empresa não encontrada');
    return e;
  }

  async consultar(cnpj: string) {
    const clean = cnpj.replace(/\D/g, '');
    if (!isValidCNPJ(clean)) throw new ValidationError('CNPJ inválido');
    const data = await consultarCNPJ(clean);
    if (!data) throw new NotFoundError('CNPJ não encontrado na Receita Federal');
    const filiais = await consultarFiliais(clean);
    return { empresa: data, filiais };
  }

  async criar(dados: {
    cnpj: string; razaoSocial: string; apelido?: string;
    porte?: string; atividade?: string; grupoEconomico?: string;
    equipe?: string; tipo?: 'Matriz' | 'Filial'; matrizCnpj?: string;
    tipoFechamento?: string; diaFechamento?: number;
  }) {
    const cleanCNPJ = dados.cnpj.replace(/\D/g, '');
    if (!isValidCNPJ(cleanCNPJ)) throw new ValidationError('CNPJ inválido');

    const todas = this.persistence.getAll();
    if (todas.find(e => e.cnpj.replace(/\D/g, '') === cleanCNPJ)) throw new ValidationError('CNPJ já cadastrado');

    if (dados.tipo === 'Matriz') {
      const ge = (dados.grupoEconomico || '').toLowerCase();
      const hasMatriz = todas.find(e => (e.grupoEconomico || '').toLowerCase() === ge && e.tipo === 'Matriz');
      if (hasMatriz && dados.grupoEconomico) throw new ValidationError('Grupo econômico já possui matriz cadastrada');
    }

    if (dados.tipo === 'Filial') {
      if (!dados.matrizCnpj) throw new ValidationError('Filial deve estar vinculada a uma matriz');
      const matrizLocal = todas.find(e => e.cnpj.replace(/\D/g, '') === dados.matrizCnpj!.replace(/\D/g, '') && e.tipo === 'Matriz');
      if (!matrizLocal) throw new ValidationError('Matriz não encontrada no sistema. Cadastre a matriz primeiro.');
    }

    const nova: Empresa = {
      id: generateId(),
      cnpj: formatCNPJ(cleanCNPJ),
      razaoSocial: dados.razaoSocial,
      apelido: dados.apelido || dados.razaoSocial.split(' ')[0],
      porte: dados.porte || 'Pequeno',
      atividade: dados.atividade || 'Serviço',
      grupoEconomico: dados.grupoEconomico || '',
      equipe: dados.equipe || '',
      tipo: dados.tipo || 'Matriz',
      matrizCnpj: dados.matrizCnpj,
      tipoFechamento: dados.tipoFechamento || 'Mensal',
      diaFechamento: dados.diaFechamento || 15,
      createdAt: new Date().toISOString().split('T')[0],
    };

    await this.persistence.add(nova);
    return nova;
  }

  async atualizar(id: string, dados: Partial<Empresa>) {
    const existente = this.persistence.getById(id);
    if (!existente) throw new NotFoundError('Empresa não encontrada');
    if (dados.cnpj) {
      const clean = dados.cnpj.replace(/\D/g, '');
      if (!isValidCNPJ(clean)) throw new ValidationError('CNPJ inválido');
      const dup = this.persistence.getAll().find(e => e.id !== id && e.cnpj.replace(/\D/g, '') === clean);
      if (dup) throw new ValidationError('CNPJ já cadastrado');
    }
    await this.persistence.update(id, dados);
    return this.persistence.getById(id);
  }

  async remover(id: string) {
    const ok = await this.persistence.delete(id);
    if (!ok) throw new NotFoundError('Empresa não encontrada');
  }

  async gruposEconomicos() {
    const fromEmpresas = [...new Set(this.persistence.getAll().map(e => e.grupoEconomico).filter(Boolean))];
    const fromGrupos = this.gruposPersistence.getAll().map(g => g.nome);
    return [...new Set([...fromGrupos, ...fromEmpresas])].sort();
  }

  async criarGrupo(nome: string) {
    if (!nome?.trim()) throw new ValidationError('Nome do grupo é obrigatório');
    const existente = this.gruposPersistence.getAll().find(g => g.nome === nome.trim());
    if (existente) throw new ValidationError('Grupo já existe');
    const novo: GrupoEconomico = {
      id: generateId(),
      nome: nome.trim(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    await this.gruposPersistence.add(novo);
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
          id: generateId(),
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
        await this.persistence.add(nova);
        vinculadas.push(nova);
      }
    }
    return vinculadas;
  }
}
