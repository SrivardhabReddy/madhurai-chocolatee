import test from 'node:test';
import assert from 'node:assert/strict';

const API_URL = 'http://localhost:4000/api';

test('Payment Gateway, Dynamic UPI QR & Refunds Suite', async (t) => {
  let superAdminToken = '';
  let testOrderId = '';
  let paymentId = '';

  // Get Super Admin token
  const authRes = await fetch(`${API_URL}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'madhuraicompany@gmail.com',
      password: 'Madhurai@2026/8/9'
    })
  });
  const authData = await authRes.json();
  superAdminToken = authData.data.token;

  // Create an order for payment testing
  const prodsRes = await fetch(`${API_URL}/products`);
  const prodsData = await prodsRes.json();
  const prod = prodsData.data.find(p => p.slug === 'chocolate-crunch-peanut-butter-inside') || prodsData.data[0];

  const checkoutRes = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: 'UPI Tester',
      customer_phone: '9840198401',
      customer_email: 'upi_tester@example.com',
      house_building: 'Shop 10',
      street: 'Main Road',
      area: 'Simmakkal',
      city: 'Madurai',
      district: 'Madurai',
      state: 'Tamil Nadu',
      pincode: '625001',
      items: [{ product_id: prod.id, quantity: 1 }],
      payment_method: 'UPI_QR'
    })
  });
  const checkoutData = await checkoutRes.json();
  testOrderId = checkoutData.data.orderId;

  await t.test('1. Dynamic UPI QR Generation with NPCI Protocol', async () => {
    const res = await fetch(`${API_URL}/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: testOrderId,
        payment_method: 'UPI_QR'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.paymentId);
    paymentId = data.data.paymentId;

    // Check NPCI UPI String format
    assert.ok(data.data.upiQrString.startsWith('upi://pay?'), 'Must generate standard NPCI URI format');
    assert.ok(data.data.upiQrString.includes('pa=9676823113-2%40ybl') || data.data.upiQrString.includes('pa=9676823113-2@ybl'), 'Must contain Payee Address 9676823113-2@ybl');
    assert.strictEqual(data.data.upiVpa, '9676823113-2@ybl', 'UPI VPA must be 9676823113-2@ybl');
    assert.ok(data.data.upiQrString.includes('am='), 'Must contain order amount in URI');
    assert.ok(data.data.qrDataUrl.startsWith('data:image/png;base64,'), 'Must generate dynamic QR image data URL');
  });

  await t.test('2. Server-Side Payment Verification & Order Status Transition', async () => {
    const res = await fetch(`${API_URL}/payments/simulate-success`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_id: paymentId,
        order_id: testOrderId
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);

    // Verify order is now marked as PAID and PAYMENT_CONFIRMED in database
    const orderRes = await fetch(`${API_URL}/orders/${testOrderId}`);
    const orderData = await orderRes.json();
    assert.strictEqual(orderData.data.order.payment_status, 'PAID');
    assert.strictEqual(orderData.data.order.order_status, 'PAYMENT_CONFIRMED');
  });

  await t.test('3. Webhook Idempotency: Duplicate Payment Events are Safely Handled', async () => {
    const res = await fetch(`${API_URL}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': 'test_signature'
      },
      body: JSON.stringify({
        event: 'PAYMENT_SUCCESS',
        payment_id: paymentId,
        order_id: testOrderId,
        amount: 440
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.received, true);
  });

  await t.test('4. Process Gateway Refund by Super Admin', async () => {
    const res = await fetch(`${API_URL}/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        amount: 440,
        reason: 'Automated test suite return verification'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.status, 'REFUNDED');

    // Verify order reflects REFUNDED
    const orderRes = await fetch(`${API_URL}/orders/${testOrderId}`);
    const orderData = await orderRes.json();
    assert.strictEqual(orderData.data.order.order_status, 'REFUNDED');
  });
});
