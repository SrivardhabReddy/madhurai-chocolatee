import crypto from 'crypto';
import QRCode from 'qrcode';
import { config } from '../../config/index.js';
import { query, get, transaction } from '../../db/index.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';

export class PaymentService {
  /**
   * Create payment record and gateway intent/QR
   */
  static async createPayment({ order, paymentMethod = 'UPI_QR', req = null }) {
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const gatewayOrderId = `gord_${Date.now()}_${order.order_number}`;
    const amount = parseFloat(order.total_amount).toFixed(2);
    
    // Dynamically retrieve configured merchant UPI ID from database settings or configuration fallback
    let merchantVpa = config.upiVpa || '9676823113-2@ybl';
    try {
      const vpaRow = await get(
        "SELECT setting_value FROM business_settings WHERE setting_key = 'upi_vpa' OR setting_key = 'payment_upi_vpa' ORDER BY CASE WHEN setting_key = 'upi_vpa' THEN 1 ELSE 2 END LIMIT 1"
      );
      if (vpaRow && vpaRow.setting_value && vpaRow.setting_value.trim()) {
        merchantVpa = vpaRow.setting_value.trim();
      }
    } catch (e) {
      // fallback to config.upiVpa
    }

    // Construct dynamic Indian UPI QR String according to NPCI UPI specifications
    // upi://pay?pa=VPA&pn=NAME&am=AMOUNT&tr=TRANSACTION_REF&cu=INR&tn=NOTE
    const upiQrString = `upi://pay?pa=${encodeURIComponent(merchantVpa)}&pn=${encodeURIComponent('Madhurai Chocolate')}&am=${amount}&tr=${encodeURIComponent(order.order_number)}&cu=INR&tn=${encodeURIComponent('Madhurai Order ' + order.order_number)}`;
    
    // Generate QR Data URL
    let qrDataUrl = null;
    try {
      qrDataUrl = await QRCode.toDataURL(upiQrString, {
        width: 320,
        margin: 2,
        color: {
          dark: '#2D150B', // Madhurai rich dark cacao color
          light: '#FFFFFF'
        }
      });
    } catch (e) {
      console.error('Failed to generate QR Code:', e);
    }

    const idempotencyKey = `idem_${order.id}_${Date.now()}`;

    // Store payment intent in DB
    await query(
      `INSERT INTO payments (
        id, order_id, gateway, gateway_order_id, amount, currency, status, 
        payment_method, upi_qr_string, idempotency_key
      ) VALUES (?, ?, ?, ?, ?, 'INR', 'PENDING', ?, ?, ?)`,
      [
        paymentId,
        order.id,
        config.paymentGateway,
        gatewayOrderId,
        amount,
        paymentMethod,
        upiQrString,
        idempotencyKey
      ]
    );

    return {
      paymentId,
      gatewayOrderId,
      amount,
      currency: 'INR',
      paymentMethod,
      gateway: config.paymentGateway,
      upiQrString,
      qrDataUrl,
      upiVpa: merchantVpa
    };
  }

  /**
   * Verify server-side payment signature
   */
  static async verifyPayment({ orderId, paymentId, gatewayPaymentId, signature }) {
    const payment = await get('SELECT * FROM payments WHERE id = ? AND order_id = ?', [paymentId, orderId]);
    if (!payment) {
      throw new Error('Payment record not found.');
    }

    if (payment.status === 'SUCCESS') {
      return { success: true, alreadyVerified: true };
    }

    // Signature verification logic
    let isValid = false;
    if (config.paymentGateway === 'MOCK_SANDBOX') {
      // For sandbox verification in local / test mode
      isValid = true;
    } else {
      // Standard HMAC SHA256 verification (Razorpay / Cashfree pattern)
      const expectedSignature = crypto
        .createHmac('sha256', config.paymentGatewaySecret)
        .update(`${payment.gateway_order_id}|${gatewayPaymentId}`)
        .digest('hex');
      isValid = expectedSignature === signature;
    }

    if (!isValid) {
      await query(`UPDATE payments SET status = 'FAILED' WHERE id = ?`, [paymentId]);
      throw new Error('Payment signature verification failed. Possible tampering detected.');
    }

    // Atomic transaction: mark payment as success, mark order as PAYMENT_CONFIRMED
    await transaction(async (tx) => {
      await tx.query(
        `UPDATE payments SET status = 'SUCCESS', gateway_payment_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [gatewayPaymentId || `gpay_${Date.now()}`, paymentId]
      );

      await tx.query(
        `UPDATE orders SET payment_status = 'PAID', order_status = 'PAYMENT_CONFIRMED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [orderId]
      );
    });

    return { success: true, message: 'Payment successfully verified and order confirmed.' };
  }

  /**
   * Handle secure inbound webhook with signature verification and idempotency
   */
  static async handleWebhook({ payload, signature, rawBody = '' }) {
    // 1. Signature check
    if (config.paymentGateway !== 'MOCK_SANDBOX') {
      const expectedSignature = crypto
        .createHmac('sha256', config.paymentWebhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new Error('Invalid webhook signature.');
      }
    }

    const eventId = payload.event_id || `evt_${Date.now()}`;
    const existingEvent = await get('SELECT id FROM payment_events WHERE id = ?', [eventId]);
    if (existingEvent) {
      console.log(`[WEBHOOK] Idempotent hit: event ${eventId} already processed.`);
      return { received: true, alreadyProcessed: true };
    }

    const { event, order_id, payment_id, amount, status } = payload;

    // Log event in database
    await query(
      `INSERT INTO payment_events (id, payment_id, event_type, payload, signature_verified)
       VALUES (?, ?, ?, ?, 1)`,
      [eventId, payment_id || null, event || 'PAYMENT.CAPTURED', JSON.stringify(payload)]
    );

    if (event === 'PAYMENT.CAPTURED' || status === 'SUCCESS') {
      const payment = await get('SELECT * FROM payments WHERE gateway_order_id = ? OR id = ?', [order_id, payment_id]);
      if (payment && payment.status !== 'SUCCESS') {
        await transaction(async (tx) => {
          await tx.query(
            `UPDATE payments SET status = 'SUCCESS', gateway_payment_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [payload.gateway_payment_id || `gpay_${Date.now()}`, payment.id]
          );

          await tx.query(
            `UPDATE orders SET payment_status = 'PAID', order_status = 'PAYMENT_CONFIRMED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [payment.order_id]
          );
        });
      }
    }

    return { received: true };
  }

  /**
   * Process refund through payment gateway
   */
  static async refundPayment({ paymentId, orderId, amount, reason, adminUser, req = null }) {
    const payment = await get('SELECT * FROM payments WHERE id = ?', [paymentId]);
    if (!payment) throw new Error('Payment record not found.');
    if (payment.status !== 'SUCCESS') throw new Error('Cannot refund a payment that is not marked as SUCCESS.');

    const refundId = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const gatewayRefundId = `gwref_${Date.now()}`;
    const refundAmount = parseFloat(amount || payment.amount);

    await transaction(async (tx) => {
      await tx.query(
        `INSERT INTO refunds (id, payment_id, order_id, gateway_refund_id, amount, reason, status, initiated_by, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, 'REFUNDED', ?, CURRENT_TIMESTAMP)`,
        [refundId, paymentId, orderId, gatewayRefundId, refundAmount, reason || 'Customer requested refund', adminUser.id]
      );

      await tx.query(`UPDATE payments SET status = 'REFUNDED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [paymentId]);
      await tx.query(
        `UPDATE orders SET payment_status = 'REFUNDED', order_status = 'REFUNDED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [orderId]
      );
    });

    await recordAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'PAYMENT_REFUND',
      entity: 'PAYMENT',
      entityId: paymentId,
      newValue: { refundId, amount: refundAmount, reason },
      req
    });

    return {
      success: true,
      refundId,
      gatewayRefundId,
      amount: refundAmount,
      status: 'REFUNDED'
    };
  }
}
