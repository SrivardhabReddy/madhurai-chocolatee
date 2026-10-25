import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';
import { query, get, all } from '../../db/index.js';

const router = Router();

// ==========================================
// 1. ADMIN DASHBOARD METRICS
// ==========================================

router.get('/dashboard', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'INVENTORY_MANAGER'), async (req, res, next) => {
  try {
    // Total Orders and Revenue - ONLY add to revenue if payment is successfully completed (PAID)
    const totalOrderStats = await get(
      `SELECT COUNT(*) as total_orders, 
              COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END), 0) as total_revenue,
              COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END), 0) as paid_revenue,
              COALESCE(SUM(CASE WHEN order_status = 'CANCELLED' THEN 1 ELSE 0 END), 0) as cancelled_orders,
              COALESCE(SUM(CASE WHEN payment_method = 'COD' THEN 1 ELSE 0 END), 0) as cod_orders,
              COALESCE(SUM(CASE WHEN payment_status = 'PENDING' THEN 1 ELSE 0 END), 0) as pending_orders,
              COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN 1 ELSE 0 END), 0) as paid_orders
       FROM orders`
    );

    // Today's Stats - ONLY count completed payments toward today's revenue
    const today = new Date().toISOString().slice(0, 10);
    const todayStats = await get(
      `SELECT COUNT(*) as today_orders,
              COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END), 0) as today_revenue
       FROM orders
       WHERE created_at >= ?`,
      [`${today} 00:00:00`]
    );

    // Total Products Sold
    const productsSoldRow = await get(
      `SELECT COALESCE(SUM(quantity), 0) as products_sold FROM order_items`
    );

    // Low stock count
    const lowStockRow = await get(
      `SELECT COUNT(*) as low_stock_count FROM inventory WHERE current_stock <= low_stock_threshold`
    );

    // Refunds count & amount
    const refundStats = await get(
      `SELECT COUNT(*) as refund_count, COALESCE(SUM(amount), 0) as total_refunded FROM refunds WHERE status = 'REFUNDED'`
    );

    // Recent 10 Orders
    const recentOrders = await all(
      `SELECT id, order_number, customer_name, customer_phone, total_amount, payment_status, payment_method, order_status, created_at
       FROM orders ORDER BY created_at DESC LIMIT 10`
    );

    return res.json({
      success: true,
      data: {
        todayOrders: parseInt(todayStats?.today_orders || 0, 10),
        todayRevenue: parseFloat(todayStats?.today_revenue || 0),
        totalOrders: parseInt(totalOrderStats?.total_orders || 0, 10),
        totalRevenue: parseFloat(totalOrderStats?.total_revenue || 0),
        paidRevenue: parseFloat(totalOrderStats?.paid_revenue || 0),
        pendingOrders: parseInt(totalOrderStats?.pending_orders || 0, 10),
        paidOrders: parseInt(totalOrderStats?.paid_orders || 0, 10),
        codOrders: parseInt(totalOrderStats?.cod_orders || 0, 10),
        cancelledOrders: parseInt(totalOrderStats?.cancelled_orders || 0, 10),
        productsSold: parseInt(productsSoldRow?.products_sold || 0, 10),
        lowStock: parseInt(lowStockRow?.low_stock_count || 0, 10),
        refundsCount: parseInt(refundStats?.refund_count || 0, 10),
        totalRefunded: parseFloat(refundStats?.total_refunded || 0),
        recentOrders
      }
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. ANALYTICS & CHARTS
// ==========================================

router.get('/analytics', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { range = '30d' } = req.query;
    const days = range === '7d' ? 7 : range === 'today' ? 1 : 30;

    // Daily Sales & Revenue (Only count successfully completed payments in revenue)
    const salesTrends = await all(
      `SELECT SUBSTR(created_at, 1, 10) as date,
              COUNT(id) as orders_count,
              COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END), 0) as revenue
       FROM orders
       GROUP BY SUBSTR(created_at, 1, 10)
       ORDER BY date DESC
       LIMIT ?`,
      [days]
    );

    // Top Selling Products
    const topProducts = await all(
      `SELECT product_name_snapshot as name,
              SUM(quantity) as units_sold,
              SUM(total_item_price) as revenue
       FROM order_items
       GROUP BY product_name_snapshot
       ORDER BY units_sold DESC
       LIMIT 5`
    );

    // Payment Methods Split (Revenue only from paid orders)
    const paymentMethods = await all(
      `SELECT payment_method, COUNT(*) as count, COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END), 0) as total
       FROM orders
       GROUP BY payment_method`
    );

    // Order Status Split
    const orderStatuses = await all(
      `SELECT order_status, COUNT(*) as count FROM orders GROUP BY order_status`
    );

    // Delivery Zone Breakdown (Revenue only from paid orders)
    const zonePerformance = await all(
      `SELECT COALESCE(zone_name, 'Standard') as zone, COUNT(*) as order_count, COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END), 0) as revenue
       FROM orders
       GROUP BY zone_name
       ORDER BY order_count DESC`
    );

    return res.json({
      success: true,
      data: {
        salesTrends: salesTrends.reverse(),
        topProducts,
        paymentMethods,
        orderStatuses,
        zonePerformance
      }
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 3. CUSTOMER DIRECTORY
// ==========================================

router.get('/customers', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'), async (req, res, next) => {
  try {
    const { q } = req.query;
    let sql = `
      SELECT u.id, u.email, u.full_name, u.phone, u.created_at,
             COUNT(o.id) as total_orders,
             COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'CUSTOMER'
    `;
    const params = [];

    if (q) {
      sql += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term);
    }

    sql += ' GROUP BY u.id ORDER BY total_spent DESC LIMIT 100';
    const customers = await all(sql, params);

    return res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 4. BUSINESS SETTINGS
// ==========================================

router.get('/settings', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const settings = await all('SELECT * FROM business_settings');
    const settingsMap = settings.reduce((acc, s) => {
      acc[s.setting_key] = s.setting_value;
      return acc;
    }, {});
    return res.json({ success: true, data: settingsMap, raw: settings });
  } catch (err) {
    next(err);
  }
});

router.put('/settings', authenticate, requireRoles('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { settings = {} } = req.body;
    for (const [key, value] of Object.entries(settings)) {
      const existing = await get('SELECT id FROM business_settings WHERE setting_key = ?', [key]);
      if (existing) {
        await query('UPDATE business_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?', [
          String(value),
          key
        ]);
      } else {
        await query(
          'INSERT INTO business_settings (id, setting_key, setting_value, group_name) VALUES (?, ?, ?, "GENERAL")',
          [`set_${key}`, key, String(value)]
        );
      }
    }

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'BUSINESS_SETTINGS_UPDATE',
      entity: 'SETTINGS',
      newValue: settings,
      req
    });

    return res.json({ success: true, message: 'Settings saved successfully.' });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 5. STAFF USERS & RBAC MANAGEMENT
// ==========================================

router.get('/users', authenticate, requireRoles('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const users = await all(
      `SELECT id, email, full_name, phone, role, is_active, created_at
       FROM users
       WHERE role != 'CUSTOMER'
       ORDER BY created_at ASC`
    );
    const roles = await all('SELECT * FROM admin_roles');
    return res.json({ success: true, data: { users, roles } });
  } catch (err) {
    next(err);
  }
});

router.post('/users', authenticate, requireRoles('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { email, password, full_name, phone, role = 'ORDER_MANAGER' } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await get('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const id = `usr_staff_${Date.now()}`;

    await query(
      `INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [id, cleanEmail, hash, full_name.trim(), phone ? phone.trim() : null, role]
    );

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'STAFF_USER_CREATE',
      entity: 'USER',
      entityId: id,
      newValue: { email: cleanEmail, role, full_name },
      req
    });

    return res.status(201).json({ success: true, message: 'Staff user created successfully.', data: { id } });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 6. AUDIT LOGS
// ==========================================

router.get('/audit-logs', authenticate, requireRoles('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { action, entity, limit = 100 } = req.query;
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (action) {
      sql += ' AND action = ?';
      params.push(action);
    }
    if (entity) {
      sql += ' AND entity = ?';
      params.push(entity);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const logs = await all(sql, params);
    return res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

export default router;
