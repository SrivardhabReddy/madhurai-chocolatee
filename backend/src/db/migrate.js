import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initDatabase, exec } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  await initDatabase();
  console.log('🔄 Running database migrations...');
  
  const migrationPath = path.resolve(__dirname, '../../../database/migrations/001_initial_schema.sql');
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found at: ${migrationPath}`);
  }
  
  const sql = fs.readFileSync(migrationPath, 'utf8');
  await exec(sql);
  console.log('✅ Database schema verified and up to date.');
}

// Allow direct CLI execution: node src/db/migrate.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      console.log('🏁 Migrations completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}
