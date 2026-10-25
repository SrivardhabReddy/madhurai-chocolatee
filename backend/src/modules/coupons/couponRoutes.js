import { Router } from 'express';
import { optionalAuth, authenticate } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';
import { query, get, all } from '../../db/index.js';

const router = Router();

// Validate Coupon (Customer)
router.post('/validate', optionalAuth, async (req, res, next) => {
  try {
    const { code, subtotal = 0, items = [], pincode } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Please enter a coupon code.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await get('SELECT * FROM coupons WHERE code = ?', [cleanCode]);

    if (!coupon || !coupon.is_active) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive coupon code.' });
    }

    // Check expiry
    const now = new Date();
    if (coupon.start_date && new Date(coupon.start_date) > now) {
      return res.status(400).json({ success: false, message: 'This coupon is not active yet.' });
    }
    if (coupon.end_date && new Date(coupon.end_date) < now) {
      return res.status(400).json({ success: false, message: 'This coupon has expired.' });
    }

    // Check minimum order amount
    const orderAmt = parseFloat(subtotal) || 0;
    if (orderAmt < coupon.min_order_amount) {
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum cart subtotal of ₹${coupon.min_order_amount}.`
      });
    }

    // Check total usage limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its maximum redemption limit.' });
    }

    // Check per-customer limit if user is authenticated
    if (req.user && coupon.per_customer_limit) {
      const userUsage = await get(
        'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
        [coupon.id, req.user.id]
      );
      if (userUsage && userUsage.count >= coupon.per_customer_limit) {
        return res.status(400).json({
          success: false,
          message: 'You have already reached the redemption limit for this coupon.'
        });
      }
    }

    // Calculate discount amount
    let discount = 0;
    if (coupon.discount_type === 'PERCENTAGE') {
      discount = (orderAmt * coupon.discount_value) / 100;
      if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
        discount = coupon.max_discount_amount;
      }
    } else {
      discount = coupon.discount_value;
    }
    discount = Math.min(discount, orderAmt);

    return res.json({
      success: true,
      message: `Coupon ${coupon.code} applied! Saved ₹${discount.toFixed(2)}.`,
      data: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discount,
        description: coupon.description
      }
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// ADMIN APIS
// ==========================================

router.get('/admin/all', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const coupons = await all('SELECT * FROM coupons ORDER BY created_at DESC');
    return res.json({ success: true, data: coupons });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/create', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const {
      code,
      description,
      discount_type = 'PERCENTAGE',
      discount_value,
      min_order_amount = 0,
      max_discount_amount,
      start_date,
      end_date,
      usage_limit,
      per_customer_limit = 1,
      product_id,
      category_id,
      pincode,
      is_active = 1
    } = req.body;

    if (!code || !discount_value) {
      return res.status(400).json({ success: false, message: 'Coupon code and discount value are required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await get('SELECT id FROM coupons WHERE code = ?', [cleanCode]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'A coupon with this code already exists.' });
    }

    const id = `coup_${Date.now()}`;
    await query(
      `INSERT INTO coupons (
        id, code, description, discount_type, discount_value, min_order_amount,
        max_discount_amount, start_date, end_date, usage_limit, per_customer_limit,
        product_id, category_id, pincode, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        cleanCode,
        description || null,
        discount_type,
        parseFloat(discount_value),
        parseFloat(min_order_amount) || 0,
        max_discount_amount ? parseFloat(max_discount_amount) : null,
        start_date || null,
        end_date || null,
        usage_limit ? parseInt(usage_limit, 10) : null,
        parseInt(per_customer_limit, 10) || 1,
        product_id || null,
        category_id || null,
        pincode || null,
        is_active ? 1 : 0
      ]
    );

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'COUPON_CREATE',
      entity: 'COUPON',
      entityId: id,
      newValue: req.body,
      req
    });

    return res.status(201).json({ success: true, message: 'Coupon created successfully.', data: { id } });
  } catch (err) {
    next(err);
  }
});

router.put('/admin/:id', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const old = await get('SELECT * FROM coupons WHERE id = ?', [id]);
    if (!old) return res.status(404).json({ success: false, message: 'Coupon not found.' });

    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount_amount,
      start_date,
      end_date,
      usage_limit,
      per_customer_limit,
      is_active
    } = req.body;

    await query(
      `UPDATE coupons SET
        code = ?, description = ?, discount_type = ?, discount_value = ?,
        min_order_amount = ?, max_discount_amount = ?, start_date = ?, end_date = ?,
        usage_limit = ?, per_customer_limit = ?, is_active = ?
       WHERE id = ?`,
      [
        code.trim().toUpperCase(),
        description || null,
        discount_type,
        parseFloat(discount_value),
        parseFloat(min_order_amount) || 0,
        max_discount_amount ? parseFloat(max_discount_amount) : null,
        start_date || null,
        end_date || null,
        usage_limit ? parseInt(usage_limit, 10) : null,
        parseInt(per_customer_limit, 10) || 1,
        is_active ? 1 : 0,
        id
      ]
    );

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'COUPON_UPDATE',
      entity: 'COUPON',
      entityId: id,
      oldValue: old,
      newValue: req.body,
      req
    });

    return res.json({ success: true, message: 'Coupon updated successfully.' });
  } catch (err) {
    next(err);
  }
});

router.delete('/admin/:id', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const old = await get('SELECT * FROM coupons WHERE id = ?', [id]);
    if (!old) return res.status(404).json({ success: false, message: 'Coupon not found.' });

    await query('DELETE FROM coupons WHERE id = ?', [id]);
    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'COUPON_DELETE',
      entity: 'COUPON',
      entityId: id,
      oldValue: old,
      req
    });

    return res.json({ success: true, message: 'Coupon deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;
