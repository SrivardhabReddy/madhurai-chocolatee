-- ==============================================================================
-- MADHURAI CHOCOLATE — PRODUCTION DATABASE SCHEMA
-- Compatible with PostgreSQL 14+ and Relational SQLite Fallback
-- ==============================================================================

-- 1. Users Table (Core identity for both customers and staff)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'CUSTOMER', -- 'CUSTOMER', 'SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'INVENTORY_MANAGER'
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Admin Roles
CREATE TABLE IF NOT EXISTS admin_roles (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL, -- 'SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'INVENTORY_MANAGER'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Admin Permissions
CREATE TABLE IF NOT EXISTS admin_permissions (
    id TEXT PRIMARY KEY,
    role_id TEXT NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
    module TEXT NOT NULL, -- 'PRODUCTS', 'ORDERS', 'INVENTORY', 'DELIVERY', 'COUPONS', 'CUSTOMERS', 'PAYMENTS', 'SETTINGS', 'ROLES', 'AUDIT'
    can_read INTEGER NOT NULL DEFAULT 1,
    can_write INTEGER NOT NULL DEFAULT 0,
    can_delete INTEGER NOT NULL DEFAULT 0,
    can_manage INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Customer Addresses
CREATE TABLE IF NOT EXISTS addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    house_building TEXT NOT NULL,
    street TEXT NOT NULL,
    area TEXT NOT NULL,
    landmark TEXT,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Product Categories
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Products Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    mrp REAL NOT NULL,
    selling_price REAL NOT NULL,
    discount REAL NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    weight TEXT NOT NULL, -- e.g. '500g', '250g', '1kg'
    selling_unit TEXT NOT NULL DEFAULT 'BOX', -- 'PIECE', 'PACK', 'BOX', 'KG', 'GRAM'
    pieces_per_pack INTEGER NOT NULL DEFAULT 1,
    ingredients TEXT,
    nutrition TEXT, -- JSON string or text summary of calories, fats, carbs, protein
    delivery_available INTEGER NOT NULL DEFAULT 1,
    cod_available INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DRAFT'
    is_featured INTEGER NOT NULL DEFAULT 0,
    is_bestseller INTEGER NOT NULL DEFAULT 0,
    is_new INTEGER NOT NULL DEFAULT 0,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Product Images
CREATE TABLE IF NOT EXISTS product_images (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Inventory & Stock Tracking
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    product_id TEXT UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    current_stock INTEGER NOT NULL DEFAULT 0,
    reserved_stock INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Inventory Transactions (Full Audit Trail)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'SALE', 'RESTOCK', 'CANCELLATION', 'RETURN', 'DAMAGED', 'EXPIRED', 'MANUAL_ADJUSTMENT'
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reference_id TEXT, -- e.g. Order ID or Admin User ID
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Delivery Zones
CREATE TABLE IF NOT EXISTS delivery_zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    zone_type TEXT NOT NULL DEFAULT 'STATE', -- 'STATE', 'DISTRICT', 'CITY', 'CUSTOM'
    state TEXT,
    district TEXT,
    city TEXT,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Delivery Pincodes
CREATE TABLE IF NOT EXISTS delivery_pincodes (
    id TEXT PRIMARY KEY,
    pincode TEXT UNIQUE NOT NULL,
    zone_id TEXT REFERENCES delivery_zones(id) ON DELETE SET NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    is_serviceable INTEGER NOT NULL DEFAULT 1,
    cod_available INTEGER NOT NULL DEFAULT 1,
    delivery_charge REAL NOT NULL DEFAULT 40.0,
    min_delivery_days INTEGER NOT NULL DEFAULT 2,
    max_delivery_days INTEGER NOT NULL DEFAULT 5,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Delivery Rules (Flexible Delivery & Free Delivery Rule Engine)
CREATE TABLE IF NOT EXISTS delivery_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rule_type TEXT NOT NULL, -- 'GLOBAL', 'QUANTITY', 'ORDER_VALUE', 'PINCODE', 'AREA', 'PRODUCT'
    condition_field TEXT,    -- 'quantity', 'order_value', 'pincode', 'zone_id', 'product_id'
    operator TEXT,           -- '>=', '<=', '=', 'IN'
    condition_value TEXT,    -- e.g. '5' for 5 pieces, '500' for ₹500
    delivery_charge REAL NOT NULL DEFAULT 0.0,
    free_delivery INTEGER NOT NULL DEFAULT 1,
    priority INTEGER NOT NULL DEFAULT 10, -- 1 = highest (Product), 2 = Pincode, 3 = Area, 4 = Quantity/Value, 5 = Global
    is_active INTEGER NOT NULL DEFAULT 1,
    zone_id TEXT,
    pincode TEXT,
    product_id TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Delivery Settings
CREATE TABLE IF NOT EXISTS delivery_settings (
    id TEXT PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Coupons & Promotions
CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL DEFAULT 'PERCENTAGE', -- 'PERCENTAGE', 'FIXED'
    discount_value REAL NOT NULL,
    min_order_amount REAL NOT NULL DEFAULT 0.0,
    max_discount_amount REAL, -- null for unlimited
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    usage_limit INTEGER, -- total times coupon can be used
    per_customer_limit INTEGER NOT NULL DEFAULT 1,
    product_id TEXT, -- restricted to specific product
    category_id TEXT, -- restricted to specific category
    pincode TEXT,     -- restricted to specific pincode
    is_active INTEGER NOT NULL DEFAULT 1,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Coupon Usage Tracking
CREATE TABLE IF NOT EXISTS coupon_usage (
    id TEXT PRIMARY KEY,
    coupon_id TEXT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id TEXT,
    customer_phone TEXT,
    order_id TEXT NOT NULL,
    discount_applied REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Shopping Carts (Server-side persistence)
CREATE TABLE IF NOT EXISTS carts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY,
    cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cart_id, product_id)
);

-- 18. Orders (Human-readable order ID MC-2026-XXXXXX)
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL, -- Full formatted address snapshot
    pincode TEXT NOT NULL,
    zone_name TEXT,
    subtotal REAL NOT NULL,
    discount_amount REAL NOT NULL DEFAULT 0.0,
    coupon_id TEXT,
    coupon_code TEXT,
    delivery_charge REAL NOT NULL DEFAULT 0.0,
    is_free_delivery INTEGER NOT NULL DEFAULT 0,
    tax_amount REAL NOT NULL DEFAULT 0.0,
    total_amount REAL NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'FAILED', 'REFUNDED'
    payment_method TEXT NOT NULL, -- 'UPI_QR', 'UPI_INTENT', 'CARD', 'NET_BANKING', 'COD'
    order_status TEXT NOT NULL DEFAULT 'ORDER_PLACED', 
    -- 'ORDER_PLACED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUND_REQUESTED', 'REFUNDED', 'COD_COLLECTED'
    cod_collected INTEGER NOT NULL DEFAULT 0,
    estimated_min_days INTEGER NOT NULL DEFAULT 2,
    estimated_max_days INTEGER NOT NULL DEFAULT 5,
    customer_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. Order Items (Snapshot of price, weight, pieces at purchase time)
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name_snapshot TEXT NOT NULL,
    selling_unit_snapshot TEXT NOT NULL,
    pieces_per_pack_snapshot INTEGER NOT NULL,
    weight_snapshot TEXT NOT NULL,
    mrp_snapshot REAL NOT NULL,
    price_snapshot REAL NOT NULL,
    quantity INTEGER NOT NULL,
    total_item_price REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 20. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    gateway TEXT NOT NULL, -- 'CASHFREE', 'RAZORPAY', 'PHONEPE', 'MOCK_SANDBOX'
    gateway_order_id TEXT,
    gateway_payment_id TEXT,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'
    payment_method TEXT NOT NULL,
    upi_qr_string TEXT,
    idempotency_key TEXT UNIQUE,
    raw_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 21. Payment Webhook Events (Idempotency & Verification Trail)
CREATE TABLE IF NOT EXISTS payment_events (
    id TEXT PRIMARY KEY,
    payment_id TEXT REFERENCES payments(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    signature_verified INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 22. Refunds Table
CREATE TABLE IF NOT EXISTS refunds (
    id TEXT PRIMARY KEY,
    payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    gateway_refund_id TEXT,
    amount REAL NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'REFUND_REQUESTED', -- 'REFUND_REQUESTED', 'REFUND_PROCESSING', 'REFUNDED', 'REFUND_FAILED'
    initiated_by TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 23. Notifications Log
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    channel TEXT NOT NULL, -- 'EMAIL', 'SMS', 'WHATSAPP'
    recipient TEXT NOT NULL,
    subject TEXT,
    content TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'ORDER_PLACED', 'PAYMENT_SUCCESS', 'SHIPPED', 'DELIVERED', 'REFUND'
    status TEXT NOT NULL DEFAULT 'SENT', -- 'QUEUED', 'SENT', 'FAILED'
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 24. Audit Logs (Complete Admin Activity Tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT,
    admin_email TEXT,
    action TEXT NOT NULL, -- 'LOGIN', 'PRODUCT_CREATE', 'PRICE_CHANGE', 'STOCK_CHANGE', 'STATUS_CHANGE', 'REFUND', 'COD_COLLECT', 'COUPON_CREATE', etc.
    entity TEXT NOT NULL, -- 'PRODUCT', 'ORDER', 'DELIVERY_RULE', 'INVENTORY', 'SETTINGS', 'COUPON'
    entity_id TEXT,
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 25. Business & Store Settings
CREATE TABLE IF NOT EXISTS business_settings (
    id TEXT PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    group_name TEXT NOT NULL DEFAULT 'GENERAL', -- 'GENERAL', 'PAYMENT', 'DELIVERY', 'COD', 'NOTIFICATION', 'SECURITY'
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 26. Articles & Journal Stories
CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    cover_image TEXT,
    author_name TEXT DEFAULT 'Madhurai Chocolatier',
    read_time TEXT DEFAULT '3 min read',
    tags TEXT,
    is_published INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_pincodes_pincode ON delivery_pincodes(pincode);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
