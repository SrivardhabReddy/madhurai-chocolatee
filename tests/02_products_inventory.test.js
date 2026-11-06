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

    // Find first active product in catalog
    const mainProd = data.data[0];
    assert.ok(mainProd, 'Active product must exist in catalog');
    assert.ok(mainProd.pieces_per_pack >= 1, 'Pieces per pack must be valid');
    assert.ok(parseFloat(mainProd.selling_price) > 0, 'Selling price must be positive');
    assert.ok(parseFloat(mainProd.mrp) > 0, 'MRP should be positive');
    assert.ok(mainProd.weight, 'Weight must be specified');
  });

  await t.test('2. Product Search & Filter', async () => {
    const res = await fetch(`${API_URL}/products?q=MADHURAI`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.data.length >= 1);
  });

  await t.test('3. Single Product Fetch by Slug', async () => {
    const allRes = await fetch(`${API_URL}/products`);
    const allData = await allRes.json();
    const slug = allData.data[0].slug;

    const res = await fetch(`${API_URL}/products/${slug}`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.slug, slug);
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
