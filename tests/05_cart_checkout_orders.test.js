import test from 'node:test';
import assert from 'node:assert/strict';

const API_URL = 'http://localhost:4000/api';

test('Cart, Checkout & Order Lifecycle Suite', async (t) => {
  let createdOrderId = '';
  let createdOrderNumber = '';
  const testPhone = '9876543210';
  let targetProduct = null;

  // Retrieve products and select flagship product
  const prodsRes = await fetch(`${API_URL}/products`);
  const prodsData = await prodsRes.json();
  targetProduct = prodsData.data.find(p => p.slug === 'chocolate-crunch-peanut-butter-inside') || prodsData.data[0];

  await t.test('1. Guest Checkout: Atomic Order Creation with Backend Price Verification', async () => {
    // Attempt checkout: Client sends unit_price 10, backend MUST override with true ₹400
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Meenakshi Sundaram',
        customer_phone: testPhone,
        customer_email: 'meenakshi@example.com',
        house_building: 'Flat 4B, Lotus Apartments',
        street: 'Kamarajar Salai',
        area: 'South Gate',
        city: 'Madurai',
        district: 'Madurai',
        state: 'Tamil Nadu',
        pincode: '625001',
        landmark: 'Near Meenakshi Temple',
        items: [
          {
            product_id: targetProduct.id,
            quantity: 2,
            unit_price: 10 // Attacker attempt to send ₹10, backend must use true price
          }
        ],
        coupon_code: 'CRUNCH50',
        payment_method: 'UPI_QR'
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.orderId, 'Should generate orderId');
    assert.ok(data.data.orderNumber.startsWith('MC-2026-'), 'Order number must follow MC-2026-XXXXXX human-readable format');

    createdOrderId = data.data.orderId;
    createdOrderNumber = data.data.orderNumber;

    // Verify calculated totals:
    // 2 boxes @ 400 = 800
    // CRUNCH50 discount = 50
    // Delivery for 800 order value = 0 (Free Delivery above 500)
    // Final Total = 750
    assert.strictEqual(data.data.subtotal, 800, 'Backend correctly calculated true product subtotal 2 * 400 = 800');
    assert.strictEqual(data.data.discountAmount, 50, 'Applied 50 coupon discount');
    assert.strictEqual(data.data.totalAmount, 750, 'Final verified total is 750');
  });

  await t.test('2. Order Item & Delivery Snapshots', async () => {
    const res = await fetch(`${API_URL}/orders/${createdOrderId}`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);

    const order = data.data.order;
    assert.strictEqual(order.order_number, createdOrderNumber);
    assert.strictEqual(order.pincode, '625001');

    const item = data.data.items[0];
    assert.strictEqual(item.product_name_snapshot, targetProduct.name);
    assert.strictEqual(item.pieces_per_pack_snapshot, targetProduct.pieces_per_pack);
    assert.strictEqual(item.weight_snapshot, targetProduct.weight);
    assert.strictEqual(parseFloat(item.price_snapshot), parseFloat(targetProduct.selling_price));
  });

  await t.test('3. Guest Tracking by Order Number + Phone Number', async () => {
    const res = await fetch(`${API_URL}/orders/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_number: createdOrderNumber,
        phone: testPhone
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.order.order_number, createdOrderNumber);
    assert.ok(data.data.items?.length >= 1, 'Should include order items');
  });

  await t.test('4. Guest Tracking rejects mismatched phone number', async () => {
    const res = await fetch(`${API_URL}/orders/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_number: createdOrderNumber,
        phone: '1111111111'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 404);
    assert.strictEqual(data.success, false);
  });
});
