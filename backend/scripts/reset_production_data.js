import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetPostgres(connectionString) {
  console.log('🔄 Connecting to PostgreSQL (Neon)...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL. Resetting transactional & test data...');

    await client.query('BEGIN');

    // 1. Clear test orders & order items
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM orders');

    // 2. Clear payments, payment events & refunds
    await client.query('DELETE FROM refunds');
    await client.query('DELETE FROM payment_events');
    await client.query('DELETE FROM payments');

    // 3. Clear shopping carts & cart items
    await client.query('DELETE FROM cart_items');
    await client.query('DELETE FROM carts');

    // 4. Clear visitor traffic tracking logs
    await client.query('DELETE FROM site_visits');

    // 5. Clear inventory transactions & reset reserved stock
    await client.query('DELETE FROM inventory_transactions');
    await client.query('UPDATE inventory SET reserved_stock = 0');

    // 6. Reset coupon usage
    await client.query('DELETE FROM coupon_usage');
    await client.query('UPDATE coupons SET usage_count = 0');

    // 7. Clear audit logs & notifications
    await client.query('DELETE FROM audit_logs');
    await client.query('DELETE FROM notifications');

    // 8. Delete test customer accounts, keep admin accounts
    await client.query("DELETE FROM addresses WHERE user_id IN (SELECT id FROM users WHERE role = 'CUSTOMER')");
    await client.query("DELETE FROM users WHERE role = 'CUSTOMER'");

    await client.query('COMMIT');
    client.release();
    console.log('✅ PostgreSQL reset complete! All previous test orders, payments, visits, and carts cleared to 0.');

    // Verification check
    const checkOrders = await pool.query('SELECT COUNT(*) as c FROM orders');
    const checkVisits = await pool.query('SELECT COUNT(*) as c FROM site_visits');
    const checkPayments = await pool.query('SELECT COUNT(*) as c FROM payments');
    console.log(`📊 Verified PostgreSQL State: orders=${checkOrders.rows[0].c}, visits=${checkVisits.rows[0].c}, payments=${checkPayments.rows[0].c}`);

  } catch (err) {
    console.error('❌ PostgreSQL reset failed:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

function resetSqlite(sqlitePath) {
  console.log(`🔄 Resetting SQLite at ${sqlitePath}...`);
  if (!fs.existsSync(sqlitePath)) {
    console.log('SQLite file does not exist, skipping.');
    return;
  }

  const db = new DatabaseSync(sqlitePath);
  try {
    db.exec('BEGIN TRANSACTION;');

    db.exec('DELETE FROM order_items;');
    db.exec('DELETE FROM orders;');
    db.exec('DELETE FROM refunds;');
    db.exec('DELETE FROM payment_events;');
    db.exec('DELETE FROM payments;');
    db.exec('DELETE FROM cart_items;');
    db.exec('DELETE FROM carts;');
    db.exec('DELETE FROM site_visits;');
    db.exec('DELETE FROM inventory_transactions;');
    db.exec('UPDATE inventory SET reserved_stock = 0;');
    db.exec('DELETE FROM coupon_usage;');
    db.exec('UPDATE coupons SET usage_count = 0;');
    db.exec('DELETE FROM audit_logs;');
    db.exec('DELETE FROM notifications;');
    db.exec("DELETE FROM addresses WHERE user_id IN (SELECT id FROM users WHERE role = 'CUSTOMER');");
    db.exec("DELETE FROM users WHERE role = 'CUSTOMER';");

    db.exec('COMMIT;');
    console.log('✅ SQLite reset complete!');

    const ordCount = db.prepare('SELECT COUNT(*) as c FROM orders').get();
    const visCount = db.prepare('SELECT COUNT(*) as c FROM site_visits').get();
    console.log(`📊 Verified SQLite State: orders=${ordCount.c}, visits=${visCount.c}`);
  } catch (err) {
    console.error('❌ SQLite reset error:', err.message);
    try { db.exec('ROLLBACK;'); } catch (e) {}
    throw err;
  } finally {
    db.close();
  }
}

async function run() {
  const sqliteFile = path.resolve(__dirname, '../../database/madhurai_chocolate.sqlite');
  resetSqlite(sqliteFile);

  const neonUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ar3QNgTPIFM4@ep-crimson-lake-b4z0dddm-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';
  if (neonUrl && neonUrl.startsWith('postgres')) {
    await resetPostgres(neonUrl);
  }
}

run()
  .then(() => {
    console.log('🎉 Full data reset finished successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to complete reset:', err);
    process.exit(1);
  });
