import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { Pool } = pg;

const orderData = {
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
  coupon_id: null,
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
  payment_reference: 'pay_U0md5ETQcFc6UG'
};

const itemData = {
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

const paymentData = {
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

async function updatePostgres(connectionString) {
  console.log('🔄 Connecting to Neon PostgreSQL...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    await client.query('BEGIN');

    // Upsert or update order with customer_name = 'Naveen'
    await client.query(`
      INSERT INTO orders (
        id, order_number, user_id, customer_name, customer_email, customer_phone,
        delivery_address, pincode, zone_name, subtotal, discount_amount, coupon_id,
        coupon_code, delivery_charge, is_free_delivery, tax_amount, total_amount,
        payment_status, payment_method, order_status, cod_collected, estimated_min_days,
        estimated_max_days, customer_notes, payment_reference, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, '2026-11-16 08:36:12', '2026-11-16 08:37:51'
      ) ON CONFLICT (id) DO UPDATE SET
        customer_name = EXCLUDED.customer_name,
        customer_email = EXCLUDED.customer_email,
        delivery_address = EXCLUDED.delivery_address,
        payment_status = EXCLUDED.payment_status,
        order_status = EXCLUDED.order_status,
        payment_reference = EXCLUDED.payment_reference
    `, [
      orderData.id, orderData.order_number, orderData.user_id, orderData.customer_name,
      orderData.customer_email, orderData.customer_phone, orderData.delivery_address,
      orderData.pincode, orderData.zone_name, orderData.subtotal, orderData.discount_amount,
      orderData.coupon_id, orderData.coupon_code, orderData.delivery_charge,
      orderData.is_free_delivery, orderData.tax_amount, orderData.total_amount,
      orderData.payment_status, orderData.payment_method, orderData.order_status,
      orderData.cod_collected, orderData.estimated_min_days, orderData.estimated_max_days,
      orderData.customer_notes, orderData.payment_reference
    ]);

    // Upsert item
    await client.query(`
      INSERT INTO order_items (
        id, order_id, product_id, product_name_snapshot, selling_unit_snapshot,
        pieces_per_pack_snapshot, weight_snapshot, mrp_snapshot, price_snapshot,
        quantity, total_item_price, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) ON CONFLICT (id) DO NOTHING
    `, [
      itemData.id, itemData.order_id, itemData.product_id, itemData.product_name_snapshot,
      itemData.selling_unit_snapshot, itemData.pieces_per_pack_snapshot, itemData.weight_snapshot,
      itemData.mrp_snapshot, itemData.price_snapshot, itemData.quantity,
      itemData.total_item_price, itemData.created_at
    ]);

    // Upsert payment
    await client.query(`
      INSERT INTO payments (
        id, order_id, gateway, gateway_order_id, gateway_payment_id,
        amount, currency, status, payment_method, upi_qr_string, idempotency_key,
        raw_response, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      ) ON CONFLICT (id) DO NOTHING
    `, [
      paymentData.id, paymentData.order_id, paymentData.gateway, paymentData.gateway_order_id,
      paymentData.gateway_payment_id, paymentData.amount, paymentData.currency,
      paymentData.status, paymentData.payment_method, paymentData.upi_qr_string,
      paymentData.idempotency_key, paymentData.raw_response, paymentData.created_at,
      paymentData.updated_at
    ]);

    await client.query('COMMIT');
    client.release();
    console.log('✅ PostgreSQL: Order updated with customer Naveen!');

    const res = await pool.query('SELECT id, order_number, customer_name, customer_phone, delivery_address, total_amount, order_status, payment_status FROM orders');
    console.log('Postgres Orders in DB:', res.rows);
  } finally {
    await pool.end();
  }
}

function updateSqlite(sqlitePath) {
  console.log(`🔄 Updating SQLite at ${sqlitePath}...`);
  if (!fs.existsSync(sqlitePath)) {
    console.log('SQLite file not found.');
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
      orderData.id, orderData.order_number, orderData.user_id, orderData.customer_name,
      orderData.customer_email, orderData.customer_phone, orderData.delivery_address,
      orderData.pincode, orderData.zone_name, orderData.subtotal, orderData.discount_amount,
      orderData.coupon_id, orderData.coupon_code, orderData.delivery_charge,
      orderData.is_free_delivery, orderData.tax_amount, orderData.total_amount,
      orderData.payment_status, orderData.payment_method, orderData.order_status,
      orderData.cod_collected, orderData.estimated_min_days, orderData.estimated_max_days,
      orderData.customer_notes, orderData.payment_reference, '2026-11-16 08:36:12', '2026-11-16 08:37:51'
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
      itemData.id, itemData.order_id, itemData.product_id, itemData.product_name_snapshot,
      itemData.selling_unit_snapshot, itemData.pieces_per_pack_snapshot, itemData.weight_snapshot,
      itemData.mrp_snapshot, itemData.price_snapshot, itemData.quantity,
      itemData.total_item_price, itemData.created_at
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
      paymentData.id, paymentData.order_id, paymentData.gateway, paymentData.gateway_order_id,
      paymentData.gateway_payment_id, paymentData.amount, paymentData.currency,
      paymentData.status, paymentData.payment_method, paymentData.upi_qr_string,
      paymentData.idempotency_key, paymentData.raw_response, paymentData.created_at,
      paymentData.updated_at
    );

    db.exec('COMMIT;');
    console.log('✅ SQLite: Order updated with customer Naveen!');

    const check = db.prepare('SELECT id, order_number, customer_name, customer_phone, delivery_address, total_amount, order_status, payment_status FROM orders').all();
    console.log('SQLite Orders in DB:', check);
  } catch (err) {
    try { db.exec('ROLLBACK;'); } catch (e) {}
    console.error('❌ SQLite error:', err);
    throw err;
  } finally {
    db.close();
  }
}

async function main() {
  const sqliteFile = path.resolve(__dirname, '../../database/madhurai_chocolate.sqlite');
  updateSqlite(sqliteFile);

  const neonUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ar3QNgTPIFM4@ep-crimson-lake-b4z0dddm-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';
  if (neonUrl && neonUrl.startsWith('postgres')) {
    await updatePostgres(neonUrl);
  }
}

main().catch(console.error);
