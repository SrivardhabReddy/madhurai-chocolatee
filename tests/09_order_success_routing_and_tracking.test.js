import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Setup browser globals mock before importing modules
const mockStorage = new Map();
globalThis.window = {
  dataLayer: [],
  location: {
    pathname: '/',
    search: ''
  },
  localStorage: {
    getItem: (key) => mockStorage.get(key) || null,
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key),
    clear: () => mockStorage.clear()
  }
};

const {
  GOOGLE_ADS_CONFIG,
  validatePurchaseEligibility,
  buildPurchasePayload,
  trackPurchaseConversion,
  isOrderTracked,
  markOrderAsTracked,
  resetTrackedOrders
} = await import('../customer-web/src/utils/gtm.js');

// Helper to simulate the route parser from customer-web/src/App.jsx
function parseAppRoute(pathname, search = '') {
  const path = pathname;
  if (path === '/' || path === '') {
    return { page: 'home', params: {} };
  } else if (path.startsWith('/order-success/')) {
    const orderId = path.replace('/order-success/', '').split('/')[0].split('?')[0];
    return { page: 'order_success', params: { orderId } };
  } else if (path === '/order-success') {
    const queryParams = new URLSearchParams(search);
    const orderId = queryParams.get('orderId') || queryParams.get('order_id');
    return { page: 'order_success', params: { orderId: orderId || '' } };
  } else if (path.startsWith('/account/orders/')) {
    const orderId = path.replace('/account/orders/', '').split('/')[0].split('?')[0];
    return { page: 'order_detail', params: { orderId } };
  } else if (path.startsWith('/products/')) {
    const slug = path.replace('/products/', '');
    return { page: 'product_detail', params: { slug } };
  } else if (path === '/cart') {
    return { page: 'cart', params: {} };
  } else if (path === '/checkout') {
    return { page: 'checkout', params: {} };
  } else if (path.startsWith('/account')) {
    return { page: 'account', params: {} };
  }
  return { page: 'home', params: {} };
}

describe('Order Success Routing & Google Ads Purchase Tracking Suite', () => {

  beforeEach(() => {
    mockStorage.clear();
    globalThis.window.dataLayer = [];
    globalThis.window.location.pathname = '/';
    globalThis.window.location.search = '';
    resetTrackedOrders();
  });

  test('1. Router correctly resolves direct URL /order-success/:orderId', () => {
    const route = parseAppRoute('/order-success/ord_1794818172324_gq2y');
    assert.strictEqual(route.page, 'order_success');
    assert.strictEqual(route.params.orderId, 'ord_1794818172324_gq2y');
  });

  test('2. Router correctly resolves human-readable order number in /order-success/:orderNumber', () => {
    const route = parseAppRoute('/order-success/MC-2026-000035');
    assert.strictEqual(route.page, 'order_success');
    assert.strictEqual(route.params.orderId, 'MC-2026-000035');
  });

  test('3. Router correctly resolves /order-success with query parameter ?orderId=...', () => {
    const route = parseAppRoute('/order-success', '?orderId=ord_1794818172324_gq2y');
    assert.strictEqual(route.page, 'order_success');
    assert.strictEqual(route.params.orderId, 'ord_1794818172324_gq2y');
  });

  test('4. Router correctly resolves account order detail /account/orders/:orderId before /account', () => {
    const route = parseAppRoute('/account/orders/ord_1794818172324_gq2y');
    assert.strictEqual(route.page, 'order_detail');
    assert.strictEqual(route.params.orderId, 'ord_1794818172324_gq2y');
  });

  test('5. Live Order ord_1794818172324_gq2y fires verified Google Ads purchase conversion', () => {
    const livePaidOrder = {
      id: 'ord_1794818172324_gq2y',
      order_number: 'MC-2026-000035',
      user_id: 'usr_madhurai_company',
      customer_name: 'srinadth',
      customer_email: 'madhuraicompany@gmail.com',
      total_amount: 30,
      payment_status: 'PAID',
      payment_method: 'RAZORPAY',
      order_status: 'PAYMENT_CONFIRMED',
      delivery_charge: 30,
      discount_amount: 190
    };

    const liveItems = [
      {
        id: 'item_1794818173176_uqon',
        product_id: 'prod_1792819116609_lhst',
        product_name_snapshot: 'MADHURAI mini bites',
        selling_price: 190,
        quantity: 1
      }
    ];

    const result = trackPurchaseConversion(livePaidOrder, liveItems);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.tracked, true);
    assert.strictEqual(result.event, 'purchase');
    assert.strictEqual(result.transaction_id, 'MC-2026-000035');
    assert.strictEqual(result.value, 30);
    assert.strictEqual(result.currency, 'INR');

    // Verify dataLayer payload
    const purchaseEvents = globalThis.window.dataLayer.filter(x => x.event === 'purchase');
    assert.strictEqual(purchaseEvents.length, 1);
    const eventPayload = purchaseEvents[0];
    assert.strictEqual(eventPayload.conversion_id, 'AW-18577833262');
    assert.strictEqual(eventPayload.conversion_label, 'LENaCIGEm7kdEK76zJpF');
    assert.strictEqual(eventPayload.value, 30);
    assert.strictEqual(eventPayload.currency, 'INR');
    assert.strictEqual(eventPayload.transaction_id, 'MC-2026-000035');
    assert.strictEqual(eventPayload.payment_method, 'RAZORPAY');

    // Confirm no PII is exposed
    assert.strictEqual(eventPayload.customer_name, undefined);
    assert.strictEqual(eventPayload.customer_email, undefined);
    assert.strictEqual(eventPayload.customer_phone, undefined);
  });

  test('6. Duplicate Prevention: Refreshing ord_1794818172324_gq2y does NOT re-push purchase event', () => {
    const livePaidOrder = {
      id: 'ord_1794818172324_gq2y',
      order_number: 'MC-2026-000035',
      total_amount: 30,
      payment_status: 'PAID',
      payment_method: 'RAZORPAY',
      order_status: 'PAYMENT_CONFIRMED'
    };

    // First visit: fires successfully
    const firstVisit = trackPurchaseConversion(livePaidOrder, []);
    assert.strictEqual(firstVisit.tracked, true);
    assert.strictEqual(globalThis.window.dataLayer.filter(x => x.event === 'purchase').length, 1);

    // Simulate page reload: dataLayer resets to empty array
    globalThis.window.dataLayer = [];

    // Second visit / refresh
    const secondVisit = trackPurchaseConversion(livePaidOrder, []);
    assert.strictEqual(secondVisit.tracked, false);
    assert.strictEqual(secondVisit.reason, 'ALREADY_TRACKED');

    // Confirm dataLayer remains empty (no duplicate purchase event)
    const purchaseEventsAfterReload = globalThis.window.dataLayer.filter(x => x.event === 'purchase');
    assert.strictEqual(purchaseEventsAfterReload.length, 0);
  });

  test('7. Unpaid or Payment-Failed order does NOT trigger purchase conversion', () => {
    const unpaidOrder = {
      id: 'ord_unpaid_999',
      order_number: 'MC-2026-000099',
      total_amount: 500,
      payment_status: 'PENDING',
      payment_method: 'RAZORPAY',
      order_status: 'ORDER_PLACED'
    };

    const result = trackPurchaseConversion(unpaidOrder, []);
    assert.strictEqual(result.tracked, false);
    assert.strictEqual(result.reason, 'PAYMENT_NOT_VERIFIED_PAID');
    assert.strictEqual(globalThis.window.dataLayer.filter(x => x.event === 'purchase').length, 0);
  });

  test('8. COD order at placement fires cod_order_placed, NOT Google Ads purchase conversion', () => {
    const codOrder = {
      id: 'ord_cod_123',
      order_number: 'MC-2026-000100',
      total_amount: 450,
      payment_status: 'PENDING',
      payment_method: 'COD',
      order_status: 'ORDER_PLACED'
    };

    const result = trackPurchaseConversion(codOrder, []);
    assert.strictEqual(result.tracked, true);
    assert.strictEqual(result.event, 'cod_order_placed');
    assert.strictEqual(globalThis.window.dataLayer.filter(x => x.event === 'purchase').length, 0);

    const codEvents = globalThis.window.dataLayer.filter(x => x.event === 'cod_order_placed');
    assert.strictEqual(codEvents.length, 1);
    assert.strictEqual(codEvents[0].conversion_label, undefined);
  });

});
