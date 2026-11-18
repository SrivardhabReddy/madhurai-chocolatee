import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, query, get, all } from '../backend/src/db/index.js';

test('Store Visitor Tracking & Admin Analytics Suite', async (t) => {
  await initDatabase();

  const testVisitor1 = `vis_unit_${Date.now()}_1`;
  const testVisitor2 = `vis_unit_${Date.now()}_2`;

  await t.test('1. Record Storefront Page Visit into Database', async () => {
    const visitId = `visit_test_${Date.now()}`;
    await query(
      `INSERT INTO site_visits (id, visitor_id, session_id, page_path, page_title, referrer, user_agent, device_type, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [visitId, testVisitor1, 'sess_1', '/', 'Madhurai Chocolates', 'https://google.com', 'Mozilla/5.0 (iPhone)', 'MOBILE', '127.0.0.1']
    );

    const row = await get('SELECT * FROM site_visits WHERE id = ?', [visitId]);
    assert.ok(row, 'Visit record must exist in site_visits table');
    assert.strictEqual(row.visitor_id, testVisitor1);
    assert.strictEqual(row.page_path, '/');
    assert.strictEqual(row.device_type, 'MOBILE');
  });

  await t.test('2. Multiple page views by the same visitor increment views without duplicating unique visitors', async () => {
    const beforeStats = await get(
      'SELECT COUNT(*) as total_visits, COUNT(DISTINCT visitor_id) as unique_visitors FROM site_visits WHERE visitor_id = ?',
      [testVisitor1]
    );

    // Same visitor visits catalog and product detail
    await query(
      `INSERT INTO site_visits (id, visitor_id, session_id, page_path, page_title, device_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`visit_${Date.now()}_a`, testVisitor1, 'sess_1', '/products', 'All Chocolates', 'MOBILE']
    );

    await query(
      `INSERT INTO site_visits (id, visitor_id, session_id, page_path, page_title, device_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`visit_${Date.now()}_b`, testVisitor1, 'sess_1', '/products/chocolate-crunch-peanut-butter-inside', 'Crunch 500g', 'MOBILE']
    );

    const afterStats = await get(
      'SELECT COUNT(*) as total_visits, COUNT(DISTINCT visitor_id) as unique_visitors FROM site_visits WHERE visitor_id = ?',
      [testVisitor1]
    );

    assert.strictEqual(Number(afterStats.total_visits), Number(beforeStats.total_visits) + 2);
    assert.strictEqual(Number(afterStats.unique_visitors), 1, 'Unique visitor count for this person must remain 1');
  });

  await t.test('3. Distinct second visitor increments unique visitor count', async () => {
    const beforeTotal = await get('SELECT COUNT(DISTINCT visitor_id) as u FROM site_visits');

    await query(
      `INSERT INTO site_visits (id, visitor_id, session_id, page_path, page_title, device_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`visit_${Date.now()}_c`, testVisitor2, 'sess_2', '/checkout', 'Secure Checkout', 'DESKTOP']
    );

    const afterTotal = await get('SELECT COUNT(DISTINCT visitor_id) as u FROM site_visits');
    assert.strictEqual(Number(afterTotal.u), Number(beforeTotal.u) + 1);
  });

  await t.test('4. Admin Analytics Aggregation: Top Visited Pages query', async () => {
    const topPages = await all(
      `SELECT page_path, COUNT(*) as views, COUNT(DISTINCT visitor_id) as visitors
       FROM site_visits
       GROUP BY page_path
       ORDER BY views DESC
       LIMIT 10`
    );
    assert.ok(Array.isArray(topPages));
    assert.ok(topPages.length > 0);
    assert.ok(topPages.some(p => p.page_path === '/'));
  });

  await t.test('5. Admin Analytics Aggregation: Device Distribution query', async () => {
    const deviceStats = await all(
      `SELECT COALESCE(device_type, 'DESKTOP') as device, COUNT(*) as count
       FROM site_visits
       GROUP BY device_type`
    );
    assert.ok(Array.isArray(deviceStats));
    assert.ok(deviceStats.length > 0);
    assert.ok(deviceStats.some(d => d.device === 'MOBILE'));
  });

  await t.test('6. Storefront Visitor Tracker Client Logic Verification', async () => {
    // Setup browser mocks
    const mockStorage = new Map();
    globalThis.localStorage = {
      getItem: (k) => mockStorage.get(k) || null,
      setItem: (k, v) => mockStorage.set(k, String(v))
    };
    globalThis.sessionStorage = {
      getItem: (k) => mockStorage.get(k) || null,
      setItem: (k, v) => mockStorage.set(k, String(v))
    };

    let beaconSent = null;
    const mockNavigator = {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      sendBeacon: (url, data) => {
        beaconSent = { url, data };
        return true;
      }
    };
    Object.defineProperty(globalThis, 'navigator', {
      value: mockNavigator,
      configurable: true,
      writable: true
    });
    globalThis.document = { title: 'Test Store', referrer: 'https://instagram.com' };
    globalThis.window = { location: { pathname: '/products' } };

    const { trackPageView } = await import('../customer-web/src/utils/visitorTracker.js');
    trackPageView('/products');

    assert.ok(beaconSent, 'sendBeacon should be invoked');
    assert.strictEqual(beaconSent.url, '/api/analytics/visit');
    assert.ok(globalThis.localStorage.getItem('mc_visitor_id'), 'Should persist visitor ID in localStorage');
    assert.ok(globalThis.sessionStorage.getItem('mc_session_id'), 'Should persist session ID in sessionStorage');
  });
});
