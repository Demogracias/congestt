import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const DB_DIR = path.resolve(__dirname, '../../../data');
const DB_PATH = path.join(DB_DIR, 'congestt.db');

let instance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (instance) return instance;
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  instance = new Database(DB_PATH);
  instance.pragma('journal_mode = WAL');
  instance.pragma('foreign_keys = ON');
  return instance;
}

export function closeDatabase() {
  if (instance) {
    instance.close();
    instance = null;
  }
}

/** @internal Used by tests to inject an in-memory database */
export function __setInstance(db: Database.Database | null) {
  instance = db;
}

export { Database };
