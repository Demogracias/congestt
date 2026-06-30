import { describe, it, expect } from 'vitest';
import { SqlitePersistence, generateId } from '../database/SqlitePersistence';

interface TestItem { id: string; nome: string; valor: number; createdAt: string }

describe('SqlitePersistence', () => {
  it('add e getAll retornam itens corretamente', async () => {
    const repo = new SqlitePersistence<TestItem>('test_items');
    const item: TestItem = { id: generateId(), nome: 'Teste', valor: 42, createdAt: new Date().toISOString() };
    await repo.add(item);
    const all = repo.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].nome).toBe('Teste');
    expect(all[0].valor).toBe(42);
  });

  it('getById retorna undefined para id inexistente', () => {
    const repo = new SqlitePersistence<TestItem>('test_items2');
    const found = repo.getById('nonexistent');
    expect(found).toBeUndefined();
  });

  it('update modifica apenas campos fornecidos', async () => {
    const repo = new SqlitePersistence<TestItem>('test_items3');
    const item: TestItem = { id: generateId(), nome: 'Original', valor: 10, createdAt: new Date().toISOString() };
    await repo.add(item);
    await repo.update(item.id, { valor: 99 });
    const updated = repo.getById(item.id)!;
    expect(updated.nome).toBe('Original');
    expect(updated.valor).toBe(99);
  });

  it('delete remove item e retorna true', async () => {
    const repo = new SqlitePersistence<TestItem>('test_items4');
    const item: TestItem = { id: generateId(), nome: 'DeleteMe', valor: 0, createdAt: new Date().toISOString() };
    await repo.add(item);
    const deleted = await repo.delete(item.id);
    expect(deleted).toBe(true);
    expect(repo.getById(item.id)).toBeUndefined();
  });

  it('delete retorna false para id inexistente', async () => {
    const repo = new SqlitePersistence<TestItem>('test_items5');
    const result = await repo.delete('ghost');
    expect(result).toBe(false);
  });

  it('count retorna quantidade correta', async () => {
    const repo = new SqlitePersistence<TestItem>('test_items6');
    expect(repo.count()).toBe(0);
    await repo.add({ id: generateId(), nome: 'A', valor: 1, createdAt: '' });
    await repo.add({ id: generateId(), nome: 'B', valor: 2, createdAt: '' });
    expect(repo.count()).toBe(2);
  });
});
