import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { Pool } = pg;

const lastOrder = {
  id: 'ord_1794818172324_gq2y',
  order_number: 'MC-2026-000035',
  user_id: 'usr_madhurai_company',
  customer_name: 'Naveen',
  customer_email: 'naveen@gmail.com',
  customer_phone: '9110513515',
  delivery_address: 'Naveen, D. NO. 1-0, KONGAL DIBHAPOTUPALEM, EAST GUDUR VILLAGE, GUDUR MANDAL, TIRUPATI DISTRICT - 524101, Andhra Pradesh',
  pincode: '524101',
  zone_name: 'South India Express Hubs',
  subtotal: 190,
  discount_amount: 190,
  coupon_id: 'coup_1793156467578',
  coupon_code: 'SREEKAR',
  delivery_charge: 30,
  is_free_delivery: 0,
  tax_amount: 0,
  total_amount: 30,
  payment_status: 'PAID',
  payment_method: 'RAZORPAY',
  order_status: 'PAYMENT_CONFIRMED',
  cod_collected: 0,
  estimated_min_days: 1,
  estimated_max_days: 2,
  customer_notes: null,
  created_at: '2026-11-16 08:36:12',
  updated_at: '2026-11-16 08:37:51',
  payment_reference: 'pay_U0md5ETQcFc6UG'
};

const lastItem = {
  id: 'item_1794818173176_uqon',
  order_id: 'ord_1794818172324_gq2y',
  product_id: 'prod_1792819116609_lhst',
  product_name_snapshot: 'MADHURAI mini bites',
  selling_unit_snapshot: 'BOX',
  pieces_per_pack_snapshot: 40,
  weight_snapshot: '320g',
  mrp_snapshot: 220,
  price_snapshot: 190,
  quantity: 1,
  total_item_price: 190,
  created_at: '2026-11-16 08:36:12'
};

const lastPayment = {
  id: 'pay_1794818175644_tofh',
  order_id: 'ord_1794818172324_gq2y',
  gateway: 'RAZORPAY',
  gateway_order_id: 'order_U0mbhmGoi9clhf',
  gateway_payment_id: 'pay_U0md5ETQcFc6UG',
  amount: 30,
  currency: 'INR',
  status: 'SUCCESS',
  payment_method: 'RAZORPAY',
  upi_qr_string: null,
  idempotency_key: null,
  raw_response: null,
  created_at: '2026-11-16 08:36:15',
  updated_at: '2026-11-16 08:37:51'
};

async function restoreToPostgres(connectionString) {
  console.log('🔄 Connecting to PostgreSQL (Neon)...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL. Adding order MC-2026-000035 to Orders & Dispatch...');

    await client.query('BEGIN');

    // 1. Insert order
    await client.query(`
      INSERT INTO orders (
        id, order_number, user_id, customer_name, customer_email, customer_phone,
        delivery_address, pincode, zone_name, subtotal, discount_amount, coupon_id,
        coupon_code, delivery_charge, is_free_delivery, tax_amount, total_amount,
        payment_status, payment_method, order_status, cod_collected, estimated_min_days,
        estimated_max_days, customer_notes, payment_reference, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
      ) ON CONFLICT (id) DO UPDATE SET
        payment_status = EXCLUDED.payment_status,
        order_status = EXCLUDED.order_status,
        payment_reference = EXCLUDED.payment_reference
    `, [
      lastOrder.id, lastOrder.order_number, lastOrder.user_id, lastOrder.customer_name,
      lastOrder.customer_email, lastOrder.customer_phone, lastOrder.delivery_address,
      lastOrder.pincode, lastOrder.zone_name, lastOrder.subtotal, lastOrder.discount_amount,
      lastOrder.coupon_id, lastOrder.coupon_code, lastOrder.delivery_charge,
      lastOrder.is_free_delivery, lastOrder.tax_amount, lastOrder.total_amount,
      lastOrder.payment_status, lastOrder.payment_method, lastOrder.order_status,
      lastOrder.cod_collected, lastOrder.estimated_min_days, lastOrder.estimated_max_days,
      lastOrder.customer_notes, lastOrder.payment_reference, lastOrder.created_at,
      lastOrder.updated_at
    ]);

    // 2. Insert item
    await client.query(`
      INSERT INTO order_items (
        id, order_id, product_id, product_name_snapshot, selling_unit_snapshot,
        pieces_per_pack_snapshot, weight_snapshot, mrp_snapshot, price_snapshot,
        quantity, total_item_price, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) ON CONFLICT (id) DO NOTHING
    `, [
      lastItem.id, lastItem.order_id, lastItem.product_id, lastItem.product_name_snapshot,
      lastItem.selling_unit_snapshot, lastItem.pieces_per_pack_snapshot, lastItem.weight_snapshot,
      lastItem.mrp_snapshot, lastItem.price_snapshot, lastItem.quantity,
      lastItem.total_item_price, lastItem.created_at
    ]);

    // 3. Insert payment
    await client.query(`
      INSERT INTO payments (
        id, order_id, gateway, gateway_order_id, gateway_payment_id,
        amount, currency, status, payment_method, upi_qr_string, idempotency_key,
        raw_response, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      ) ON CONFLICT (id) DO NOTHING
    `, [
      lastPayment.id, lastPayment.order_id, lastPayment.gateway, lastPayment.gateway_order_id,
      lastPayment.gateway_payment_id, lastPayment.amount, lastPayment.currency,
      lastPayment.status, lastPayment.payment_method, lastPayment.upi_qr_string,
      lastPayment.idempotency_key, lastPayment.raw_response, lastPayment.created_at,
      lastPayment.updated_at
    ]);

    await client.query('COMMIT');
    client.release();
    console.log('✅ PostgreSQL: Order MC-2026-000035 successfully restored!');

    const check = await pool.query('SELECT order_number, customer_name, total_amount, payment_status, order_status FROM orders WHERE id = $1', [lastOrder.id]);
    console.log('📊 Verified Neon Order Record:', check.rows[0]);

  } catch (err) {
    console.error('❌ PostgreSQL restore error:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

function restoreToSqlite(sqlitePath) {
  console.log(`🔄 Adding order MC-2026-000035 to SQLite at ${sqlitePath}...`);
  if (!fs.existsSync(sqlitePath)) {
    console.log('SQLite file does not exist, skipping.');
    return;
  }

  const db = new DatabaseSync(sqlitePath);
  try {
    db.exec('BEGIN TRANSACTION;');

    const insertOrder = db.prepare(`
      INSERT OR REPLACE INTO orders (
        id, order_number, user_id, customer_name, customer_email, customer_phone,
        delivery_address, pincode, zone_name, subtotal, discount_amount, coupon_id,
        coupon_code, delivery_charge, is_free_delivery, tax_amount, total_amount,
        payment_status, payment_method, order_status, cod_collected, estimated_min_days,
        estimated_max_days, customer_notes, payment_reference, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    insertOrder.run(
      lastOrder.id, lastOrder.order_number, lastOrder.user_id, lastOrder.customer_name,
      lastOrder.customer_email, lastOrder.customer_phone, lastOrder.delivery_address,
      lastOrder.pincode, lastOrder.zone_name, lastOrder.subtotal, lastOrder.discount_amount,
      lastOrder.coupon_id, lastOrder.coupon_code, lastOrder.delivery_charge,
      lastOrder.is_free_delivery, lastOrder.tax_amount, lastOrder.total_amount,
      lastOrder.payment_status, lastOrder.payment_method, lastOrder.order_status,
      lastOrder.cod_collected, lastOrder.estimated_min_days, lastOrder.estimated_max_days,
      lastOrder.customer_notes, lastOrder.payment_reference, lastOrder.created_at,
      lastOrder.updated_at
    );

    const insertItem = db.prepare(`
      INSERT OR REPLACE INTO order_items (
        id, order_id, product_id, product_name_snapshot, selling_unit_snapshot,
        pieces_per_pack_snapshot, weight_snapshot, mrp_snapshot, price_snapshot,
        quantity, total_item_price, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    insertItem.run(
      lastItem.id, lastItem.order_id, lastItem.product_id, lastItem.product_name_snapshot,
      lastItem.selling_unit_snapshot, lastItem.pieces_per_pack_snapshot, lastItem.weight_snapshot,
      lastItem.mrp_snapshot, lastItem.price_snapshot, lastItem.quantity,
      lastItem.total_item_price, lastItem.created_at
    );

    const insertPayment = db.prepare(`
      INSERT OR REPLACE INTO payments (
        id, order_id, gateway, gateway_order_id, gateway_payment_id,
        amount, currency, status, payment_method, upi_qr_string, idempotency_key,
        raw_response, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    insertPayment.run(
      lastPayment.id, lastPayment.order_id, lastPayment.gateway, lastPayment.gateway_order_id,
      lastPayment.gateway_payment_id, lastPayment.amount, lastPayment.currency,
      lastPayment.status, lastPayment.payment_method, lastPayment.upi_qr_string,
      lastPayment.idempotency_key, lastPayment.raw_response, lastPayment.created_at,
      lastPayment.updated_at
    );

    db.exec('COMMIT;');
    console.log('✅ SQLite: Order MC-2026-000035 successfully restored!');

    const check = db.prepare('SELECT order_number, customer_name, total_amount, payment_status, order_status FROM orders WHERE id = ?').get(lastOrder.id);
    console.log('📊 Verified SQLite Order Record:', check);
  } catch (err) {
    console.error('❌ SQLite restore error:', err.message);
    try { db.exec('ROLLBACK;'); } catch (e) {}
    throw err;
  } finally {
    db.close();
  }
}

async function run() {
  const sqliteFile = path.resolve(__dirname, '../../database/madhurai_chocolate.sqlite');
  restoreToSqlite(sqliteFile);

  const neonUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ar3QNgTPIFM4@ep-crimson-lake-b4z0dddm-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';
  if (neonUrl && neonUrl.startsWith('postgres')) {
    await restoreToPostgres(neonUrl);
  }
}

run()
  .then(() => {
    console.log('🎉 Last order details successfully restored into Orders & Dispatch!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to restore order:', err);
    process.exit(1);
  });
