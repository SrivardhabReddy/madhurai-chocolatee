import test from 'node:test';
import assert from 'node:assert/strict';

const API_URL = 'http://localhost:4000/api';

test('Products & Inventory Suite', async (t) => {
  let superAdminToken = '';

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

  await t.test('1. Storefront Product Retrieval & Main Product Verification', async () => {
    const res = await fetch(`${API_URL}/products`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data), 'Products should be an array');
    assert.ok(data.data.length >= 1, 'Should contain at least 1 product');

    // Find main flagship product
    const mainProd = data.data.find(p => p.slug === 'chocolate-crunch-peanut-butter-inside');
    assert.ok(mainProd, 'Flagship chocolate crunch product must exist in catalog');
    assert.strictEqual(mainProd.pieces_per_pack, 40, 'Pieces per pack must be 40');
    assert.strictEqual(parseFloat(mainProd.selling_price), 400, 'Selling price must be ₹400');
    assert.strictEqual(parseFloat(mainProd.mrp), 450, 'MRP should be ₹450');
    assert.strictEqual(mainProd.weight, '500g', 'Weight must be 500g');
    assert.strictEqual(mainProd.selling_unit, 'BOX', 'Selling unit must be BOX');
  });

  await t.test('2. Product Search & Filter', async () => {
    const res = await fetch(`${API_URL}/products?q=Crunch`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.data.length >= 1);
    assert.ok(data.data.some(p => p.name.toLowerCase().includes('crunch')));
  });

  await t.test('3. Single Product Fetch by Slug', async () => {
    const res = await fetch(`${API_URL}/products/chocolate-crunch-peanut-butter-inside`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.slug, 'chocolate-crunch-peanut-butter-inside');
    assert.ok(data.data.images?.length >= 1, 'Product must have images');
  });

  await t.test('4. Admin Inventory Overview & Restock', async () => {
    const overviewRes = await fetch(`${API_URL}/admin/inventory/admin/overview`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const overview = await overviewRes.json();
    assert.strictEqual(overviewRes.status, 200);
    assert.strictEqual(overview.success, true);
    assert.ok(overview.data.items?.length >= 1);

    const firstItem = overview.data.items[0];
    const initialStock = firstItem.current_stock;

    // Perform restock
    const restockRes = await fetch(`${API_URL}/admin/inventory/admin/restock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        product_id: firstItem.product_id,
        quantity: 20,
        notes: 'Automated test batch restock'
      })
    });

    const restockData = await restockRes.json();
    assert.strictEqual(restockRes.status, 200);
    assert.strictEqual(restockData.success, true);
    assert.strictEqual(restockData.data.new_stock, initialStock + 20);
  });
});
