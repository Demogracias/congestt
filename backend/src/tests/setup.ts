import { beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import * as dbModule from '../database/Database';

let memDb: Database.Database;

beforeAll(() => {
  memDb = new Database(':memory:');
  memDb.pragma('journal_mode = WAL');
  (dbModule as any).__setInstance(memDb);
});

afterAll(() => {
  if (memDb) memDb.close();
});
