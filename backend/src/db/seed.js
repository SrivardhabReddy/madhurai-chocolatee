import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import db, { initDatabase, query, get, exec } from './index.js';
import { runMigrations } from './migrate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runSeeds() {
  await runMigrations();
  console.log('🌱 Seeding database with production initial data...');

  const adminPassHash = await bcrypt.hash('Admin@123456', 10);
  const customerPassHash = await bcrypt.hash('Customer@123', 10);

  // 1. Roles
  const roles = [
    { id: 'role_super_admin', name: 'SUPER_ADMIN', desc: 'Full unrestricted system access' },
    { id: 'role_admin', name: 'ADMIN', desc: 'Core business & operations manager' },
    { id: 'role_order_manager', name: 'ORDER_MANAGER', desc: 'Order fulfillment and dispatch manager' },
    { id: 'role_inventory_manager', name: 'INVENTORY_MANAGER', desc: 'Catalog, stock and warehouse manager' }
  ];
  for (const r of roles) {
    const existing = await get('SELECT id FROM admin_roles WHERE id = ?', [r.id]);
    if (!existing) {
      await query('INSERT INTO admin_roles (id, name, description) VALUES (?, ?, ?)', [r.id, r.name, r.desc]);
    }
  }

  // 2. Permissions for SUPER_ADMIN
  const modules = ['PRODUCTS', 'ORDERS', 'INVENTORY', 'DELIVERY', 'COUPONS', 'CUSTOMERS', 'PAYMENTS', 'SETTINGS', 'ROLES', 'AUDIT'];
  for (const m of modules) {
    const permId = `perm_sa_${m.toLowerCase()}`;
    const existing = await get('SELECT id FROM admin_permissions WHERE id = ?', [permId]);
    if (!existing) {
      await query(
        'INSERT INTO admin_permissions (id, role_id, module, can_read, can_write, can_delete, can_manage) VALUES (?, ?, ?, 1, 1, 1, 1)',
        [permId, 'role_super_admin', m]
      );
    }
  }

  // Permissions for INVENTORY_MANAGER
  const invPerms = [
    { id: 'perm_inv_prod', module: 'PRODUCTS', r: 1, w: 1, d: 0, m: 0 },
    { id: 'perm_inv_inv', module: 'INVENTORY', r: 1, w: 1, d: 0, m: 1 },
    { id: 'perm_inv_ord', module: 'ORDERS', r: 1, w: 0, d: 0, m: 0 }
  ];
  for (const p of invPerms) {
    const existing = await get('SELECT id FROM admin_permissions WHERE id = ?', [p.id]);
    if (!existing) {
      await query(
        'INSERT INTO admin_permissions (id, role_id, module, can_read, can_write, can_delete, can_manage) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [p.id, 'role_inventory_manager', p.module, p.r, p.w, p.d, p.m]
      );
    }
  }

  // Permissions for ORDER_MANAGER
  const ordPerms = [
    { id: 'perm_ord_ord', module: 'ORDERS', r: 1, w: 1, d: 0, m: 1 },
    { id: 'perm_ord_cust', module: 'CUSTOMERS', r: 1, w: 0, d: 0, m: 0 },
    { id: 'perm_ord_del', module: 'DELIVERY', r: 1, w: 0, d: 0, m: 0 }
  ];
  for (const p of ordPerms) {
    const existing = await get('SELECT id FROM admin_permissions WHERE id = ?', [p.id]);
    if (!existing) {
      await query(
        'INSERT INTO admin_permissions (id, role_id, module, can_read, can_write, can_delete, can_manage) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [p.id, 'role_order_manager', p.module, p.r, p.w, p.d, p.m]
      );
    }
  }

  // 3. Seed Users
  const companyAdminPassHash = await bcrypt.hash('Madhurai@2026/8/9', 10);
  const users = [
    { id: 'usr_madhurai_company', email: 'madhuraicompany@gmail.com', pass: companyAdminPassHash, name: 'Madhurai Company Admin', phone: '+91 98765 00000', role: 'SUPER_ADMIN' }
  ];
  for (const u of users) {
    const existing = await get('SELECT id FROM users WHERE email = ?', [u.email]);
    if (!existing) {
      await query(
        'INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
        [u.id, u.email, u.pass, u.name, u.phone, u.role]
      );
    } else {
      // Keep password updated if seeded
      await query(
        'UPDATE users SET password_hash = ?, role = ?, is_active = 1 WHERE email = ?',
        [u.pass, u.role, u.email]
      );
    }
  }

  // 4. Categories
  const categories = [
    { id: 'cat_crunch_specials', name: 'Peanut Butter Crunch Specials', slug: 'peanut-butter-crunch-specials', desc: 'Our legendary center-filled peanut butter and crispy crunchy chocolate creations.', img: '/uploads/chocolate-crunch-pb.jpg', order: 1 },
    { id: 'cat_festive_boxes', name: 'Festive Gift Boxes', slug: 'festive-gift-boxes', desc: 'Royal handcrafted boxes for celebrations, weddings, and premium gifting.', img: '/uploads/madhurai-pack-box.jpg', order: 2 },
    { id: 'cat_dark_truffles', name: 'Dark Artisanal Truffles', slug: 'dark-artisanal-truffles', desc: 'Single-origin South Indian cocoa beans blended into silky melt-in-mouth truffles.', img: '/uploads/chocolate-crunch-pb.jpg', order: 3 },
    { id: 'cat_chocolate_slabs', name: 'Gourmet Slabs & Bars', slug: 'gourmet-slabs-bars', desc: 'Thick decadent chocolate slabs loaded with slow-roasted nuts.', img: '/uploads/madhurai-hero-banner.jpg', order: 4 }
  ];
  for (const c of categories) {
    const existing = await get('SELECT id FROM categories WHERE id = ?', [c.id]);
    if (!existing) {
      await query(
        'INSERT INTO categories (id, name, slug, description, image_url, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
        [c.id, c.name, c.slug, c.desc, c.img, c.order]
      );
    }
  }

  // 5. Products
  const products = [
    {
      id: 'prod_main_pb_crunch',
      name: 'Chocolate Crunch Peanut Butter Inside',
      slug: 'chocolate-crunch-peanut-butter-inside',
      desc: 'Experience pure artisanal bliss: crisp dark chocolate shell filled to the brim with roasted golden peanut butter, crushed crunchy peanut nibs, and a whisper of Madurai sea salt. Each piece is individually wrapped for peak freshness. Perfect for gifting or personal indulgence.',
      category_id: 'cat_crunch_specials',
      mrp: 450.00,
      selling_price: 400.00,
      discount: 11.11,
      stock: 150,
      weight: '500g',
      selling_unit: 'BOX',
      pieces_per_pack: 40,
      ingredients: 'Dark Cocoa Mass (55%), Roasted Peanuts (28%), Brown Cane Sugar, Vegetable Fat, Emulsifier (INS 322 Sunflower Lecithin), Natural Madagascan Vanilla Extract, Sea Salt. Contains Peanuts. 0% Palm Oil & Zero Trans Fat.',
      nutrition: JSON.stringify({
        serving_size: '1 piece (12.5g)',
        calories: '68 kcal',
        protein: '2.2g',
        total_fat: '4.6g',
        saturated_fat: '2.1g',
        trans_fat: '0g',
        carbohydrates: '5.1g',
        dietary_fiber: '0.8g',
        sugars: '3.8g',
        sodium: '18mg'
      }),
      delivery_available: 1,
      cod_available: 1,
      status: 'ACTIVE',
      is_featured: 1,
      is_bestseller: 1,
      is_new: 0
    },
    {
      id: 'prod_royal_festive_box',
      name: 'Madhurai Royal Heritage Festive Box',
      slug: 'madhurai-royal-heritage-festive-box',
      desc: 'A grand 80-piece collection celebrating South Indian chocolate craftsmanship. Encased in our signature gold-embossed filigree keepsake box, featuring an assortment of Peanut Butter Crunch, Roasted Almond Pralines, and Dark Silk Truffles.',
      category_id: 'cat_festive_boxes',
      mrp: 999.00,
      selling_price: 850.00,
      discount: 14.91,
      stock: 60,
      weight: '1000g',
      selling_unit: 'BOX',
      pieces_per_pack: 80,
      ingredients: 'Cocoa Solids (60%), Roasted Peanuts, Roasted California Almonds, Vegetable Fat, Raw Cane Sugar, Milk Solids, Natural Vanilla. Zero Trans Fat.',
      nutrition: JSON.stringify({
        serving_size: '2 pieces (25g)',
        calories: '135 kcal',
        protein: '3.8g',
        total_fat: '8.9g',
        saturated_fat: '4.2g',
        trans_fat: '0g',
        carbohydrates: '11.2g',
        dietary_fiber: '1.5g',
        sugars: '7.9g',
        sodium: '24mg'
      }),
      delivery_available: 1,
      cod_available: 1,
      status: 'ACTIVE',
      is_featured: 1,
      is_bestseller: 1,
      is_new: 1
    },
    {
      id: 'prod_dark_truffle_bites',
      name: 'Dark Truffle Silk Bites',
      slug: 'dark-truffle-silk-bites',
      desc: 'Intense 70% dark cocoa ganache truffles dusted with Dutch-processed bitter cocoa powder. Velvety, smooth, and deeply satisfying for dark chocolate connoisseurs.',
      category_id: 'cat_dark_truffles',
      mrp: 280.00,
      selling_price: 240.00,
      discount: 14.28,
      stock: 90,
      weight: '250g',
      selling_unit: 'BOX',
      pieces_per_pack: 20,
      ingredients: 'Single-Origin Cocoa Mass (70%), Vegetable Fat, Dark Cane Jaggery, Fresh Dairy Cream, Dutch Cocoa Powder. Zero Palm Oil.',
      nutrition: JSON.stringify({
        serving_size: '1 piece (12.5g)',
        calories: '62 kcal',
        protein: '1.4g',
        total_fat: '4.8g',
        saturated_fat: '3.0g',
        trans_fat: '0g',
        carbohydrates: '4.2g',
        dietary_fiber: '1.1g',
        sugars: '2.9g',
        sodium: '8mg'
      }),
      delivery_available: 1,
      cod_available: 1,
      status: 'ACTIVE',
      is_featured: 0,
      is_bestseller: 0,
      is_new: 1
    },
    {
      id: 'prod_pb_slab',
      name: 'Roasted Peanut Butter Chocolate Slab',
      slug: 'roasted-peanut-butter-chocolate-slab',
      desc: 'Hand-poured thick gourmet slab of milk chocolate swirled with stone-ground chunky peanut butter and sea salt.',
      category_id: 'cat_chocolate_slabs',
      mrp: 180.00,
      selling_price: 160.00,
      discount: 11.11,
      stock: 120,
      weight: '200g',
      selling_unit: 'PIECE',
      pieces_per_pack: 1,
      ingredients: 'Milk Chocolate (50%), Stone-Ground Peanut Butter (35%), Sugar, Roasted Peanuts, Himalayan Pink Salt.',
      nutrition: JSON.stringify({
        serving_size: '25g',
        calories: '142 kcal',
        protein: '3.2g',
        total_fat: '9.4g',
        saturated_fat: '4.1g',
        trans_fat: '0g',
        carbohydrates: '12.0g',
        dietary_fiber: '1.2g',
        sugars: '9.1g',
        sodium: '30mg'
      }),
      delivery_available: 1,
      cod_available: 1,
      status: 'ACTIVE',
      is_featured: 1,
      is_bestseller: 0,
      is_new: 0
    }
  ];

  for (const p of products) {
    const existing = await get('SELECT id FROM products WHERE id = ?', [p.id]);
    if (!existing) {
      await query(
        `INSERT INTO products (
          id, name, slug, description, category_id, mrp, selling_price, discount, stock, 
          weight, selling_unit, pieces_per_pack, ingredients, nutrition, delivery_available, 
          cod_available, status, is_featured, is_bestseller, is_new
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id, p.name, p.slug, p.desc, p.category_id, p.mrp, p.selling_price, p.discount, p.stock,
          p.weight, p.selling_unit, p.pieces_per_pack, p.ingredients, p.nutrition, p.delivery_available,
          p.cod_available, p.status, p.is_featured, p.is_bestseller, p.is_new
        ]
      );

      // Inventory record
      await query(
        'INSERT INTO inventory (id, product_id, current_stock, reserved_stock, low_stock_threshold) VALUES (?, ?, ?, 0, 15)',
        [`inv_${p.id}`, p.id, p.stock]
      );

      // Initial restock transaction
      await query(
        'INSERT INTO inventory_transactions (id, product_id, type, quantity, previous_stock, new_stock, reference_id, notes, created_by) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)',
        [`tx_init_${p.id}`, p.id, 'RESTOCK', p.stock, p.stock, 'INIT-BATCH-2026', 'Initial warehouse stock allocation', 'usr_super_admin']
      );
    }
  }

  // 6. Product Images
  const images = [
    { id: 'img_pb_1', prod_id: 'prod_main_pb_crunch', url: '/uploads/chocolate-crunch-pb.jpg', alt: 'Chocolate Crunch Peanut Butter Inside - Broken bite', order: 1, primary: 1 },
    { id: 'img_pb_2', prod_id: 'prod_main_pb_crunch', url: '/uploads/madhurai-pack-box.jpg', alt: 'Madhurai 500g 40 pieces luxury gold box', order: 2, primary: 0 },
    { id: 'img_festive_1', prod_id: 'prod_royal_festive_box', url: '/uploads/madhurai-pack-box.jpg', alt: 'Royal Heritage Festive Box', order: 1, primary: 1 },
    { id: 'img_truffle_1', prod_id: 'prod_dark_truffle_bites', url: '/uploads/chocolate-crunch-pb.jpg', alt: 'Dark Truffle Silk Bites', order: 1, primary: 1 },
    { id: 'img_slab_1', prod_id: 'prod_pb_slab', url: '/uploads/madhurai-hero-banner.jpg', alt: 'Peanut Butter Chocolate Slab', order: 1, primary: 1 }
  ];
  for (const img of images) {
    const existing = await get('SELECT id FROM product_images WHERE id = ?', [img.id]);
    if (!existing) {
      await query(
        'INSERT INTO product_images (id, product_id, image_url, alt_text, display_order, is_primary) VALUES (?, ?, ?, ?, ?, ?)',
        [img.id, img.prod_id, img.url, img.alt, img.order, img.primary]
      );
    }
  }

  // 7. Delivery Zones
  const zones = [
    { id: 'zone_south_metro', name: 'South India Express Hubs', type: 'STATE', desc: 'Standard 1-3 business days express delivery' },
    { id: 'zone_rest_of_india', name: 'Rest of India', type: 'STATE', desc: 'Standard 3-5 business days delivery' }
  ];
  for (const z of zones) {
    const existing = await get('SELECT id FROM delivery_zones WHERE id = ?', [z.id]);
    if (!existing) {
      await query(
        'INSERT INTO delivery_zones (id, name, zone_type, description, is_active) VALUES (?, ?, ?, ?, 1)',
        [z.id, z.name, z.type, z.desc]
      );
    }
  }

  // 8. Pincodes
  const pincodes = [
    { pin: '524101', city: 'Gudur', dist: 'SPSR Nellore', state: 'Andhra Pradesh', charge: 30.0, min: 1, max: 2, cod: 1 },
    { pin: '524102', city: 'Gudur', dist: 'SPSR Nellore', state: 'Andhra Pradesh', charge: 30.0, min: 1, max: 2, cod: 1 },
    { pin: '524001', city: 'Nellore', dist: 'SPSR Nellore', state: 'Andhra Pradesh', charge: 40.0, min: 2, max: 4, cod: 1 },
    { pin: '524002', city: 'Nellore', dist: 'SPSR Nellore', state: 'Andhra Pradesh', charge: 40.0, min: 2, max: 4, cod: 1 },
    { pin: '524003', city: 'Nellore', dist: 'SPSR Nellore', state: 'Andhra Pradesh', charge: 40.0, min: 2, max: 4, cod: 1 },
    { pin: '517501', city: 'Tirupati', dist: 'Tirupati', state: 'Andhra Pradesh', charge: 40.0, min: 2, max: 3, cod: 1 },
    { pin: '524121', city: 'Sullurpeta', dist: 'Tirupati', state: 'Andhra Pradesh', charge: 40.0, min: 2, max: 3, cod: 1 },
    { pin: '524126', city: 'Naidupeta', dist: 'Tirupati', state: 'Andhra Pradesh', charge: 40.0, min: 2, max: 3, cod: 1 },
    { pin: '524201', city: 'Kavali', dist: 'SPSR Nellore', state: 'Andhra Pradesh', charge: 40.0, min: 2, max: 4, cod: 1 },
    { pin: '524132', city: 'Venkatagiri', dist: 'Tirupati', state: 'Andhra Pradesh', charge: 40.0, min: 2, max: 3, cod: 1 },
    { pin: '625001', city: 'Madurai', dist: 'Madurai', state: 'Tamil Nadu', charge: 30.0, min: 1, max: 2, cod: 1 },
    { pin: '600001', city: 'Chennai', dist: 'Chennai', state: 'Tamil Nadu', charge: 40.0, min: 2, max: 3, cod: 1 },
    { pin: '560001', city: 'Bengaluru', dist: 'Bengaluru Urban', state: 'Karnataka', charge: 40.0, min: 2, max: 3, cod: 1 },
    { pin: '500001', city: 'Hyderabad', dist: 'Hyderabad', state: 'Telangana', charge: 40.0, min: 2, max: 3, cod: 1 },
    { pin: '400001', city: 'Mumbai', dist: 'Mumbai City', state: 'Maharashtra', charge: 50.0, min: 3, max: 5, cod: 1 },
    { pin: '110001', city: 'New Delhi', dist: 'Central Delhi', state: 'Delhi', charge: 50.0, min: 3, max: 5, cod: 1 },
    { pin: '700001', city: 'Kolkata', dist: 'Kolkata', state: 'West Bengal', charge: 50.0, min: 3, max: 5, cod: 1 }
  ];
  for (const p of pincodes) {
    const existing = await get('SELECT id FROM delivery_pincodes WHERE pincode = ?', [p.pin]);
    if (!existing) {
      await query(
        `INSERT INTO delivery_pincodes (
          id, pincode, zone_id, city, district, state, is_serviceable, cod_available, 
          delivery_charge, min_delivery_days, max_delivery_days, status
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 'ACTIVE')`,
        [`pin_${p.pin}`, p.pin, 'zone_south_metro', p.city, p.dist, p.state, p.cod, p.charge, p.min, p.max]
      );
    }
  }

  // 9. Delivery Rules
  const rules = [
    {
      id: 'rule_qty_5_free',
      name: 'Free Delivery on 5+ Units',
      type: 'QUANTITY',
      field: 'quantity',
      op: '>=',
      val: '5',
      charge: 0.0,
      free: 1,
      priority: 4,
      desc: 'Free delivery applies when purchasing 5 or more packs/items'
    },
    {
      id: 'rule_val_500_free',
      name: 'Free Delivery above ₹500',
      type: 'ORDER_VALUE',
      field: 'order_value',
      op: '>=',
      val: '500',
      charge: 0.0,
      free: 1,
      priority: 4,
      desc: 'Free delivery applies on order subtotal ₹500 or more'
    },
    {
      id: 'rule_val_slab_1',
      name: 'Standard Tier Under ₹300',
      type: 'ORDER_VALUE',
      field: 'order_value',
      op: '<',
      val: '300',
      charge: 60.0,
      free: 0,
      priority: 4,
      desc: '₹60 delivery charge for orders under ₹300'
    },
    {
      id: 'rule_val_slab_2',
      name: 'Standard Tier ₹300-₹499',
      type: 'ORDER_VALUE',
      field: 'order_value',
      op: '>=',
      val: '300',
      charge: 40.0,
      free: 0,
      priority: 4,
      desc: '₹40 delivery charge for orders between ₹300 and ₹499'
    }
  ];
  for (const r of rules) {
    const existing = await get('SELECT id FROM delivery_rules WHERE id = ?', [r.id]);
    if (!existing) {
      await query(
        `INSERT INTO delivery_rules (
          id, name, rule_type, condition_field, operator, condition_value, 
          delivery_charge, free_delivery, priority, is_active, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [r.id, r.name, r.type, r.field, r.op, r.val, r.charge, r.free, r.priority, r.desc]
      );
    }
  }

  // 10. Delivery Settings
  const delSettings = [
    { key: 'default_delivery_charge', val: '40.00', desc: 'Default delivery charge fallback' },
    { key: 'free_delivery_threshold', val: '500.00', desc: 'Global fallback free delivery threshold' },
    { key: 'cod_enabled', val: 'true', desc: 'Enable COD globally' },
    { key: 'min_cod_order', val: '200.00', desc: 'Minimum order amount for COD' },
    { key: 'max_cod_order', val: '5000.00', desc: 'Maximum order amount for COD' }
  ];
  for (const s of delSettings) {
    const existing = await get('SELECT id FROM delivery_settings WHERE setting_key = ?', [s.key]);
    if (!existing) {
      await query(
        'INSERT INTO delivery_settings (id, setting_key, setting_value, description) VALUES (?, ?, ?, ?)',
        [`set_${s.key}`, s.key, s.val, s.desc]
      );
    }
  }

  // 11. Coupons
  const coupons = [
    { id: 'coup_welcome10', code: 'WELCOME10', desc: '10% OFF on first purchase above ₹300', type: 'PERCENTAGE', val: 10.0, min: 300.0, max: 100.0, limit: 1 },
    { id: 'coup_crunch50', code: 'CRUNCH50', desc: 'Flat ₹50 OFF on Peanut Butter Crunch boxes', type: 'FIXED', val: 50.0, min: 400.0, max: null, limit: 2 },
    { id: 'coup_freeship', code: 'FREESHIP', desc: 'Free express shipping on orders over ₹250', type: 'FIXED', val: 40.0, min: 250.0, max: 60.0, limit: 1 }
  ];
  for (const c of coupons) {
    const existing = await get('SELECT id FROM coupons WHERE code = ?', [c.code]);
    if (!existing) {
      await query(
        `INSERT INTO coupons (
          id, code, description, discount_type, discount_value, min_order_amount, 
          max_discount_amount, is_active, per_customer_limit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [c.id, c.code, c.desc, c.type, c.val, c.min, c.max, c.limit]
      );
    }
  }

  // 12. Business Settings
  const bizSettings = [
    { key: 'store_name', val: 'Madhurai Chocolate', grp: 'GENERAL', desc: 'Brand name' },
    { key: 'store_tagline', val: 'Artisanal South Indian Handcrafted Chocolates', grp: 'GENERAL', desc: 'Brand tagline' },
    { key: 'support_email', val: 'madhuraicompany@gmail.com', grp: 'GENERAL', desc: 'Customer care email' },
    { key: 'support_phone', val: '+91 96768 23113', grp: 'GENERAL', desc: 'Customer care phone helpline' },
    { key: 'store_address', val: 'Gudur, Andhra Pradesh 524101, India', grp: 'GENERAL', desc: 'HQ address' },
    { key: 'fssai_license', val: '2018 2629000442', grp: 'GENERAL', desc: 'FSSAI License' },
    { key: 'gst_number', val: '', grp: 'GENERAL', desc: 'GSTIN (Exempt - No GST)' },
    { key: 'payment_gateway', val: 'MOCK_SANDBOX', grp: 'PAYMENT', desc: 'Payment Gateway' },
    { key: 'gateway_mode', val: 'sandbox', grp: 'PAYMENT', desc: 'Gateway Mode' },
    { key: 'upi_vpa', val: '9676823113-2@ybl', grp: 'PAYMENT', desc: 'Merchant UPI ID' },
    { key: 'free_delivery_mode', val: 'EITHER', grp: 'DELIVERY', desc: 'Free delivery evaluation mode' }
  ];
  for (const b of bizSettings) {
    const existing = await get('SELECT id FROM business_settings WHERE setting_key = ?', [b.key]);
    if (!existing) {
      await query(
        'INSERT INTO business_settings (id, setting_key, setting_value, group_name, description) VALUES (?, ?, ?, ?, ?)',
        [`set_${b.key}`, b.key, b.val, b.grp, b.desc]
      );
    } else {
      await query(
        'UPDATE business_settings SET setting_value = ? WHERE setting_key = ?',
        [b.val, b.key]
      );
    }
  }

  // 13. Articles Seed
  const sampleArticles = [
    {
      id: 'art_seed_1',
      title: 'The Art of Slow Roasting Peanuts in Gudur',
      slug: 'art-of-slow-roasting-peanuts-gudur',
      excerpt: 'How we achieve the audible snap and creamy peanut butter core inside every piece of our signature chocolate crunch.',
      content: 'At our chocolaterie in Gudur, Andhra Pradesh, crafting the perfect peanut butter crunch chocolate is both an art and a science.\n\nEvery morning, premium grade Indian peanuts are hand-sorted and slow-roasted over gentle radiant heat. Slow roasting coaxes out the natural aromatic oils without scorching the delicate legumes, preserving their natural sweetness and crisp bite.\n\nOnce roasted to golden perfection, the peanuts are ground in stone melangers into a velvety, creamy butter and folded with crunchy roasted nibs and a whisper of mineral-rich sea salt.\n\nCombined with our rich dark chocolate tempered with pure vegetable fat, zero palm oil, and zero trans fat, each bite delivers a symphony of smooth melt and audible crunch.',
      cover_image: '/uploads/chocolate-crunch-pb.jpg',
      author_name: 'Head Confectioner, Gudur',
      read_time: '4 min read',
      tags: 'Craftsmanship, Gudur, Peanuts',
      is_published: 1
    },
    {
      id: 'art_seed_2',
      title: 'Why We Choose Quality Vegetable Fat: 0% Palm Oil & Zero Trans Fat',
      slug: 'why-we-choose-vegetable-fat-zero-palm-oil',
      excerpt: 'Understanding our wholesome ingredient choices and why we strictly reject liquid palm oil and hydrogenated trans fats.',
      content: 'When we set out to craft Madhurai Chocolates in Gudur, our highest priority was clean ingredient integrity.\n\nMany mass-market confections use cheap hydrogenated palm oils and liquid fats that leave an oily residue on the palate and contain unwanted trans fats. We took a firm stance: strictly zero palm oil (no liquid fat) and zero trans fat across our entire confectionery lineup.\n\nInstead, we utilize high-quality vegetable fat and rich cocoa solids that break cleanly with an artisanal snap and melt silkily at body temperature without coating your mouth in grease.\n\nEvery box produced under our FSSAI License 2018 2629000442 is a testament to honest Indian confectionery.',
      cover_image: '/uploads/madhurai-pack-box.jpg',
      author_name: 'Madhurai Quality Team',
      read_time: '3 min read',
      tags: 'Ingredients, Zero Palm Oil, Health',
      is_published: 1
    }
  ];

  for (const art of sampleArticles) {
    const existing = await get('SELECT id FROM articles WHERE id = ? OR slug = ?', [art.id, art.slug]);
    if (!existing) {
      await query(
        `INSERT INTO articles (id, title, slug, excerpt, content, cover_image, author_name, read_time, tags, is_published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [art.id, art.title, art.slug, art.excerpt, art.content, art.cover_image, art.author_name, art.read_time, art.tags, art.is_published]
      );
    }
  }

  console.log('✅ Database seeding complete. Admin credentials:');
  console.log('   Super Admin: madhuraicompany@gmail.com / Madhurai@2026/8/9');
}

// Allow direct CLI execution: node src/db/seed.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeeds()
    .then(() => {
      console.log('🏁 Seed process finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
