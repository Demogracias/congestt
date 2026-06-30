import { z } from 'zod';

const portes = ['Micro', 'Pequeno', 'Médio', 'Grande'] as const;
const atividades = ['Indústria', 'Serviço', 'Comércio'] as const;
const tipos = ['Matriz', 'Filial'] as const;
const fechamentos = ['Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual', 'Sem Movimento'] as const;

export const criarEmpresaSchema = z.object({
  cnpj: z.string().min(1, 'CNPJ obrigatório'),
  razaoSocial: z.string().min(1, 'Razão social obrigatória'),
  apelido: z.string().optional(),
  porte: z.enum(portes).optional(),
  atividade: z.enum(atividades).optional(),
  grupoEconomico: z.string().optional(),
  equipe: z.string().optional(),
  tipo: z.enum(tipos).optional(),
  matrizCnpj: z.string().optional(),
  tipoFechamento: z.enum(fechamentos).optional(),
  diaFechamento: z.number().min(1).max(31).optional(),
});

export const atualizarEmpresaSchema = criarEmpresaSchema.partial();

export const listarEmpresasSchema = z.object({
  porte: z.string().optional(),
  equipe: z.string().optional(),
  atividade: z.string().optional(),
  grupoEconomico: z.string().optional(),
  search: z.string().optional(),
});
