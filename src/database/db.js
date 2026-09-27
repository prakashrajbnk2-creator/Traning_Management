import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve db path
const resolvedDbPath = path.isAbsolute(config.dbPath)
  ? config.dbPath
  : path.resolve(__dirname, '../../', config.dbPath);

export const db = new Database(resolvedDbPath);

// Enable foreign key constraints and WAL mode
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

export default db;
