import { Router } from 'express';
import { optionalAuth, authenticate } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';
import { DeliveryEngine } from '../delivery/DeliveryEngine.js';
import { query, get, all, transaction } from '../../db/index.js';
import { orderLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// Helper to generate human-readable sequential order number: MC-2026-000001
async function generateOrderNumber() {
  const year = new Date().getFullYear();
  const countRow = await get("SELECT COUNT(*) as count FROM orders");
  const count = (countRow ? parseInt(countRow.count, 10) : 0) + 1;
  const seq = String(count).padStart(6, '0');
  return `MC-${year}-${seq}`;
}

// ==========================================
// CUSTOMER APIS
// ==========================================

// Create Order (Guest or Authenticated)
router.post('/', orderLimiter, optionalAuth, async (req, res, next) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      house_building,
      street,
      area,
      landmark,
      city,
      district,
      state,
      pincode,
      items = [],
      coupon_code,
      payment_method = 'UPI_QR',
      customer_notes
    } = req.body;

    // Validation
    if (!customer_name || !customer_email || !customer_phone) {
      return res.status(400).json({ success: false, message: 'Please provide customer name, email, and mobile number.' });
    }
    if (!house_building || !street || !area || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: 'Please complete all required address fields and pincode.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty. Please add products.' });
    }

    // 1. Serviceability check
    const deliveryCheck = await DeliveryEngine.evaluateDelivery({ pincode, items });
    if (!deliveryCheck.serviceable) {
      return res.status(400).json({
        success: false,
        message: deliveryCheck.reason || 'Sorry, we currently do not deliver to this location.'
      });
    }

    // COD availability check
    if (payment_method === 'COD' && !deliveryCheck.codAvailable) {
      return res.status(400).json({
        success: false,
        message: deliveryCheck.codReason || 'Cash on Delivery is not available for this location or order value.'
      });
    }

    // 2. Fetch live products and recalculate prices (NEVER TRUST CLIENT TOTALS)
    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const pId = item.product_id || item.id;
      const prod = await get("SELECT * FROM products WHERE id = ? AND status = 'ACTIVE'", [pId]);
      if (!prod) {
        return res.status(400).json({
          success: false,
          message: `Product with ID ${pId} is no longer available.`
        });
      }

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

      // Check stock availability
      const inv = await get('SELECT current_stock FROM inventory WHERE product_id = ?', [prod.id]);
      const availableStock = inv ? inv.current_stock : prod.stock;

      if (availableStock < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${prod.name}. Available: ${availableStock}, requested: ${qty}.`
        });
      }

      const itemTotal = prod.selling_price * qty;
      calculatedSubtotal += itemTotal;

      validatedItems.push({
        product: prod,
        quantity: qty,
        unitPrice: prod.selling_price,
        itemTotal
      });
    }

    // 3. Coupon validation & recalculation
    let discountAmount = 0;
    let validCoupon = null;

    if (coupon_code) {
      const cleanCode = String(coupon_code).trim().toUpperCase();
      const coupon = await get('SELECT * FROM coupons WHERE code = ? AND is_active = 1', [cleanCode]);
      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: `Coupon code "${cleanCode}" is invalid or no longer active.`
        });
      }

      // Check expiry dates
      const now = new Date();
      if (coupon.start_date && new Date(coupon.start_date) > now) {
        return res.status(400).json({ success: false, message: `Coupon "${cleanCode}" is not active yet.` });
      }
      if (coupon.end_date && new Date(coupon.end_date) < now) {
        return res.status(400).json({ success: false, message: `Coupon "${cleanCode}" has expired.` });
      }

      // Check minimum order amount
      const minOrderAmt = parseFloat(coupon.min_order_amount) || 0;
      if (calculatedSubtotal < minOrderAmt) {
        return res.status(400).json({
          success: false,
          message: `Coupon "${cleanCode}" requires a minimum cart subtotal of ₹${minOrderAmt}. Current subtotal is ₹${calculatedSubtotal}.`
        });
      }

      if (coupon.discount_type === 'PERCENTAGE') {
        discountAmount = (calculatedSubtotal * coupon.discount_value) / 100;
        if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
          discountAmount = coupon.max_discount_amount;
        }
      } else {
        discountAmount = coupon.discount_value;
      }
      discountAmount = Math.min(discountAmount, calculatedSubtotal);
      discountAmount = Math.round(discountAmount * 100) / 100;
      validCoupon = coupon;
    }

    // 4. Recalculate delivery charge with final validated items & subtotal
    const finalDelivery = await DeliveryEngine.evaluateDelivery({
      pincode,
      items: validatedItems.map(i => ({ product_id: i.product.id, quantity: i.quantity, selling_price: i.unitPrice })),
      subtotal: calculatedSubtotal - discountAmount
    });

    const deliveryCharge = finalDelivery.freeDelivery ? 0 : finalDelivery.deliveryCharge;
    const totalAmount = Math.max(0, Math.round((calculatedSubtotal - discountAmount + deliveryCharge) * 100) / 100);

    // Format full address snapshot
    const fullAddress = `${house_building}, ${street}, ${area}, Landmark: ${landmark || 'N/A'}, ${city}, ${district || city}, ${state} - ${pincode}`;
    const orderNumber = await generateOrderNumber();
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userId = req.user ? req.user.id : null;

    // 5. ATOMIC TRANSACTION: Create Order, Deduct Stock, Record Inventory Tx, Snapshot Items
    await transaction(async (tx) => {
      // Create Order
      await tx.query(
        `INSERT INTO orders (
          id, order_number, user_id, customer_name, customer_email, customer_phone,
          delivery_address, pincode, zone_name, subtotal, discount_amount, coupon_id, coupon_code,
          delivery_charge, is_free_delivery, tax_amount, total_amount, payment_status,
          payment_method, order_status, customer_notes, estimated_min_days, estimated_max_days
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          orderNumber,
          userId,
          customer_name,
          customer_email,
          customer_phone,
          fullAddress,
          pincode,
          finalDelivery.zoneName,
          calculatedSubtotal,
          discountAmount,
          validCoupon ? validCoupon.id : null,
          validCoupon ? validCoupon.code : null,
          deliveryCharge,
          finalDelivery.freeDelivery ? 1 : 0,
          totalAmount,
          totalAmount <= 0 ? 'PAID' : (payment_method === 'COD' ? 'PENDING' : 'PENDING'),
          payment_method,
          totalAmount <= 0 ? 'CONFIRMED' : 'ORDER_PLACED',
          customer_notes || null,
          finalDelivery.estimatedMinDays,
          finalDelivery.estimatedMaxDays
        ]
      );

      // Snapshot each item and deduct inventory
      for (const item of validatedItems) {
        const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await tx.query(
          `INSERT INTO order_items (
            id, order_id, product_id, product_name_snapshot, selling_unit_snapshot,
            pieces_per_pack_snapshot, weight_snapshot, mrp_snapshot, price_snapshot,
            quantity, total_item_price
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            orderId,
            item.product.id,
            item.product.name,
            item.product.selling_unit,
            item.product.pieces_per_pack,
            item.product.weight,
            item.product.mrp,
            item.product.selling_price,
            item.quantity,
            item.itemTotal
          ]
        );

        // Deduct inventory stock
        const currentInv = await tx.get('SELECT current_stock FROM inventory WHERE product_id = ?', [item.product.id]);
        const prevStock = currentInv ? currentInv.current_stock : item.product.stock;
        const newStock = Math.max(0, prevStock - item.quantity);

        await tx.query('UPDATE inventory SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?', [
          newStock,
          item.product.id
        ]);
        await tx.query('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
          newStock,
          item.product.id
        ]);

        // Record Inventory Transaction
        const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await tx.query(
          `INSERT INTO inventory_transactions (
            id, product_id, type, quantity, previous_stock, new_stock, reference_id, notes, created_by
          ) VALUES (?, ?, 'SALE', ?, ?, ?, ?, 'Customer Order Purchase', ?)`,
          [txId, item.product.id, item.quantity, prevStock, newStock, orderNumber, customer_email]
        );
      }

      // Record coupon usage if coupon was applied
      if (validCoupon) {
        await tx.query(
          `INSERT INTO coupon_usage (id, coupon_id, user_id, customer_phone, order_id, discount_applied)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [`cpu_${Date.now()}`, validCoupon.id, userId, customer_phone, orderId, discountAmount]
        );
        await tx.query('UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?', [validCoupon.id]);
      }

      // Log notification
      await tx.query(
        `INSERT INTO notifications (id, channel, recipient, subject, content, event_type, status)
         VALUES (?, 'EMAIL', ?, ?, ?, 'ORDER_PLACED', 'SENT')`,
        [
          `notif_${Date.now()}`,
          customer_email,
          `Order Confirmed: ${orderNumber} - Madhurai Chocolate`,
          `Dear ${customer_name}, thank you for ordering with Madhurai Chocolate! Your order ${orderNumber} for ₹${totalAmount.toFixed(2)} has been received and is being prepared.`
        ]
      );
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: {
        orderId,
        orderNumber,
        totalAmount,
        subtotal: calculatedSubtotal,
        discountAmount,
        deliveryCharge,
        isFreeDelivery: finalDelivery.freeDelivery,
        freeDeliveryReason: finalDelivery.freeDeliveryReason,
        paymentMethod: payment_method,
        estimatedDelivery: `${finalDelivery.estimatedMinDays}-${finalDelivery.estimatedMaxDays} business days`
      }
    });
  } catch (err) {
    next(err);
  }
});

// Guest Tracking by order_number + phone
router.post('/track', async (req, res, next) => {
  try {
    const { order_number, phone } = req.body;
    if (!order_number || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide both Order ID and Mobile Number.' });
    }

    const cleanNum = order_number.trim().toUpperCase();
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');

    const order = await get(
      `SELECT * FROM orders WHERE (order_number = ? OR id = ?) AND customer_phone LIKE ?`,
      [cleanNum, cleanNum, `%${cleanPhone.slice(-10)}`]
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'No order found matching this Order Number and Mobile Number.'
      });
    }

    const items = await all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    return res.json({ success: true, data: { order, items } });
  } catch (err) {
    next(err);
  }
});

// Authenticated customer order history
router.get('/my-orders', authenticate, async (req, res, next) => {
  try {
    const orders = await all(
      'SELECT * FROM orders WHERE user_id = ? OR customer_email = ? ORDER BY created_at DESC',
      [req.user.id, req.user.email]
    );
    return res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});

// Get order details by ID
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await get('SELECT * FROM orders WHERE id = ? OR order_number = ?', [id, id]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Security check: if customer is logged in, ensure they own it or have admin access
    if (req.user && req.user.role === 'CUSTOMER') {
      if (order.user_id && order.user_id !== req.user.id && order.customer_email !== req.user.email) {
        return res.status(403).json({ success: false, message: 'Forbidden.' });
      }
    }

    const items = await all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    const payments = await all('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC', [order.id]);

    return res.json({ success: true, data: { order, items, payments } });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// ADMIN APIS
// ==========================================

// List all orders with filters
router.get('/admin/list', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'), async (req, res, next) => {
  try {
    const { status, payment_status, q, from_date, to_date } = req.query;
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND order_status = ?';
      params.push(status);
    }
    if (payment_status) {
      sql += ' AND payment_status = ?';
      params.push(payment_status);
    }
    if (q) {
      sql += ' AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ? OR customer_email LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term, term);
    }
    if (from_date) {
      sql += ' AND created_at >= ?';
      params.push(from_date);
    }
    if (to_date) {
      sql += ' AND created_at <= ?';
      params.push(to_date);
    }

    sql += ' ORDER BY created_at DESC LIMIT 200';
    const orders = await all(sql, params);
    return res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});

// Update order status
router.patch('/admin/:id/status', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { order_status } = req.body;

    const validStatuses = [
      'ORDER_PLACED',
      'PAYMENT_PENDING',
      'PAYMENT_CONFIRMED',
      'PROCESSING',
      'PACKED',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'REFUND_REQUESTED',
      'REFUNDED',
      'COD_COLLECTED'
    ];

    if (!validStatuses.includes(order_status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status transition.' });
    }

    const order = await get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    await query('UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [order_status, id]);

    // If cancelled, restock inventory automatically
    if (order_status === 'CANCELLED' && order.order_status !== 'CANCELLED') {
      const items = await all('SELECT * FROM order_items WHERE order_id = ?', [id]);
      for (const item of items) {
        await query('UPDATE inventory SET current_stock = current_stock + ? WHERE product_id = ?', [
          item.quantity,
          item.product_id
        ]);
        await query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
        await query(
          `INSERT INTO inventory_transactions (id, product_id, type, quantity, previous_stock, new_stock, reference_id, notes, created_by)
           VALUES (?, ?, 'CANCELLATION', ?, 0, 0, ?, 'Order cancellation restocking', ?)`,
          [`tx_cancel_${Date.now()}`, item.product_id, item.quantity, order.order_number, req.user.email]
        );
      }
    }

    // Record Audit Log
    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'ORDER_STATUS_UPDATE',
      entity: 'ORDER',
      entityId: id,
      oldValue: { status: order.order_status },
      newValue: { status: order_status },
      req
    });

    return res.json({ success: true, message: `Order status updated to ${order_status}.` });
  } catch (err) {
    next(err);
  }
});

// Mark COD Collected
router.post('/admin/:id/cod-collected', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (order.payment_method !== 'COD') {
      return res.status(400).json({ success: false, message: 'This is not a COD order.' });
    }

    await transaction(async (tx) => {
      await tx.query(
        `UPDATE orders SET cod_collected = 1, payment_status = 'PAID', order_status = 'DELIVERED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [id]
      );

      // Create completed payment record for cash collection
      const payId = `pay_cod_${Date.now()}`;
      await tx.query(
        `INSERT INTO payments (id, order_id, gateway, amount, currency, status, payment_method)
         VALUES (?, ?, 'CASH_ON_DELIVERY', ?, 'INR', 'SUCCESS', 'COD')`,
        [payId, id, order.total_amount]
      );
    });

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'COD_COLLECTED',
      entity: 'ORDER',
      entityId: id,
      oldValue: { cod_collected: order.cod_collected },
      newValue: { cod_collected: 1, payment_status: 'PAID' },
      req
    });

    return res.json({ success: true, message: 'Cash on Delivery marked as collected successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
