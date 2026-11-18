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

  // Safely ensure dispatch and payment reference columns exist on orders table
  const columnsToAdd = [
    { name: 'courier_name', type: 'TEXT' },
    { name: 'tracking_number', type: 'TEXT' },
    { name: 'tracking_url', type: 'TEXT' },
    { name: 'dispatch_date', type: 'TEXT' },
    { name: 'dispatch_notes', type: 'TEXT' },
    { name: 'dispatched_by', type: 'TEXT' },
    { name: 'payment_reference', type: 'TEXT' }
  ];

  for (const col of columnsToAdd) {
    try {
      await exec(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`);
    } catch (e) {
      // Column already exists or table updated
    }
  }

  // Ensure min_discount_amount column exists on coupons table
  try {
    await exec(`ALTER TABLE coupons ADD COLUMN min_discount_amount REAL DEFAULT 0`);
  } catch (e) {
    // Column already exists
  }

  // Ensure site_visits table and indexes exist
  try {
    await exec(`
      CREATE TABLE IF NOT EXISTS site_visits (
        id TEXT PRIMARY KEY,
        visitor_id TEXT NOT NULL,
        session_id TEXT,
        page_path TEXT NOT NULL DEFAULT '/',
        page_title TEXT,
        referrer TEXT,
        user_agent TEXT,
        device_type TEXT DEFAULT 'DESKTOP',
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await exec(`CREATE INDEX IF NOT EXISTS idx_site_visits_created ON site_visits(created_at);`);
    await exec(`CREATE INDEX IF NOT EXISTS idx_site_visits_visitor ON site_visits(visitor_id);`);
    await exec(`CREATE INDEX IF NOT EXISTS idx_site_visits_page ON site_visits(page_path);`);
  } catch (e) {
    // Already created
  }

  // Backfill historical visits from existing orders if site_visits is empty
  try {
    const existingVisits = await db.get('SELECT COUNT(*) as c FROM site_visits');
    if (!existingVisits || parseInt(existingVisits.c, 10) === 0) {
      const pastOrders = await db.all('SELECT id, customer_phone, user_id, created_at FROM orders');
      if (pastOrders && pastOrders.length > 0) {
        for (const ord of pastOrders) {
          const visId = ord.customer_phone ? `vis_phone_${ord.customer_phone}` : (ord.user_id ? `vis_usr_${ord.user_id}` : `vis_ord_${ord.id}`);
          const visitId1 = `vis_hist_home_${ord.id}`;
          const visitId2 = `vis_hist_chk_${ord.id}`;
          await db.query(
            `INSERT INTO site_visits (id, visitor_id, session_id, page_path, page_title, device_type, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [visitId1, visId, `sess_${ord.id}`, '/', 'Madhurai Chocolates', 'MOBILE', ord.created_at || new Date().toISOString()]
          );
          await db.query(
            `INSERT INTO site_visits (id, visitor_id, session_id, page_path, page_title, device_type, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [visitId2, visId, `sess_${ord.id}`, `/order-success/${ord.id}`, 'Order Confirmed - Madhurai Chocolates', 'MOBILE', ord.created_at || new Date().toISOString()]
          );
        }
      }
    }
  } catch (e) {
    // Ignore historical backfill if already handled
  }

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
