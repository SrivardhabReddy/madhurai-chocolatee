import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEON_URL = 'postgresql://neondb_owner:npg_ar3QNgTPIFM4@ep-crimson-lake-b4z0dddm-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';
const SQLITE_PATH = path.resolve(__dirname, '../../database/madhurai_chocolate.sqlite');

const categoryData = {
  id: 'cat_kunafa_specials',
  name: 'Kunafa Chocolate Specials',
  slug: 'kunafa-specials',
  description: 'Crispy roasted kataifi pastry layered with pistachio cream & pure dark chocolate.'
};

const productsData = [
  {
    id: 'prod_kunafa_heart_single',
    name: 'Kunafa Single Heart Shaped Chocolate',
    slug: 'kunafa-single-heart-chocolate',
    description: 'Handcrafted single heart-shaped luxury chocolate packed with crispy golden roasted kataifi kunafa and rich pistachio cream inside a velvety dark chocolate shell. 10g single piece. Special launch pre-booking open until December 1!',
    category_id: 'cat_kunafa_specials',
    mrp: 35,
    selling_price: 25,
    discount: 28.57,
    stock: 500,
    weight: '10g',
    selling_unit: 'PIECE',
    pieces_per_pack: 1,
    ingredients: 'Dark Chocolate (Cocoa Solids, Cocoa Butter, Sugar), Roasted Kataifi Pastry (Wheat Flour, Pure Ghee), Pistachio Cream, Vanilla.',
    nutrition: 'Per 10g piece: Calories 55 kcal | Protein 1.2g | Carbohydrates 6.5g | Fats 2.8g',
    delivery_available: 1,
    cod_available: 1,
    status: 'ACTIVE',
    is_featured: 1,
    is_bestseller: 0,
    is_new: 1,
    is_prebooking: 1,
    prebooking_deposit: 15,
    balance_on_delivery: 10,
    prebooking_end_date: '2026-12-01 23:59:59',
    post_prebooking_price: 30,
    image_url: '/kunafa-heart-single.svg'
  },
  {
    id: 'prod_kunafa_heart_pack5',
    name: 'Pack of 5 Heart Shaped Kunafa Chocolates',
    slug: 'pack-of-5-heart-shaped-kunafa-chocolates',
    description: 'Luxury gift box of 5 handcrafted heart-shaped Kunafa chocolates filled with crunchy golden roasted pistachio kataifi pastry and pure Belgian chocolate. 50g total (5 x 10g pieces). Special launch pre-booking open until December 1!',
    category_id: 'cat_kunafa_specials',
    mrp: 175,
    selling_price: 125,
    discount: 28.57,
    stock: 250,
    weight: '50g',
    selling_unit: 'PACK',
    pieces_per_pack: 5,
    ingredients: 'Dark Chocolate (Cocoa Solids, Cocoa Butter, Sugar), Roasted Kataifi Pastry (Wheat Flour, Pure Ghee), Pistachio Cream, Vanilla.',
    nutrition: 'Per 50g box: Calories 275 kcal | Protein 6g | Carbohydrates 32.5g | Fats 14g',
    delivery_available: 1,
    cod_available: 1,
    status: 'ACTIVE',
    is_featured: 1,
    is_bestseller: 1,
    is_new: 1,
    is_prebooking: 1,
    prebooking_deposit: 50,
    balance_on_delivery: 75,
    prebooking_end_date: '2026-12-01 23:59:59',
    post_prebooking_price: 150,
    image_url: '/kunafa-heart-pack5.svg'
  }
];

// 1. Process SQLite Database
async function syncSQLite() {
  console.log('🔄 Syncing SQLite database...');
  const db = new DatabaseSync(SQLITE_PATH);

  // Add columns if missing
  const productColsToAdd = [
    { name: 'is_prebooking', type: 'INTEGER DEFAULT 0' },
    { name: 'prebooking_deposit', type: 'REAL DEFAULT 0' },
    { name: 'balance_on_delivery', type: 'REAL DEFAULT 0' },
    { name: 'prebooking_end_date', type: 'TEXT DEFAULT NULL' },
    { name: 'post_prebooking_price', type: 'REAL DEFAULT 0' }
  ];
  for (const col of productColsToAdd) {
    try {
      db.exec(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}`);
    } catch (e) {}
  }

  const orderColsToAdd = [
    { name: 'advance_paid', type: 'REAL DEFAULT 0' },
    { name: 'balance_due_on_delivery', type: 'REAL DEFAULT 0' },
    { name: 'is_prebooking_order', type: 'INTEGER DEFAULT 0' }
  ];
  for (const col of orderColsToAdd) {
    try {
      db.exec(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`);
    } catch (e) {}
  }

  const itemColsToAdd = [
    { name: 'advance_paid', type: 'REAL DEFAULT 0' },
    { name: 'balance_due', type: 'REAL DEFAULT 0' },
    { name: 'is_prebooking', type: 'INTEGER DEFAULT 0' }
  ];
  for (const col of itemColsToAdd) {
    try {
      db.exec(`ALTER TABLE order_items ADD COLUMN ${col.name} ${col.type}`);
    } catch (e) {}
  }

  // Upsert Category
  const catStmt = db.prepare(`
    INSERT INTO categories (id, name, slug, description)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      slug = excluded.slug,
      description = excluded.description
  `);
  catStmt.run(categoryData.id, categoryData.name, categoryData.slug, categoryData.description);

  // Upsert Products
  for (const p of productsData) {
    const prodStmt = db.prepare(`
      INSERT INTO products (
        id, name, slug, description, category_id, mrp, selling_price, discount,
        stock, weight, selling_unit, pieces_per_pack, ingredients, nutrition,
        delivery_available, cod_available, status, is_featured, is_bestseller, is_new,
        is_prebooking, prebooking_deposit, balance_on_delivery, prebooking_end_date, post_prebooking_price
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        slug = excluded.slug,
        description = excluded.description,
        category_id = excluded.category_id,
        mrp = excluded.mrp,
        selling_price = excluded.selling_price,
        discount = excluded.discount,
        stock = excluded.stock,
        weight = excluded.weight,
        selling_unit = excluded.selling_unit,
        pieces_per_pack = excluded.pieces_per_pack,
        ingredients = excluded.ingredients,
        nutrition = excluded.nutrition,
        delivery_available = excluded.delivery_available,
        cod_available = excluded.cod_available,
        status = excluded.status,
        is_featured = excluded.is_featured,
        is_bestseller = excluded.is_bestseller,
        is_new = excluded.is_new,
        is_prebooking = excluded.is_prebooking,
        prebooking_deposit = excluded.prebooking_deposit,
        balance_on_delivery = excluded.balance_on_delivery,
        prebooking_end_date = excluded.prebooking_end_date,
        post_prebooking_price = excluded.post_prebooking_price,
        deleted_at = NULL
    `);

    prodStmt.run(
      p.id, p.name, p.slug, p.description, p.category_id, p.mrp, p.selling_price, p.discount,
      p.stock, p.weight, p.selling_unit, p.pieces_per_pack, p.ingredients, p.nutrition,
      p.delivery_available, p.cod_available, p.status, p.is_featured, p.is_bestseller, p.is_new,
      p.is_prebooking, p.prebooking_deposit, p.balance_on_delivery, p.prebooking_end_date, p.post_prebooking_price
    );

    // Upsert Image
    const imgId = `img_${p.id}`;
    const imgStmt = db.prepare(`
      INSERT INTO product_images (id, product_id, image_url, alt_text, display_order, is_primary)
      VALUES (?, ?, ?, ?, 0, 1)
      ON CONFLICT(id) DO UPDATE SET
        image_url = excluded.image_url,
        is_primary = 1
    `);
    imgStmt.run(imgId, p.id, p.image_url, p.name);

    // Upsert Inventory
    const invId = `inv_${p.id}`;
    const invStmt = db.prepare(`
      INSERT INTO inventory (id, product_id, current_stock, reserved_stock, low_stock_threshold)
      VALUES (?, ?, ?, 0, 10)
      ON CONFLICT(id) DO UPDATE SET
        current_stock = excluded.current_stock
    `);
    invStmt.run(invId, p.id, p.stock);
  }

  console.log('✅ SQLite updated successfully with Kunafa products!');
}

// 2. Process Neon PostgreSQL Database
async function syncNeon() {
  console.log('🔄 Syncing Neon PostgreSQL database...');
  const pool = new pg.Pool({
    connectionString: NEON_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    // Add columns if missing
    const productCols = [
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS is_prebooking INTEGER DEFAULT 0',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS prebooking_deposit NUMERIC DEFAULT 0',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS balance_on_delivery NUMERIC DEFAULT 0',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS prebooking_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS post_prebooking_price NUMERIC DEFAULT 0'
    ];
    for (const q of productCols) {
      await client.query(q).catch(() => {});
    }

    const orderCols = [
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS advance_paid NUMERIC DEFAULT 0',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS balance_due_on_delivery NUMERIC DEFAULT 0',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_prebooking_order INTEGER DEFAULT 0'
    ];
    for (const q of orderCols) {
      await client.query(q).catch(() => {});
    }

    const itemCols = [
      'ALTER TABLE order_items ADD COLUMN IF NOT EXISTS advance_paid NUMERIC DEFAULT 0',
      'ALTER TABLE order_items ADD COLUMN IF NOT EXISTS balance_due NUMERIC DEFAULT 0',
      'ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_prebooking INTEGER DEFAULT 0'
    ];
    for (const q of itemCols) {
      await client.query(q).catch(() => {});
    }

    // Upsert Category
    await client.query(`
      INSERT INTO categories (id, name, slug, description)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT(id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description
    `, [categoryData.id, categoryData.name, categoryData.slug, categoryData.description]);

    // Upsert Products
    for (const p of productsData) {
      await client.query(`
        INSERT INTO products (
          id, name, slug, description, category_id, mrp, selling_price, discount,
          stock, weight, selling_unit, pieces_per_pack, ingredients, nutrition,
          delivery_available, cod_available, status, is_featured, is_bestseller, is_new,
          is_prebooking, prebooking_deposit, balance_on_delivery, prebooking_end_date, post_prebooking_price
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25
        )
        ON CONFLICT(id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          description = EXCLUDED.description,
          category_id = EXCLUDED.category_id,
          mrp = EXCLUDED.mrp,
          selling_price = EXCLUDED.selling_price,
          discount = EXCLUDED.discount,
          stock = EXCLUDED.stock,
          weight = EXCLUDED.weight,
          selling_unit = EXCLUDED.selling_unit,
          pieces_per_pack = EXCLUDED.pieces_per_pack,
          ingredients = EXCLUDED.ingredients,
          nutrition = EXCLUDED.nutrition,
          delivery_available = EXCLUDED.delivery_available,
          cod_available = EXCLUDED.cod_available,
          status = EXCLUDED.status,
          is_featured = EXCLUDED.is_featured,
          is_bestseller = EXCLUDED.is_bestseller,
          is_new = EXCLUDED.is_new,
          is_prebooking = EXCLUDED.is_prebooking,
          prebooking_deposit = EXCLUDED.prebooking_deposit,
          balance_on_delivery = EXCLUDED.balance_on_delivery,
          prebooking_end_date = EXCLUDED.prebooking_end_date,
          post_prebooking_price = EXCLUDED.post_prebooking_price,
          deleted_at = NULL
      `, [
        p.id, p.name, p.slug, p.description, p.category_id, p.mrp, p.selling_price, p.discount,
        p.stock, p.weight, p.selling_unit, p.pieces_per_pack, p.ingredients, p.nutrition,
        p.delivery_available, p.cod_available, p.status, p.is_featured, p.is_bestseller, p.is_new,
        p.is_prebooking, p.prebooking_deposit, p.balance_on_delivery, p.prebooking_end_date, p.post_prebooking_price
      ]);

      const imgId = `img_${p.id}`;
      await client.query(`
        INSERT INTO product_images (id, product_id, image_url, alt_text, display_order, is_primary)
        VALUES ($1, $2, $3, $4, 0, 1)
        ON CONFLICT(id) DO UPDATE SET
          image_url = EXCLUDED.image_url,
          is_primary = 1
      `, [imgId, p.id, p.image_url, p.name]);

      const invId = `inv_${p.id}`;
      await client.query(`
        INSERT INTO inventory (id, product_id, current_stock, reserved_stock, low_stock_threshold)
        VALUES ($1, $2, $3, 0, 10)
        ON CONFLICT(id) DO UPDATE SET
          current_stock = EXCLUDED.current_stock
      `, [invId, p.id, p.stock]);
    }

    console.log('✅ Neon PostgreSQL updated successfully with Kunafa products!');
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  await syncSQLite();
  try {
    await syncNeon();
  } catch (err) {
    console.error('Neon sync error:', err.message);
  }
  console.log('🏁 Database setup complete.');
}

main().catch(console.error);
