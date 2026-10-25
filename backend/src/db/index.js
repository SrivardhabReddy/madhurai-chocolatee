import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

let pgPool = null;
let sqliteDb = null;
let activeEngine = 'sqlite'; // 'postgres' | 'sqlite'

// Initialize database connection
export async function initDatabase() {
  const dbUrl = config.databaseUrl.trim();
  
  if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
    try {
      pgPool = new Pool({
        connectionString: dbUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      // Test connection
      const client = await pgPool.connect();
      await client.query('SELECT NOW()');
      client.release();
      activeEngine = 'postgres';
      console.log('✅ Connected to PostgreSQL database successfully.');
      return;
    } catch (err) {
      console.warn('⚠️ PostgreSQL connection failed:', err.message);
      console.log('🔄 Falling back to embedded relational SQLite database for zero-config operation.');
    }
  }

  // SQLite Fallback
  const dbDir = path.resolve(__dirname, '../../../database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const sqliteFile = path.join(dbDir, 'madhurai_chocolate.sqlite');
  sqliteDb = new DatabaseSync(sqliteFile);
  activeEngine = 'sqlite';
  console.log(`✅ Using embedded database at: ${sqliteFile}`);
}

// Convert params between Postgres ($1, $2) and SQLite (?)
function normalizeSql(sql, targetEngine) {
  if (targetEngine === 'sqlite') {
    // Replace $1, $2, ... with ?
    return sql.replace(/\$[0-9]+/g, '?');
  } else {
    // Replace ? with $1, $2, ...
    let paramIndex = 1;
    return sql.replace(/\?/g, () => `$${paramIndex++}`);
  }
}

// Unified query wrapper
export async function query(sql, params = []) {
  if (activeEngine === 'postgres') {
    const normalizedSql = normalizeSql(sql, 'postgres');
    const result = await pgPool.query(normalizedSql, params);
    return { rows: result.rows, rowCount: result.rowCount };
  } else {
    const normalizedSql = normalizeSql(sql, 'sqlite');
    try {
      const stmt = sqliteDb.prepare(normalizedSql);
      const isSelect = /^\s*(SELECT|PRAGMA)/i.test(normalizedSql);
      if (isSelect) {
        const rows = stmt.all(...params);
        return { rows, rowCount: rows.length };
      } else {
        const info = stmt.run(...params);
        return { rows: [], rowCount: info.changes, lastInsertRowid: info.lastInsertRowid };
      }
    } catch (err) {
      console.error(`Database error on SQL: "${normalizedSql}"`, err);
      throw err;
    }
  }
}

// Return first row or null
export async function get(sql, params = []) {
  const result = await query(sql, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}

// Return all rows
export async function all(sql, params = []) {
  const result = await query(sql, params);
  return result.rows;
}

// Run multi-statement script (DDL / migrations)
export async function exec(sql) {
  if (activeEngine === 'postgres') {
    await pgPool.query(sql);
  } else {
    sqliteDb.exec(sql);
  }
}

// Execute transaction
export async function transaction(callback) {
  if (activeEngine === 'postgres') {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const tx = {
        query: async (sql, params = []) => {
          const normalized = normalizeSql(sql, 'postgres');
          return await client.query(normalized, params);
        },
        get: async (sql, params = []) => {
          const normalized = normalizeSql(sql, 'postgres');
          const res = await client.query(normalized, params);
          return res.rows.length > 0 ? res.rows[0] : null;
        },
        all: async (sql, params = []) => {
          const normalized = normalizeSql(sql, 'postgres');
          const res = await client.query(normalized, params);
          return res.rows;
        }
      };
      const result = await callback(tx);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    sqliteDb.exec('BEGIN TRANSACTION');
    try {
      const tx = {
        query: async (sql, params = []) => {
          const normalized = normalizeSql(sql, 'sqlite');
          const stmt = sqliteDb.prepare(normalized);
          const isSelect = /^\s*(SELECT|PRAGMA)/i.test(normalized);
          if (isSelect) {
            const rows = stmt.all(...params);
            return { rows, rowCount: rows.length };
          } else {
            const info = stmt.run(...params);
            return { rows: [], rowCount: info.changes };
          }
        },
        get: async (sql, params = []) => {
          const normalized = normalizeSql(sql, 'sqlite');
          const stmt = sqliteDb.prepare(normalized);
          return stmt.get(...params) || null;
        },
        all: async (sql, params = []) => {
          const normalized = normalizeSql(sql, 'sqlite');
          const stmt = sqliteDb.prepare(normalized);
          return stmt.all(...params);
        }
      };
      const result = await callback(tx);
      sqliteDb.exec('COMMIT');
      return result;
    } catch (err) {
      sqliteDb.exec('ROLLBACK');
      throw err;
    }
  }
}

export function getEngine() {
  return activeEngine;
}

export default {
  initDatabase,
  query,
  get,
  all,
  exec,
  transaction,
  getEngine
};
