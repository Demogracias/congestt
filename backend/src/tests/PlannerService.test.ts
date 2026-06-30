import { describe, it, expect, beforeEach } from 'vitest';
import { PlannerService } from '../modules/planner/planner.service';
import { SqlitePersistence } from '../database/SqlitePersistence';

async function createTask(service: PlannerService, overrides: any = {}) {
  return service.criar({
    titulo: overrides.titulo || 'Tarefa Teste',
    descricao: 'Descrição teste',
    responsaveis: overrides.responsaveis || ['1'],
    meses: overrides.meses || ['2026-07'],
    dataInicio: '2026-07-01',
    dataFim: '2026-07-31',
    empresaId: overrides.empresaId || '1',
    contaContabilIds: overrides.contaContabilIds || ['c3'],
    ...overrides,
  });
}

describe('PlannerService', () => {
  let service: PlannerService;

  beforeEach(async () => {
    service = new PlannerService();
    const all = await service.listar();
    for (const a of all) {
      const repo = new SqlitePersistence<any>('atividades');
      await repo.delete(a.id);
    }
  });

  it('cria tarefa com status pending', async () => {
    const t = await createTask(service);
    expect(t.status).toBe('pending');
    expect(t.titulo).toBe('Tarefa Teste');
    expect(t.onTime).toBe(true);
    expect(t.responsaveis).toEqual(['1']);
  });

  it('iniciarTimer altera status para running', async () => {
    const t = await createTask(service);
    const started = await service.iniciarTimer(t.id, '1');
    expect(started!.status).toBe('running');
    expect(started!.timerStart).toBeTruthy();
  });

  it('pausarTimer altera status para paused e registra pausa', async () => {
    const t = await createTask(service);
    await service.iniciarTimer(t.id, '1');
    const paused = await service.pausarTimer(t.id, 'Reunião de alinhamento', 'pausa');
    expect(paused!.status).toBe('paused');
    expect(paused!.pausas).toHaveLength(1);
    expect(paused!.pausas[0].justificativa).toBe('Reunião de alinhamento');
    expect(paused!.pausas[0].tipo).toBe('pausa');
  });

  it('pausarTimer com fim_expediente não exige justificativa longa', async () => {
    const t = await createTask(service);
    await service.iniciarTimer(t.id, '1');
    const paused = await service.pausarTimer(t.id, 'Fim de expediente', 'fim_expediente');
    expect(paused!.status).toBe('paused');
    expect(paused!.pausas[0].tipo).toBe('fim_expediente');
  });

  it('pausarTimer com justificativa curta deve lançar erro', async () => {
    const t = await createTask(service);
    await service.iniciarTimer(t.id, '1');
    await expect(service.pausarTimer(t.id, 'ab', 'pausa')).rejects.toThrow();
  });

  it('retomarTimer altera status para running e registra fim da pausa', async () => {
    const t = await createTask(service);
    await service.iniciarTimer(t.id, '1');
    await service.pausarTimer(t.id, 'Almoço', 'pausa');
    const resumed = await service.retomarTimer(t.id, 'normal');
    expect(resumed!.status).toBe('running');
    expect(resumed!.pausas[0].fim).toBeTruthy();
  });

  it('concluir altera status para completed e registra conclusão', async () => {
    const t = await createTask(service);
    await service.iniciarTimer(t.id, '1');
    const completed = await service.concluir(t.id);
    expect(completed!.status).toBe('completed');
    expect(completed!.concluidaEm).toBeTruthy();
    expect(completed!.historico.some((h: any) => h.acao === 'concluida')).toBe(true);
  });

  it('lista tarefas por empresaId', async () => {
    await createTask(service, { empresaId: '1' });
    await createTask(service, { empresaId: '2' });
    const list1 = await service.listar({ empresaId: '1' });
    expect(list1.every(a => a.empresaId === '1')).toBe(true);
  });

  it('não permite iniciar tarefa já concluída', async () => {
    const t = await createTask(service);
    await service.iniciarTimer(t.id, '1');
    await service.concluir(t.id);
    await expect(service.iniciarTimer(t.id, '1')).rejects.toThrow('já concluída');
  });
});
