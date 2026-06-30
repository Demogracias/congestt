import { z } from 'zod';

export const criarTarefaSchema = z.object({
  titulo: z.string().min(1, 'Título obrigatório'),
  descricao: z.string().optional(),
  responsaveis: z.array(z.string()).optional(),
  meses: z.array(z.string()).optional(),
  empresaId: z.string().optional(),
  contaContabilIds: z.array(z.string()).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  recorrencia: z.object({
    tipo: z.enum(['semanal', 'mensal', 'anual']),
    intervalo: z.number().min(1),
  }).optional(),
});

export const listarTarefasSchema = z.object({
  empresaId: z.string().optional(),
  equipe: z.string().optional(),
  mes: z.string().optional(),
  status: z.string().optional(),
  responsavel: z.string().optional(),
});

export const pausarTarefaSchema = z.object({
  justificativa: z.string().min(3, 'Justificativa deve ter no mínimo 3 caracteres'),
  tipo: z.enum(['pausa', 'fim_expediente']),
});

export const iniciarTarefaSchema = z.object({
  usuarioId: z.string().min(1, 'usuárioId obrigatório'),
});
