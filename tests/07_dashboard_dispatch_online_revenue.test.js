import test from 'node:test';
import assert from 'node:assert/strict';

const API_URL = 'http://localhost:4000/api';

test('Dashboard Today Orders, Online Revenue & Dispatch Lifecycle Suite', async (t) => {
  let adminToken = '';
  let testOrderId = '';

  // 1. Admin Login
  const authRes = await fetch(`${API_URL}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'madhuraicompany@gmail.com',
      password: 'Madhurai@2026/8/9'
    })
  });
  const authData = await authRes.json();
  assert.strictEqual(authRes.status, 200);
  assert.strictEqual(authData.success, true);
  adminToken = authData.data.token;
  assert.ok(adminToken, 'Admin token acquired');

  // 2. Create test order for today
  const prodsRes = await fetch(`${API_URL}/products`);
  const prodsData = await prodsRes.json();
  const prod = prodsData.data[0];

  const checkoutRes = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: 'Dispatch Tester',
      customer_phone: '9840198402',
      customer_email: 'dispatch_tester@example.com',
      house_building: 'Door 12',
      street: 'Silk Street',
      area: 'Town Center',
      city: 'Gudur',
      district: 'Tirupati',
      state: 'Andhra Pradesh',
      pincode: '524101',
      items: [{ product_id: prod.id, quantity: 1 }],
      payment_method: 'UPI_QR'
    })
  });
  const checkoutData = await checkoutRes.json();
  assert.strictEqual(checkoutRes.status, 201);
  assert.strictEqual(checkoutData.success, true);
  testOrderId = checkoutData.data.orderId;

  // Test A: Customer confirms UPI payment (with UTR)
  await t.test('1. Customer confirms UPI payment with UTR reference', async () => {
    const res = await fetch(`${API_URL}/payments/confirm-upi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: testOrderId,
        utr_number: 'UTR987654321012'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.payment_status, 'PAID');
    assert.strictEqual(data.data.order_status, 'PAYMENT_CONFIRMED');
    assert.strictEqual(data.data.payment_reference, 'UTR987654321012');
  });

  // Test B: Admin updates dispatch logistics
  await t.test('2. Admin updates order dispatch logistics (DTDC courier & tracking)', async () => {
    const res = await fetch(`${API_URL}/orders/admin/${testOrderId}/dispatch`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        order_status: 'SHIPPED',
        courier_name: 'DTDC',
        tracking_number: 'D12345678',
        dispatch_notes: 'Packed in insulated gel cold pouch'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.order_status, 'SHIPPED');
    assert.strictEqual(data.data.courier_name, 'DTDC');
    assert.strictEqual(data.data.tracking_number, 'D12345678');
    assert.ok(data.data.tracking_url.includes('dtdc.in'));
    assert.strictEqual(data.data.dispatch_notes, 'Packed in insulated gel cold pouch');
  });

  // Test C: Guest tracking retrieves dispatch info
  await t.test('3. Guest tracking retrieves courier and dispatch info', async () => {
    const res = await fetch(`${API_URL}/orders/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_number: checkoutData.data.orderNumber,
        phone: '9840198402'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.order.courier_name, 'DTDC');
    assert.strictEqual(data.data.order.tracking_number, 'D12345678');
  });

  // Test D: Dashboard returns today's orders & online revenue
  await t.test('4. Dashboard accurately counts today orders and verified online revenue', async () => {
    const res = await fetch(`${API_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.todayOrders >= 1, 'Today orders count must be at least 1');
    assert.ok(data.data.todayOnlineRevenue > 0, 'Today online revenue must be greater than 0');
    assert.ok(data.data.onlineRevenue > 0, 'Online revenue must be greater than 0');
    assert.ok(Array.isArray(data.data.todayOrdersList), 'Must return todayOrdersList array');
    const found = data.data.todayOrdersList.find(o => o.id === testOrderId);
    assert.ok(found, 'Created test order must appear in todayOrdersList');
    assert.strictEqual(found.payment_status, 'PAID');
    assert.strictEqual(found.courier_name, 'DTDC');
  });
});
