import { getDatabase } from './Database';
import * as crypto from 'crypto';

export function generateId(): string {
  return crypto.randomUUID();
}

export class SqlitePersistence<T extends { id: string }> {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
    getDatabase().exec(`CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
  }

  getAll(): T[] {
    const db = getDatabase();
    const rows = db.prepare(`SELECT data FROM \`${this.tableName}\``).all() as { data: string }[];
    return rows.map(r => JSON.parse(r.data));
  }

  getById(id: string): T | undefined {
    const db = getDatabase();
    const row = db.prepare(`SELECT data FROM \`${this.tableName}\` WHERE id = ?`).get(id) as { data: string } | undefined;
    return row ? JSON.parse(row.data) : undefined;
  }

  async add(item: T): Promise<T> {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`INSERT OR REPLACE INTO \`${this.tableName}\` (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)`).run(item.id, JSON.stringify(item), now, now);
    return item;
  }

  async update(id: string, updates: Partial<T>): Promise<T | undefined> {
    const db = getDatabase();
    const existing = db.prepare(`SELECT data FROM \`${this.tableName}\` WHERE id = ?`).get(id) as { data: string } | undefined;
    if (!existing) return undefined;
    const merged = { ...JSON.parse(existing.data), ...updates };
    const now = new Date().toISOString();
    db.prepare(`UPDATE \`${this.tableName}\` SET data = ?, updated_at = ? WHERE id = ?`).run(JSON.stringify(merged), now, id);
    return merged as T;
  }

  async delete(id: string): Promise<boolean> {
    const db = getDatabase();
    const result = db.prepare(`DELETE FROM \`${this.tableName}\` WHERE id = ?`).run(id);
    return result.changes > 0;
  }

  count(): number {
    const db = getDatabase();
    const row = db.prepare(`SELECT COUNT(*) as count FROM \`${this.tableName}\``).get() as { count: number };
    return row.count;
  }
}
