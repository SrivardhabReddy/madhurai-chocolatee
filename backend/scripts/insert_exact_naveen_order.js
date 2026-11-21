import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { Pool } = pg;

const exactOrder = {
  id: 'ord_1795138427292_nv37',
  order_number: 'MC-2026-000037',
  user_id: 'usr_madhurai_company',
  customer_name: 'G vishnu Naveen',
  customer_email: 'vishnunaveen788@gmail.com',
  customer_phone: '9490771572',
  delivery_address: 'Near Sivalayam Pujari Street, 1-2-529, 1-2-529 Near Sivalayam Pujari Street, Near Sivalayam Pujari Street, 1-2-529, Landmark: N/A, Nellore, SPSR Nellore, Andhra Pradesh - 524002',
  pincode: '524002',
  zone_name: 'South India Express Hubs',
  subtotal: 380,
  discount_amount: 0,
  coupon_id: null,
  coupon_code: null,
  delivery_charge: 10,
  is_free_delivery: 0,
  tax_amount: 0,
  total_amount: 390,
  payment_status: 'PENDING',
  payment_method: 'RAZORPAY',
  order_status: 'ORDER_PLACED',
  cod_collected: 0,
  estimated_min_days: 1,
  estimated_max_days: 2,
  customer_notes: null,
  payment_reference: null,
  created_at: '2026-11-20 06:40:00',
  updated_at: '2026-11-20 06:40:00',
  courier_name: null,
  tracking_number: null,
  tracking_url: null,
  dispatch_date: null,
  dispatch_notes: null,
  dispatched_by: null
};

const exactItem = {
  id: 'item_1795138427292_nv37',
  order_id: exactOrder.id,
  product_id: 'prod_1792819116609_lhst',
  product_name_snapshot: 'MADHURAI mini bites',
  selling_unit_snapshot: 'BOX',
  pieces_per_pack_snapshot: 40,
  weight_snapshot: '320g',
  mrp_snapshot: 220,
  price_snapshot: 190,
  quantity: 2,
  total_item_price: 380,
  created_at: exactOrder.created_at
};

const exactPayment = {
  id: 'pay_1795138427292_nv37',
  order_id: exactOrder.id,
  gateway: 'RAZORPAY',
  gateway_order_id: 'order_U0naveen_37',
  gateway_payment_id: null,
  amount: 390,
  currency: 'INR',
  status: 'PENDING',
  payment_method: 'RAZORPAY',
  upi_qr_string: null,
  idempotency_key: null,
  raw_response: null,
  created_at: exactOrder.created_at,
  updated_at: exactOrder.updated_at
};

function insertIntoSqlite(sqlitePath) {
  console.log(`🔄 Inserting exact order MC-2026-000037 into SQLite at ${sqlitePath}...`);
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
      exactOrder.id, exactOrder.order_number, exactOrder.user_id, exactOrder.customer_name,
      exactOrder.customer_email, exactOrder.customer_phone, exactOrder.delivery_address,
      exactOrder.pincode, exactOrder.zone_name, exactOrder.subtotal, exactOrder.discount_amount,
      exactOrder.coupon_id, exactOrder.coupon_code, exactOrder.delivery_charge,
      exactOrder.is_free_delivery, exactOrder.tax_amount, exactOrder.total_amount,
      exactOrder.payment_status, exactOrder.payment_method, exactOrder.order_status,
      exactOrder.cod_collected, exactOrder.estimated_min_days, exactOrder.estimated_max_days,
      exactOrder.customer_notes, exactOrder.payment_reference, exactOrder.created_at,
      exactOrder.updated_at
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
      exactItem.id, exactItem.order_id, exactItem.product_id, exactItem.product_name_snapshot,
      exactItem.selling_unit_snapshot, exactItem.pieces_per_pack_snapshot, exactItem.weight_snapshot,
      exactItem.mrp_snapshot, exactItem.price_snapshot, exactItem.quantity,
      exactItem.total_item_price, exactItem.created_at
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
      exactPayment.id, exactPayment.order_id, exactPayment.gateway, exactPayment.gateway_order_id,
      exactPayment.gateway_payment_id, exactPayment.amount, exactPayment.currency,
      exactPayment.status, exactPayment.payment_method, exactPayment.upi_qr_string,
      exactPayment.idempotency_key, exactPayment.raw_response, exactPayment.created_at,
      exactPayment.updated_at
    );

    db.exec('COMMIT;');
    console.log('✅ SQLite: MC-2026-000037 for G vishnu Naveen inserted successfully!');

    const row = db.prepare('SELECT id, order_number, customer_name, customer_phone, total_amount, payment_status, order_status FROM orders WHERE order_number = ?').get('MC-2026-000037');
    console.log('Verified SQLite Order:', row);
  } catch (err) {
    try { db.exec('ROLLBACK;'); } catch (e) {}
    console.error('❌ SQLite error:', err);
    throw err;
  } finally {
    db.close();
  }
}

async function insertIntoPostgres(connectionString) {
  console.log('🔄 Connecting to Neon PostgreSQL...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    await client.query('BEGIN');

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
        customer_name = EXCLUDED.customer_name,
        customer_email = EXCLUDED.customer_email,
        customer_phone = EXCLUDED.customer_phone,
        delivery_address = EXCLUDED.delivery_address,
        pincode = EXCLUDED.pincode,
        subtotal = EXCLUDED.subtotal,
        total_amount = EXCLUDED.total_amount,
        payment_status = EXCLUDED.payment_status,
        order_status = EXCLUDED.order_status
    `, [
      exactOrder.id, exactOrder.order_number, exactOrder.user_id, exactOrder.customer_name,
      exactOrder.customer_email, exactOrder.customer_phone, exactOrder.delivery_address,
      exactOrder.pincode, exactOrder.zone_name, exactOrder.subtotal, exactOrder.discount_amount,
      exactOrder.coupon_id, exactOrder.coupon_code, exactOrder.delivery_charge,
      exactOrder.is_free_delivery, exactOrder.tax_amount, exactOrder.total_amount,
      exactOrder.payment_status, exactOrder.payment_method, exactOrder.order_status,
      exactOrder.cod_collected, exactOrder.estimated_min_days, exactOrder.estimated_max_days,
      exactOrder.customer_notes, exactOrder.payment_reference, exactOrder.created_at,
      exactOrder.updated_at
    ]);

    await client.query(`
      INSERT INTO order_items (
        id, order_id, product_id, product_name_snapshot, selling_unit_snapshot,
        pieces_per_pack_snapshot, weight_snapshot, mrp_snapshot, price_snapshot,
        quantity, total_item_price, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) ON CONFLICT (id) DO NOTHING
    `, [
      exactItem.id, exactItem.order_id, exactItem.product_id, exactItem.product_name_snapshot,
      exactItem.selling_unit_snapshot, exactItem.pieces_per_pack_snapshot, exactItem.weight_snapshot,
      exactItem.mrp_snapshot, exactItem.price_snapshot, exactItem.quantity,
      exactItem.total_item_price, exactItem.created_at
    ]);

    await client.query(`
      INSERT INTO payments (
        id, order_id, gateway, gateway_order_id, gateway_payment_id,
        amount, currency, status, payment_method, upi_qr_string, idempotency_key,
        raw_response, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      ) ON CONFLICT (id) DO NOTHING
    `, [
      exactPayment.id, exactPayment.order_id, exactPayment.gateway, exactPayment.gateway_order_id,
      exactPayment.gateway_payment_id, exactPayment.amount, exactPayment.currency,
      exactPayment.status, exactPayment.payment_method, exactPayment.upi_qr_string,
      exactPayment.idempotency_key, exactPayment.raw_response, exactPayment.created_at,
      exactPayment.updated_at
    ]);

    await client.query('COMMIT');
    client.release();
    console.log('✅ PostgreSQL: MC-2026-000037 for G vishnu Naveen inserted successfully!');

    const res = await pool.query('SELECT id, order_number, customer_name, customer_phone, total_amount, payment_status, order_status FROM orders WHERE order_number = $1', ['MC-2026-000037']);
    console.log('Verified PostgreSQL Order:', res.rows[0]);
  } finally {
    await pool.end();
  }
}

async function main() {
  const sqliteFile = path.resolve(__dirname, '../../database/madhurai_chocolate.sqlite');
  insertIntoSqlite(sqliteFile);

  const neonUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ar3QNgTPIFM4@ep-crimson-lake-b4z0dddm-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';
  if (neonUrl && neonUrl.startsWith('postgres')) {
    await insertIntoPostgres(neonUrl);
  }
}

main().catch(console.error);
