-- ==============================================================================
-- MADHURAI CHOCOLATE — INITIAL SEED DATA
-- Default Development Accounts, Catalog, Delivery Rules & Store Settings
-- Note: Passwords use bcrypt hash for 'Admin@123456' and 'Customer@123'
-- ==============================================================================

-- Admin Roles
INSERT INTO admin_roles (id, name, description) VALUES
('role_super_admin', 'SUPER_ADMIN', 'Unrestricted administrative access to all systems, settings, and audits'),
('role_admin', 'ADMIN', 'Core business management: orders, products, coupons, and delivery'),
('role_order_manager', 'ORDER_MANAGER', 'Order processing, packing, shipping dispatch, and customer support'),
('role_inventory_manager', 'INVENTORY_MANAGER', 'Catalog updates, stock levels, warehouse inventory, and restock logs')
ON CONFLICT (id) DO NOTHING;

-- Admin Permissions for SUPER_ADMIN
INSERT INTO admin_permissions (id, role_id, module, can_read, can_write, can_delete, can_manage) VALUES
('perm_sa_prod', 'role_super_admin', 'PRODUCTS', 1, 1, 1, 1),
('perm_sa_ord', 'role_super_admin', 'ORDERS', 1, 1, 1, 1),
('perm_sa_inv', 'role_super_admin', 'INVENTORY', 1, 1, 1, 1),
('perm_sa_del', 'role_super_admin', 'DELIVERY', 1, 1, 1, 1),
('perm_sa_coup', 'role_super_admin', 'COUPONS', 1, 1, 1, 1),
('perm_sa_cust', 'role_super_admin', 'CUSTOMERS', 1, 1, 1, 1),
('perm_sa_pay', 'role_super_admin', 'PAYMENTS', 1, 1, 1, 1),
('perm_sa_set', 'role_super_admin', 'SETTINGS', 1, 1, 1, 1),
('perm_sa_rol', 'role_super_admin', 'ROLES', 1, 1, 1, 1),
('perm_sa_aud', 'role_super_admin', 'AUDIT', 1, 1, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Admin Permissions for INVENTORY_MANAGER
INSERT INTO admin_permissions (id, role_id, module, can_read, can_write, can_delete, can_manage) VALUES
('perm_inv_prod', 'role_inventory_manager', 'PRODUCTS', 1, 1, 0, 0),
('perm_inv_inv', 'role_inventory_manager', 'INVENTORY', 1, 1, 0, 1),
('perm_inv_ord', 'role_inventory_manager', 'ORDERS', 1, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Admin Permissions for ORDER_MANAGER
INSERT INTO admin_permissions (id, role_id, module, can_read, can_write, can_delete, can_manage) VALUES
('perm_ord_ord', 'role_order_manager', 'ORDERS', 1, 1, 0, 1),
('perm_ord_cust', 'role_order_manager', 'CUSTOMERS', 1, 0, 0, 0),
('perm_ord_del', 'role_order_manager', 'DELIVERY', 1, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Users (Hashed password for 'Admin@123456' is $2a$10$wT0E8YIovsW5oQyA8Wb2zOCa89tVjGv1P2Gq/O8fOQ8M9rI.3v0.C)
-- Hashed password for 'Customer@123' is $2a$10$64R1EsuY/o02hZg6rV8rZezc4pQeRk4xM17/D8YgO4uRz0gO4bYj2
INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active) VALUES
('usr_madhurai_company', 'madhuraicompany@gmail.com', '$2b$10$lx0Cq2eCacGOY9Z0NhHgH.EdFqrUXJ//mu9FizComKI3ySvGExNnq', 'Madhurai Company Admin', '+91 98765 00000', 'SUPER_ADMIN', 1)
ON CONFLICT (id) DO NOTHING;

-- Categories
INSERT INTO categories (id, name, slug, description, image_url, display_order, is_active) VALUES
('cat_crunch_specials', 'Peanut Butter Crunch Specials', 'peanut-butter-crunch-specials', 'Our legendary center-filled peanut butter and crispy crunchy chocolate creations.', '/uploads/chocolate-crunch-pb.jpg', 1, 1),
('cat_festive_boxes', 'Festive Gift Boxes', 'festive-gift-boxes', 'Royal handcrafted boxes for celebrations, weddings, and premium gifting.', '/uploads/madhurai-pack-box.jpg', 2, 1),
('cat_dark_truffles', 'Dark Artisanal Truffles', 'dark-artisanal-truffles', 'Single-origin South Indian cocoa beans blended into silky melt-in-mouth truffles.', '/uploads/chocolate-crunch-pb.jpg', 3, 1),
('cat_chocolate_slabs', 'Gourmet Slabs & Bars', 'gourmet-slabs-bars', 'Thick decadent chocolate slabs loaded with slow-roasted nuts.', '/uploads/madhurai-hero-banner.jpg', 4, 1)
ON CONFLICT (id) DO NOTHING;

-- Products
-- 1. Main Product: Chocolate Crunch Peanut Butter Inside
INSERT INTO products (id, name, slug, description, category_id, mrp, selling_price, discount, stock, weight, selling_unit, pieces_per_pack, ingredients, nutrition, delivery_available, cod_available, status, is_featured, is_bestseller, is_new) VALUES
('prod_main_pb_crunch', 
 'Chocolate Crunch Peanut Butter Inside', 
 'chocolate-crunch-peanut-butter-inside', 
 'Experience pure artisanal bliss: crisp dark chocolate shell filled to the brim with roasted golden peanut butter, crushed crunchy peanut nibs, and a whisper of Madurai sea salt. Each piece is individually wrapped for peak freshness. Perfect for gifting or personal indulgence.', 
 'cat_crunch_specials', 
 450.00, 
 400.00, 
 11.11, 
 150, 
 '500g', 
 'BOX', 
 40, 
 'Dark Cocoa Mass (55%), Roasted Peanuts (28%), Brown Cane Sugar, Vegetable Fat, Emulsifier (INS 322 Sunflower Lecithin), Natural Madagascan Vanilla Extract, Sea Salt. Contains Peanuts. 0% Palm Oil & Zero Trans Fat.', 
 '{"serving_size":"1 piece (12.5g)","calories":"68 kcal","protein":"2.2g","total_fat":"4.6g","saturated_fat":"2.1g","trans_fat":"0g","carbohydrates":"5.1g","dietary_fiber":"0.8g","sugars":"3.8g","sodium":"18mg"}', 
 1, 
 1, 
 'ACTIVE', 
 1, 
 1, 
 0),

-- 2. Royal Heritage Festive Box
('prod_royal_festive_box', 
 'Madhurai Royal Heritage Festive Box', 
 'madhurai-royal-heritage-festive-box', 
 'A grand 80-piece collection celebrating South Indian chocolate craftsmanship. Encased in our signature gold-embossed filigree keepsake box, featuring an assortment of Peanut Butter Crunch, Roasted Almond Pralines, and Dark Silk Truffles.', 
 'cat_festive_boxes', 
 999.00, 
 850.00, 
 14.91, 
 60, 
 '1000g', 
 'BOX', 
 80, 
 'Cocoa Solids (60%), Roasted Peanuts, Roasted California Almonds, Vegetable Fat, Raw Cane Sugar, Milk Solids, Natural Vanilla. Zero Trans Fat.', 
 '{"serving_size":"2 pieces (25g)","calories":"135 kcal","protein":"3.8g","total_fat":"8.9g","saturated_fat":"4.2g","trans_fat":"0g","carbohydrates":"11.2g","dietary_fiber":"1.5g","sugars":"7.9g","sodium":"24mg"}', 
 1, 
 1, 
 'ACTIVE', 
 1, 
 1, 
 1),

-- 3. Dark Truffle Silk Bites
('prod_dark_truffle_bites', 
 'Dark Truffle Silk Bites', 
 'dark-truffle-silk-bites', 
 'Intense 70% dark cocoa ganache truffles dusted with Dutch-processed bitter cocoa powder. Velvety, smooth, and deeply satisfying for dark chocolate connoisseurs.', 
 'cat_dark_truffles', 
 280.00, 
 240.00, 
 14.28, 
 90, 
 '250g', 
 'BOX', 
 20, 
 'Single-Origin Cocoa Mass (70%), Vegetable Fat, Dark Cane Jaggery, Fresh Dairy Cream, Dutch Cocoa Powder. Zero Palm Oil.', 
 '{"serving_size":"1 piece (12.5g)","calories":"62 kcal","protein":"1.4g","total_fat":"4.8g","saturated_fat":"3.0g","trans_fat":"0g","carbohydrates":"4.2g","dietary_fiber":"1.1g","sugars":"2.9g","sodium":"8mg"}', 
 1, 
 1, 
 'ACTIVE', 
 0, 
 0, 
 1),

-- 4. Roasted Peanut Butter Chocolate Slab
('prod_pb_slab', 
 'Roasted Peanut Butter Chocolate Slab', 
 'roasted-peanut-butter-chocolate-slab', 
 'Hand-poured thick gourmet slab of milk chocolate swirled with stone-ground chunky peanut butter and sea salt.', 
 'cat_chocolate_slabs', 
 180.00, 
 160.00, 
 11.11, 
 120, 
 '200g', 
 'PIECE', 
 1, 
 'Milk Chocolate (50%), Stone-Ground Peanut Butter (35%), Sugar, Roasted Peanuts, Himalayan Pink Salt.', 
 '{"serving_size":"25g","calories":"142 kcal","protein":"3.2g","total_fat":"9.4g","saturated_fat":"4.1g","trans_fat":"0g","carbohydrates":"12.0g","dietary_fiber":"1.2g","sugars":"9.1g","sodium":"30mg"}', 
 1, 
 1, 
 'ACTIVE', 
 1, 
 0, 
 0)
ON CONFLICT (id) DO NOTHING;

-- Product Images
INSERT INTO product_images (id, product_id, image_url, alt_text, display_order, is_primary) VALUES
('img_pb_1', 'prod_main_pb_crunch', '/uploads/chocolate-crunch-pb.jpg', 'Chocolate Crunch Peanut Butter Inside - Broken bite showing creamy center', 1, 1),
('img_pb_2', 'prod_main_pb_crunch', '/uploads/madhurai-pack-box.jpg', 'Madhurai Chocolate 500g 40 pieces luxury gold gift box', 2, 0),
('img_festive_1', 'prod_royal_festive_box', '/uploads/madhurai-pack-box.jpg', 'Madhurai Royal Heritage Festive 80-piece Gift Box', 1, 1),
('img_truffle_1', 'prod_dark_truffle_bites', '/uploads/chocolate-crunch-pb.jpg', 'Dark Truffle Silk Bites 20 pieces', 1, 1),
('img_slab_1', 'prod_pb_slab', '/uploads/madhurai-hero-banner.jpg', 'Roasted Peanut Butter Chocolate Slab 200g', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Inventory Setup
INSERT INTO inventory (id, product_id, current_stock, reserved_stock, low_stock_threshold) VALUES
('inv_prod_pb', 'prod_main_pb_crunch', 150, 0, 20),
('inv_festive', 'prod_royal_festive_box', 60, 0, 10),
('inv_truffle', 'prod_dark_truffle_bites', 90, 0, 15),
('inv_slab', 'prod_pb_slab', 120, 0, 25)
ON CONFLICT (id) DO NOTHING;

-- Initial Stock Transactions
INSERT INTO inventory_transactions (id, product_id, type, quantity, previous_stock, new_stock, reference_id, notes, created_by) VALUES
('tx_seed_1', 'prod_main_pb_crunch', 'RESTOCK', 150, 0, 150, 'BATCH-2026-PB01', 'Initial warehouse batch production', 'usr_super_admin'),
('tx_seed_2', 'prod_royal_festive_box', 'RESTOCK', 60, 0, 60, 'BATCH-2026-FEST01', 'Initial festive run', 'usr_super_admin'),
('tx_seed_3', 'prod_dark_truffle_bites', 'RESTOCK', 90, 0, 90, 'BATCH-2026-TRUF01', 'Artisan truffle batch', 'usr_super_admin'),
('tx_seed_4', 'prod_pb_slab', 'RESTOCK', 120, 0, 120, 'BATCH-2026-SLAB01', 'Fresh pour slab batch', 'usr_super_admin')
ON CONFLICT (id) DO NOTHING;

-- Delivery Zones
INSERT INTO delivery_zones (id, name, zone_type, state, district, city, description, is_active) VALUES
('zone_south_metro', 'South India Metros & Express Hubs', 'STATE', 'Tamil Nadu, Karnataka, Andhra Pradesh, Telangana', NULL, NULL, 'Standard 2-3 business days express delivery', 1),
('zone_rest_of_india', 'Rest of India', 'STATE', 'All States', NULL, NULL, 'Standard 3-5 business days delivery', 1)
ON CONFLICT (id) DO NOTHING;

-- Serviceable Pincodes (Sample across key cities & prompt sample 524xxx)
INSERT INTO delivery_pincodes (id, pincode, zone_id, city, district, state, is_serviceable, cod_available, delivery_charge, min_delivery_days, max_delivery_days, status) VALUES
('pin_524101', '524101', 'zone_south_metro', 'Gudur', 'SPSR Nellore', 'Andhra Pradesh', 1, 1, 30.0, 1, 2, 'ACTIVE'),
('pin_524102', '524102', 'zone_south_metro', 'Gudur', 'SPSR Nellore', 'Andhra Pradesh', 1, 1, 30.0, 1, 2, 'ACTIVE'),
('pin_524001', '524001', 'zone_south_metro', 'Nellore', 'SPSR Nellore', 'Andhra Pradesh', 1, 1, 40.0, 2, 4, 'ACTIVE'),
('pin_524002', '524002', 'zone_south_metro', 'Nellore', 'SPSR Nellore', 'Andhra Pradesh', 1, 1, 40.0, 2, 4, 'ACTIVE'),
('pin_524003', '524003', 'zone_south_metro', 'Nellore', 'SPSR Nellore', 'Andhra Pradesh', 1, 1, 40.0, 2, 4, 'ACTIVE'),
('pin_517501', '517501', 'zone_south_metro', 'Tirupati', 'Tirupati', 'Andhra Pradesh', 1, 1, 40.0, 2, 3, 'ACTIVE'),
('pin_524121', '524121', 'zone_south_metro', 'Sullurpeta', 'Tirupati', 'Andhra Pradesh', 1, 1, 40.0, 2, 3, 'ACTIVE'),
('pin_524126', '524126', 'zone_south_metro', 'Naidupeta', 'Tirupati', 'Andhra Pradesh', 1, 1, 40.0, 2, 3, 'ACTIVE'),
('pin_524201', '524201', 'zone_south_metro', 'Kavali', 'SPSR Nellore', 'Andhra Pradesh', 1, 1, 40.0, 2, 4, 'ACTIVE'),
('pin_524132', '524132', 'zone_south_metro', 'Venkatagiri', 'Tirupati', 'Andhra Pradesh', 1, 1, 40.0, 2, 3, 'ACTIVE'),
('pin_625001', '625001', 'zone_south_metro', 'Madurai', 'Madurai', 'Tamil Nadu', 1, 1, 30.0, 1, 2, 'ACTIVE'),
('pin_600001', '600001', 'zone_south_metro', 'Chennai', 'Chennai', 'Tamil Nadu', 1, 1, 40.0, 2, 3, 'ACTIVE'),
('pin_560001', '560001', 'zone_south_metro', 'Bengaluru', 'Bengaluru Urban', 'Karnataka', 1, 1, 40.0, 2, 3, 'ACTIVE'),
('pin_500001', '500001', 'zone_south_metro', 'Hyderabad', 'Hyderabad', 'Telangana', 1, 1, 40.0, 2, 3, 'ACTIVE'),
('pin_400001', '400001', 'zone_rest_of_india', 'Mumbai', 'Mumbai City', 'Maharashtra', 1, 1, 50.0, 3, 5, 'ACTIVE'),
('pin_110001', '110001', 'zone_rest_of_india', 'New Delhi', 'Central Delhi', 'Delhi', 1, 1, 50.0, 3, 5, 'ACTIVE'),
('pin_700001', '700001', 'zone_rest_of_india', 'Kolkata', 'Kolkata', 'West Bengal', 1, 1, 50.0, 3, 5, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Delivery Rules (Implementing the prompt's exact rules!)
-- Rule 1: Free delivery when item quantity >= 5 pieces/boxes
INSERT INTO delivery_rules (id, name, rule_type, condition_field, operator, condition_value, delivery_charge, free_delivery, priority, is_active, description) VALUES
('rule_qty_5_free', 'Free Delivery on 5+ Units', 'QUANTITY', 'quantity', '>=', '5', 0.0, 1, 4, 1, 'Free delivery automatically applies whenever customer purchases 5 or more packs/items'),

-- Rule 2: Free delivery when order value >= ₹500
('rule_val_500_free', 'Free Delivery above ₹500', 'ORDER_VALUE', 'order_value', '>=', '500', 0.0, 1, 4, 1, 'Free delivery automatically applies for any order with subtotal ₹500 or more'),

-- Rule 3: Tiered value rule: ₹0-₹299 = ₹60, ₹300-₹499 = ₹40, ₹500+ = FREE
('rule_val_slab_1', 'Standard Tier Under ₹300', 'ORDER_VALUE', 'order_value', '<', '300', 60.0, 0, 4, 1, 'Delivery charge is ₹60 for small orders under ₹300'),
('rule_val_slab_2', 'Standard Tier ₹300-₹499', 'ORDER_VALUE', 'order_value', '>=', '300', 40.0, 0, 4, 1, 'Delivery charge is ₹40 for medium orders ₹300-₹499')
ON CONFLICT (id) DO NOTHING;

-- Delivery Global Settings
INSERT INTO delivery_settings (id, setting_key, setting_value, description) VALUES
('set_default_charge', 'default_delivery_charge', '40.00', 'Default delivery charge if no specific rule matches'),
('set_free_threshold', 'free_delivery_threshold', '500.00', 'Global fallback free delivery cart threshold in INR'),
('set_cod_enabled', 'cod_enabled', 'true', 'Global toggle for Cash on Delivery'),
('set_min_cod_order', 'min_cod_order', '200.00', 'Minimum order value required to allow COD'),
('set_max_cod_order', 'max_cod_order', '5000.00', 'Maximum order value allowed for COD to prevent risk')
ON CONFLICT (id) DO NOTHING;

-- Promotional Coupons
INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, is_active, per_customer_limit) VALUES
('coup_welcome10', 'WELCOME10', 'Get 10% OFF on your purchase', 'PERCENTAGE', 10.0, 0.00, 100.00, 1, 1),
('coup_crunch50', 'CRUNCH50', 'Flat ₹50 OFF on Peanut Butter Crunch boxes', 'FIXED', 50.0, 0.00, NULL, 1, 2),
('coup_freeship', 'FREESHIP', 'Free express shipping on your order', 'FIXED', 40.0, 0.00, 60.00, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Business Settings
INSERT INTO business_settings (id, setting_key, setting_value, group_name, description) VALUES
('set_biz_name', 'store_name', 'Madhurai Chocolate', 'GENERAL', 'Official brand name'),
('set_biz_tagline', 'store_tagline', 'Artisanal South Indian Handcrafted Chocolates', 'GENERAL', 'Brand tagline'),
('set_biz_email', 'support_email', 'madhuraicompany@gmail.com', 'GENERAL', 'Customer care email'),
('set_biz_phone', 'support_phone', '+91 96768 23113', 'GENERAL', 'Customer care helpline'),
('set_biz_address', 'store_address', 'Gudur, Andhra Pradesh 524101, India', 'GENERAL', 'Factory & HQ registered address'),
('set_biz_fssai', 'fssai_license', '2018 2629000442', 'GENERAL', 'Food Safety and Standards Authority of India (FSSAI) License No.'),
('set_biz_gst', 'gst_number', '', 'GENERAL', 'GST Identification Number (Exempt - No GST)'),
('set_pay_gateway', 'payment_gateway', 'MOCK_SANDBOX', 'PAYMENT', 'Active payment gateway: MOCK_SANDBOX / CASHFREE / RAZORPAY / PHONEPE'),
('set_pay_mode', 'gateway_mode', 'sandbox', 'PAYMENT', 'Gateway environment: sandbox / live'),
('set_pay_upi_vpa', 'upi_vpa', '9676823113-2@ybl', 'PAYMENT', 'Merchant UPI VPA handle for dynamic QR creation'),
('set_del_free_rule', 'free_delivery_mode', 'EITHER', 'DELIVERY', 'Free delivery evaluation mode: EITHER, BOTH, VALUE_ONLY, QTY_ONLY')
ON CONFLICT (id) DO NOTHING;

-- Initial Published Articles
INSERT INTO articles (id, title, slug, excerpt, content, cover_image, author_name, read_time, tags, is_published) VALUES
('art_seed_1', 'The Art of Slow Roasting Peanuts in Gudur', 'art-of-slow-roasting-peanuts-gudur', 'How we achieve the audible snap and creamy peanut butter core inside every piece of our signature chocolate crunch.', 'At our chocolaterie in Gudur, Andhra Pradesh, crafting the perfect peanut butter crunch chocolate is both an art and a science.\n\nEvery morning, premium grade Indian peanuts are hand-sorted and slow-roasted over gentle radiant heat. Slow roasting coaxes out the natural aromatic oils without scorching the delicate legumes, preserving their natural sweetness and crisp bite.\n\nOnce roasted to golden perfection, the peanuts are ground in stone melangers into a velvety, creamy butter and folded with crunchy roasted nibs and a whisper of mineral-rich sea salt.\n\nCombined with our rich dark chocolate tempered with pure vegetable fat, zero palm oil, and zero trans fat, each bite delivers a symphony of smooth melt and audible crunch.', '/uploads/chocolate-crunch-pb.jpg', 'Head Confectioner, Gudur', '4 min read', 'Craftsmanship, Gudur, Peanuts', 1),
('art_seed_2', 'Why We Choose Quality Vegetable Fat: 0% Palm Oil & Zero Trans Fat', 'why-we-choose-vegetable-fat-zero-palm-oil', 'Understanding our wholesome ingredient choices and why we strictly reject liquid palm oil and hydrogenated trans fats.', 'When we set out to craft Madhurai Chocolates in Gudur, our highest priority was clean ingredient integrity.\n\nMany mass-market confections use cheap hydrogenated palm oils and liquid fats that leave an oily residue on the palate and contain unwanted trans fats. We took a firm stance: strictly zero palm oil (no liquid fat) and zero trans fat across our entire confectionery lineup.\n\nInstead, we utilize high-quality vegetable fat and rich cocoa solids that break cleanly with an artisanal snap and melt silkily at body temperature without coating your mouth in grease.\n\nEvery box produced under our FSSAI License 2018 2629000442 is a testament to honest Indian confectionery.', '/uploads/madhurai-pack-box.jpg', 'Madhurai Quality Team', '3 min read', 'Ingredients, Zero Palm Oil, Health', 1)
ON CONFLICT (id) DO NOTHING;

