import test from 'node:test';
import assert from 'node:assert/strict';

const API_URL = 'http://localhost:4000/api';

test('Authentication & RBAC Suite', async (t) => {
  let customerToken = '';
  let superAdminToken = '';
  let inventoryManagerToken = '';
  const testCustomerEmail = `testuser_${Date.now()}@example.com`;

  await t.test('1. Customer Registration', async () => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Test Customer',
        email: testCustomerEmail,
        password: 'Password@123',
        phone: '9876543210'
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.token, 'Should return JWT token');
    assert.strictEqual(data.data.user.role, 'CUSTOMER');
    customerToken = data.data.token;
  });

  await t.test('2. Customer Login', async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testCustomerEmail,
        password: 'Password@123'
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.token);
  });

  await t.test('3. Super Admin Login', async () => {
    const res = await fetch(`${API_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'madhuraicompany@gmail.com',
        password: 'Madhurai@2026/8/9'
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.user.role, 'SUPER_ADMIN');
    superAdminToken = data.data.token;
  });

  await t.test('4. Inventory Manager Provisioning & Login', async () => {
    // Provision inventory manager with Super Admin credentials
    const provRes = await fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        email: 'inventory@madhuraichocolate.com',
        password: 'Admin@123456',
        full_name: 'Inventory Staff',
        role: 'INVENTORY_MANAGER'
      })
    });
    assert.ok(provRes.status === 201 || provRes.status === 400, 'Staff user created or already exists');

    const res = await fetch(`${API_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'inventory@madhuraichocolate.com',
        password: 'Admin@123456'
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.user.role, 'INVENTORY_MANAGER');
    inventoryManagerToken = data.data.token;
  });

  await t.test('5. Customer trying to access Admin Dashboard must receive 403 Forbidden', async () => {
    const res = await fetch(`${API_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert.strictEqual(res.status, 403, 'Customer token must be rejected with 403 Forbidden');
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  await t.test('6. Inventory Manager trying to access Staff Accounts must receive 403 Forbidden', async () => {
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${inventoryManagerToken}` }
    });
    assert.strictEqual(res.status, 403, 'Inventory manager cannot access staff user configuration');
  });

  await t.test('7. Super Admin accessing Dashboard succeeds', async () => {
    const res = await fetch(`${API_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.totalOrders !== undefined);
  });
});
