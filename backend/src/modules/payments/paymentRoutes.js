import { Router } from 'express';
import { PaymentService } from './PaymentService.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { query, get, all } from '../../db/index.js';
import { config } from '../../config/index.js';

const router = Router();

/**
 * STEP 1: CREATE ORDER
 * POST /api/create-order (and /api/payments/create)
 * Request: { amount (paise), currency, receipt, notes }
 * Return: { order_id, amount, currency }
 * Minimum amount: 100 paise
 */
export async function createOrderHandler(req, res, next) {
  try {
    const { amount, currency = 'INR', receipt, notes = {}, order_id, total_amount } = req.body;

    let amountInPaise = amount;
    let orderReceipt = receipt;
    let orderNotes = notes || {};
    let orderRecord = null;

    // 1. Support storefront order_id reference
    if (order_id) {
      orderRecord = await get('SELECT * FROM orders WHERE id = ? OR order_number = ?', [order_id, order_id]);
      if (orderRecord) {
        if (orderRecord.payment_status === 'PAID') {
          return res.status(400).json({ success: false, message: 'Order is already marked as paid.' });
        }
        amountInPaise = Math.round(parseFloat(orderRecord.total_amount) * 100);
        orderReceipt = orderRecord.order_number;
        orderNotes = { order_id: orderRecord.id, order_number: orderRecord.order_number };
      }
    }

    // 2. Support total_amount in rupees
    if ((!amountInPaise || isNaN(amountInPaise)) && total_amount && !isNaN(total_amount)) {
      amountInPaise = Math.round(parseFloat(total_amount) * 100);
    }

    // 3. Direct amount validation (must be at least 100 paise)
    if (!amountInPaise || isNaN(amountInPaise) || Number(amountInPaise) < 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Minimum amount is 100 paise (₹1.00).'
      });
    }

    const rzpOrder = await PaymentService.createRazorpayOrder({
      amount: parseInt(amountInPaise, 10),
      currency: (currency || 'INR').toUpperCase(),
      receipt: orderReceipt,
      notes: orderNotes
    });

    let paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    if (orderRecord) {
      try {
        await query(
          `INSERT INTO payments (
            id, order_id, gateway, gateway_order_id, amount, currency, status, payment_method
          ) VALUES (?, ?, 'RAZORPAY', ?, ?, 'INR', 'PENDING', ?)`,
          [paymentId, orderRecord.id, rzpOrder.order_id, (amountInPaise / 100).toFixed(2), req.body.payment_method || 'RAZORPAY']
        );
      } catch (pErr) {
        console.warn('Payment record note:', pErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      order_id: rzpOrder.order_id,
      id: rzpOrder.order_id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key_id: config.razorpayKeyId,
      data: {
        paymentId,
        razorpayOrderId: rzpOrder.order_id,
        order_id: rzpOrder.order_id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: config.razorpayKeyId,
        key_id: config.razorpayKeyId,
        orderNumber: orderRecord ? orderRecord.order_number : orderReceipt
      }
    });
  } catch (err) {
    const statusCode = err.status || (err.statusCode === 401 ? 401 : 500);
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Razorpay order creation failed.'
    });
  }
}

/**
 * STEP 3: VERIFY SIGNATURE
 * POST /api/verify-payment (and /api/payments/verify)
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * Compare generated signature with razorpay_signature
 * Return success only if signatures match
 */
export async function verifyPaymentHandler(req, res, next) {
  try {
    const order_id = req.body.order_id || req.body.razorpay_order_id;
    const payment_id = req.body.payment_id || req.body.razorpay_payment_id;
    const signature = req.body.signature || req.body.razorpay_signature;

    // Missing fields check
    if (!order_id || !payment_id || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: order_id, payment_id, and signature are required.'
      });
    }

    const result = await PaymentService.verifyPayment({
      orderId: req.body.order_id,
      paymentId: req.body.payment_id,
      razorpayOrderId: order_id,
      razorpayPaymentId: payment_id,
      razorpaySignature: signature,
      gatewayPaymentId: payment_id,
      signature
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      order_id,
      payment_id,
      ...result
    });
  } catch (err) {
    const statusCode = err.status || 400;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Invalid signature. Payment verification failed.'
    });
  }
}

// Bind endpoints to router
router.post('/create-order', createOrderHandler);
router.post('/create', createOrderHandler);

router.post('/verify-payment', verifyPaymentHandler);
router.post('/verify', verifyPaymentHandler);

// Development Sandbox Simulation Trigger
router.post('/simulate-success', async (req, res, next) => {
  try {
    const { payment_id, order_id } = req.body;
    if (!payment_id && !order_id) {
      return res.status(400).json({ success: false, message: 'Payment ID or Order ID is required.' });
    }

    const payment = await get(
      'SELECT * FROM payments WHERE id = ? OR order_id = ? ORDER BY created_at DESC LIMIT 1',
      [payment_id || '', order_id || '']
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const simPaymentId = `sim_pay_${Date.now()}`;
    const simSignature = 'simulated_sandbox_signature';

    await query(
      `UPDATE payments SET status = 'SUCCESS', gateway_payment_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [simPaymentId, payment.id]
    );

    await query(
      `UPDATE orders SET payment_status = 'PAID', order_status = 'PAYMENT_CONFIRMED', payment_reference = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [simPaymentId, payment.order_id]
    );

    return res.json({
      success: true,
      message: 'Sandbox payment successfully simulated and verified.',
      order_id: payment.order_id,
      payment_id: payment.id,
      gatewayPaymentId: simPaymentId
    });
  } catch (err) {
    next(err);
  }
});

// Razorpay Inbound Webhook
router.post('/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'] || req.headers['x-webhook-signature'] || '';
    const rawBody = JSON.stringify(req.body);
    const result = await PaymentService.handleWebhook({
      payload: req.body,
      signature,
      rawBody
    });

    return res.json(result);
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Process Gateway Refund (Super Admin / Order Manager)
router.post('/:id/refund', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'), async (req, res, next) => {
  try {
    const { id } = req.params; // payment id
    const { amount, reason } = req.body;

    const payment = await get('SELECT * FROM payments WHERE id = ?', [id]);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });

    const refund = await PaymentService.refundPayment({
      paymentId: id,
      orderId: payment.order_id,
      amount,
      reason,
      adminUser: req.user,
      req
    });

    return res.json({ success: true, data: refund });
  } catch (err) {
    next(err);
  }
});

// Admin Get Payment Logs
router.get('/admin/list', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search, payment_method } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT p.*, o.order_number, o.customer_name, o.customer_email, o.customer_phone
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }
    if (payment_method) {
      sql += ' AND p.payment_method = ?';
      params.push(payment_method);
    }
    if (search) {
      sql += ' AND (p.id LIKE ? OR p.gateway_order_id LIKE ? OR p.gateway_payment_id LIKE ? OR o.order_number LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const payments = await all(sql, params);
    return res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
});

export default router;
