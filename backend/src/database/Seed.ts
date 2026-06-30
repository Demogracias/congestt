import * as fs from 'fs';
import * as path from 'path';
import { getDatabase } from './Database';

const DATA_DIR = path.resolve(__dirname, '../../../data');

const TABLES: string[] = [
  'users', 'empresas', 'grupos_economicos', 'equipes', 'atividades',
  'contas_contabeis', 'fechamentos_contabeis', 'fechamentos_historico',
  'auditoria', 'consentimentos', 'anonimizacoes',
];

interface JsonFile {
  tableName: string;
  fileName: string;
}

const JSON_FILES: JsonFile[] = [
  { tableName: 'users', fileName: 'users.json' },
  { tableName: 'empresas', fileName: 'empresas.json' },
  { tableName: 'grupos_economicos', fileName: 'grupos.json' },
  { tableName: 'equipes', fileName: 'equipes.json' },
  { tableName: 'atividades', fileName: 'planner.json' },
  { tableName: 'contas_contabeis', fileName: 'contas.json' },
  { tableName: 'fechamentos_contabeis', fileName: 'fechamentos.json' },
  { tableName: 'fechamentos_historico', fileName: 'fechamentos_historico.json' },
  { tableName: 'auditoria', fileName: 'audit.json' },
  { tableName: 'consentimentos', fileName: 'consentimentos.json' },
  { tableName: 'anonimizacoes', fileName: 'anonimizacoes.json' },
];

export function runSeed() {
  const db = getDatabase();

  for (const tableName of TABLES) {
    db.exec(`CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
  }

  for (const { tableName, fileName } of JSON_FILES) {
    const filePath = path.join(DATA_DIR, fileName);
    if (!fs.existsSync(filePath)) continue;

    const row = db.prepare(`SELECT COUNT(*) as count FROM \`${tableName}\``).get() as { count: number };
    if (row.count > 0) continue;

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      if (!Array.isArray(data) || data.length === 0) continue;

      const stmt = db.prepare(`INSERT OR IGNORE INTO \`${tableName}\` (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)`);
      const insertMany = db.transaction((items: any[]) => {
        for (const item of items) {
          if (!item.id) continue;
          const now = item.createdAt || new Date().toISOString();
          stmt.run(item.id, JSON.stringify(item), now, now);
        }
      });
      insertMany(data);
      console.info(`[Seed] Migrados ${data.length} registros de ${fileName} para ${tableName}`);
    } catch (e) {
      console.error(`[Seed] Erro ao migrar ${fileName}:`, e);
    }
  }
}
