import test from 'node:test';
import assert from 'node:assert/strict';

const API_URL = 'http://localhost:4000/api';

test('Delivery Rules & Serviceability Engine Suite', async (t) => {
  await t.test('1. Check Serviceability for Valid Pincode (625001 - Madurai HQ)', async () => {
    const res = await fetch(`${API_URL}/delivery/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pincode: '625001' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.serviceable, true, '625001 must be serviceable');
    assert.strictEqual(data.data.codAvailable, true, 'COD should be available in 625001');
    assert.ok(data.data.estimatedMinDays >= 1);
    assert.ok(data.data.estimatedMaxDays >= data.data.estimatedMinDays);
  });

  await t.test('2. Check Serviceability for Unserviceable Pincode (999999)', async () => {
    const res = await fetch(`${API_URL}/delivery/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pincode: '999999' })
    });
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.serviceable, false);
    assert.strictEqual(data.data.reason, 'Sorry, we currently do not deliver to this location.');
  });

  await t.test('3. Delivery Calculation: Tiered slab < ₹300 incurs ₹60 delivery fee', async () => {
    const res = await fetch(`${API_URL}/delivery/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pincode: '625001',
        items: [{ quantity: 1 }],
        subtotal: 200
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.freeDelivery, false);
    assert.strictEqual(data.data.deliveryCharge, 60, 'Subtotal under ₹300 incurs ₹60 fee based on configured tiered rule');
  });

  await t.test('4. Delivery Calculation: Tiered slab ₹300-₹499 incurs ₹40 delivery fee', async () => {
    const res = await fetch(`${API_URL}/delivery/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pincode: '625001',
        items: [{ quantity: 1 }],
        subtotal: 350
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.freeDelivery, false);
    assert.strictEqual(data.data.deliveryCharge, 40, 'Subtotal ₹300-₹499 incurs ₹40 fee');
  });

  await t.test('5. Delivery Calculation: 5+ pieces qualifies for FREE delivery (₹0)', async () => {
    const res = await fetch(`${API_URL}/delivery/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pincode: '625001',
        items: [{ quantity: 5 }],
        subtotal: 400
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.freeDelivery, true, '5+ pieces must unlock free delivery');
    assert.strictEqual(data.data.deliveryCharge, 0, 'Delivery fee must be ₹0');
  });

  await t.test('6. Delivery Calculation: Order Value >= ₹500 qualifies for FREE delivery', async () => {
    const res = await fetch(`${API_URL}/delivery/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pincode: '625001',
        items: [{ quantity: 2 }],
        subtotal: 800
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.freeDelivery, true);
    assert.strictEqual(data.data.deliveryCharge, 0);
  });
});
