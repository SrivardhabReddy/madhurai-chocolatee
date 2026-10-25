import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';
import { query, get, all, transaction } from '../../db/index.js';

const router = Router();

// Get Inventory Overview (Stock levels, low stock count, out of stock)
router.get('/admin/overview', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'), async (req, res, next) => {
  try {
    const { status_filter } = req.query; // 'low_stock', 'out_of_stock'

    let sql = `
      SELECT p.id as product_id, p.name as product_name, p.slug, p.weight, p.selling_unit, p.pieces_per_pack,
             i.current_stock, i.reserved_stock, i.low_stock_threshold,
             c.name as category_name,
             (CASE WHEN i.current_stock <= 0 THEN 'OUT_OF_STOCK'
                   WHEN i.current_stock <= i.low_stock_threshold THEN 'LOW_STOCK'
                   ELSE 'IN_STOCK' END) as stock_status
      FROM products p
      JOIN inventory i ON p.id = i.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.deleted_at IS NULL
    `;

    if (status_filter === 'low_stock') {
      sql += ' AND i.current_stock > 0 AND i.current_stock <= i.low_stock_threshold';
    } else if (status_filter === 'out_of_stock') {
      sql += ' AND i.current_stock <= 0';
    }

    sql += ' ORDER BY i.current_stock ASC';
    const inventoryList = await all(sql);

    // Summary counts
    const totalProducts = inventoryList.length;
    const lowStockCount = inventoryList.filter(i => i.stock_status === 'LOW_STOCK').length;
    const outOfStockCount = inventoryList.filter(i => i.stock_status === 'OUT_OF_STOCK').length;

    return res.json({
      success: true,
      data: {
        items: inventoryList,
        summary: {
          totalProducts,
          lowStockCount,
          outOfStockCount
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// Restock Product
router.post('/admin/restock', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'), async (req, res, next) => {
  try {
    const { product_id, quantity, reference_id, notes } = req.body;
    const qty = parseInt(quantity, 10);
    if (!product_id || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid product ID and positive restock quantity are required.' });
    }

    const prod = await get('SELECT * FROM products WHERE id = ?', [product_id]);
    if (!prod) return res.status(404).json({ success: false, message: 'Product not found.' });

    const inv = await get('SELECT * FROM inventory WHERE product_id = ?', [product_id]);
    const prevStock = inv ? inv.current_stock : prod.stock;
    const newStock = prevStock + qty;

    await transaction(async (tx) => {
      await tx.query('UPDATE inventory SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?', [
        newStock,
        product_id
      ]);
      await tx.query('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        newStock,
        product_id
      ]);

      const txId = `tx_restock_${Date.now()}`;
      await tx.query(
        `INSERT INTO inventory_transactions (id, product_id, type, quantity, previous_stock, new_stock, reference_id, notes, created_by)
         VALUES (?, ?, 'RESTOCK', ?, ?, ?, ?, ?, ?)`,
        [txId, product_id, qty, prevStock, newStock, reference_id || 'MANUAL_RESTOCK', notes || 'Stock replenishment', req.user.email]
      );
    });

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'INVENTORY_RESTOCK',
      entity: 'INVENTORY',
      entityId: product_id,
      oldValue: { stock: prevStock },
      newValue: { stock: newStock, added: qty },
      req
    });

    return res.json({
      success: true,
      message: `Successfully restocked ${qty} units for ${prod.name}. New stock: ${newStock}.`,
      data: { new_stock: newStock, prev_stock: prevStock }
    });
  } catch (err) {
    next(err);
  }
});

// Manual Stock Adjustment (DAMAGED, EXPIRED, RETURN, MANUAL_ADJUSTMENT)
router.post('/admin/adjust', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'), async (req, res, next) => {
  try {
    const { product_id, adjustment_type, quantity, notes } = req.body;
    const validTypes = ['DAMAGED', 'EXPIRED', 'RETURN', 'MANUAL_ADJUSTMENT'];
    if (!validTypes.includes(adjustment_type)) {
      return res.status(400).json({ success: false, message: `Invalid adjustment type. Must be one of: ${validTypes.join(', ')}` });
    }

    const qty = parseInt(quantity, 10);
    if (!product_id || isNaN(qty) || qty === 0) {
      return res.status(400).json({ success: false, message: 'Product ID and non-zero quantity required.' });
    }

    const prod = await get('SELECT * FROM products WHERE id = ?', [product_id]);
    if (!prod) return res.status(404).json({ success: false, message: 'Product not found.' });

    const inv = await get('SELECT * FROM inventory WHERE product_id = ?', [product_id]);
    const prevStock = inv ? inv.current_stock : prod.stock;
    
    // If negative change (damaged/expired), reduce stock. If return, increase stock.
    let delta = qty;
    if (['DAMAGED', 'EXPIRED'].includes(adjustment_type) && delta > 0) {
      delta = -delta;
    }

    const newStock = Math.max(0, prevStock + delta);

    await transaction(async (tx) => {
      await tx.query('UPDATE inventory SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?', [
        newStock,
        product_id
      ]);
      await tx.query('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        newStock,
        product_id
      ]);

      const txId = `tx_adj_${Date.now()}`;
      await tx.query(
        `INSERT INTO inventory_transactions (id, product_id, type, quantity, previous_stock, new_stock, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [txId, product_id, adjustment_type, Math.abs(delta), prevStock, newStock, notes || 'Manual adjustment', req.user.email]
      );
    });

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: `INVENTORY_${adjustment_type}`,
      entity: 'INVENTORY',
      entityId: product_id,
      oldValue: { stock: prevStock },
      newValue: { stock: newStock, delta },
      req
    });

    return res.json({ success: true, message: `Stock adjusted. New stock: ${newStock}.` });
  } catch (err) {
    next(err);
  }
});

// Inventory Transaction Log (Audit Trail)
router.get('/admin/transactions', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'), async (req, res, next) => {
  try {
    const { product_id, type, limit = 100 } = req.query;
    let sql = `
      SELECT t.*, p.name as product_name
      FROM inventory_transactions t
      JOIN products p ON t.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (product_id) {
      sql += ' AND t.product_id = ?';
      params.push(product_id);
    }
    if (type) {
      sql += ' AND t.type = ?';
      params.push(type);
    }

    sql += ' ORDER BY t.created_at DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const transactions = await all(sql, params);
    return res.json({ success: true, data: transactions });
  } catch (err) {
    next(err);
  }
});

export default router;
