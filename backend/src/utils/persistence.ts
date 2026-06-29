import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.resolve(__dirname, '../../../data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {
      console.error('[Persistence] Erro ao criar diretório:', e);
    }
  }
}

export class Persistence<T extends { id: string }> {
  private filePath: string;
  private data: T[];
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(filename: string, defaults: T[] = []) {
    ensureDir();
    this.filePath = path.join(DATA_DIR, filename);
    this.data = this.load(defaults);
  }

  private load(defaults: T[]): T[] {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        console.error(`[Persistence] ${this.filePath} has invalid format (expected array), resetting to defaults`);
      }
    } catch (e) {
      console.error(`[Persistence] Error reading ${this.filePath}:`, e);
    }
    const copy = JSON.parse(JSON.stringify(defaults));
    this.flushSync(copy);
    return copy;
  }

  private flushSync(data?: T[]) {
    try {
      ensureDir();
      const tmp = this.filePath + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(data ?? this.data, null, 2));
      fs.renameSync(tmp, this.filePath);
    } catch (e) {
      console.error(`[Persistence] Error writing ${this.filePath}:`, e);
    }
  }

  private async flush(data?: T[]) {
    this.writeQueue = this.writeQueue.then(() => {
      this.flushSync(data);
    });
    return this.writeQueue;
  }

  getAll(): T[] { return [...this.data]; }

  getById(id: string): T | undefined {
    return this.data.find(item => item.id === id);
  }

  async add(item: T): Promise<T> {
    this.data.push(item);
    await this.flush();
    return item;
  }

  async update(id: string, updates: Partial<T>): Promise<T | undefined> {
    const idx = this.data.findIndex(item => item.id === id);
    if (idx === -1) return undefined;
    this.data[idx] = { ...this.data[idx], ...updates };
    await this.flush();
    return this.data[idx];
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.data.findIndex(item => item.id === id);
    if (idx === -1) return false;
    this.data.splice(idx, 1);
    await this.flush();
    return true;
  }
}
