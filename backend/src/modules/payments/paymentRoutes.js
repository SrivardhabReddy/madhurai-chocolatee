import { Router } from 'express';
import { PaymentService } from './PaymentService.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { get, all } from '../../db/index.js';

const router = Router();

// Create payment intent & dynamic UPI QR for order
router.post('/create', async (req, res, next) => {
  try {
    const { order_id, payment_method = 'UPI_QR' } = req.body;
    if (!order_id) {
      return res.status(400).json({ success: false, message: 'Order ID is required.' });
    }

    const order = await get('SELECT * FROM orders WHERE id = ? OR order_number = ?', [order_id, order_id]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.payment_status === 'PAID') {
      return res.status(400).json({ success: false, message: 'This order is already paid.' });
    }

    const paymentData = await PaymentService.createPayment({
      order,
      paymentMethod: payment_method,
      req
    });

    return res.json({ success: true, data: paymentData });
  } catch (err) {
    next(err);
  }
});

// Verify client payment
router.post('/verify', async (req, res, next) => {
  try {
    const { order_id, payment_id, gateway_payment_id, signature } = req.body;
    if (!order_id || !payment_id) {
      return res.status(400).json({ success: false, message: 'Order ID and Payment ID are required.' });
    }

    const result = await PaymentService.verifyPayment({
      orderId: order_id,
      paymentId: payment_id,
      gatewayPaymentId: gateway_payment_id || `gpay_${Date.now()}`,
      signature: signature || 'mock_sig'
    });

    return res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Sandbox development simulation trigger
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

    const result = await PaymentService.verifyPayment({
      orderId: payment.order_id,
      paymentId: payment.id,
      gatewayPaymentId: `sim_gpay_${Date.now()}`,
      signature: 'simulated_sandbox_signature'
    });

    return res.json({ success: true, message: 'Sandbox payment successfully simulated and verified.', ...result });
  } catch (err) {
    next(err);
  }
});

// Gateway Inbound Webhook
router.post('/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['x-webhook-signature'] || req.headers['x-razorpay-signature'] || '';
    const rawBody = JSON.stringify(req.body);
    const result = await PaymentService.handleWebhook({
      payload: req.body,
      signature,
      rawBody
    });

    return res.json(result);
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Admin Refund
router.post('/:id/refund', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
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

    return res.json({ success: true, message: 'Refund processed successfully.', data: refund });
  } catch (err) {
    next(err);
  }
});

// Admin Get Payment Logs
router.get('/admin/list', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'), async (req, res, next) => {
  try {
    const { status, method, q } = req.query;
    let sql = `
      SELECT p.*, o.order_number, o.customer_name, o.customer_phone
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }
    if (method) {
      sql += ' AND p.payment_method = ?';
      params.push(method);
    }
    if (q) {
      sql += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR p.id LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term);
    }
    sql += ' ORDER BY p.created_at DESC LIMIT 100';

    const payments = await all(sql, params);
    return res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
});

export default router;
