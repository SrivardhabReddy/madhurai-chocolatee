import test from 'node:test';
import assert from 'node:assert/strict';

const API_URL = 'http://localhost:4000/api';

test('Coupons & Discounts Engine Suite', async (t) => {
  await t.test('1. Validate Percentage Coupon (WELCOME10: 10% off above ₹300)', async () => {
    const res = await fetch(`${API_URL}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'WELCOME10',
        subtotal: 400
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.discount_amount, 40, '10% of 400 is 40');
  });

  await t.test('2. Validate Fixed Coupon (CRUNCH50: ₹50 off above ₹400)', async () => {
    const res = await fetch(`${API_URL}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'CRUNCH50',
        subtotal: 500
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.discount_amount, 50);
  });

  await t.test('3. Reject Coupon if Subtotal is below Minimum Order Amount', async () => {
    const res = await fetch(`${API_URL}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'CRUNCH50',
        subtotal: 300 // Below min order 400
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('minimum cart subtotal'));
  });

  await t.test('4. Reject Non-Existent Coupon Code', async () => {
    const res = await fetch(`${API_URL}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'INVALIDCODE999',
        subtotal: 500
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('Invalid') || data.message.includes('inactive'));
  });
});
