import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Setup browser globals mock before importing GTM module
const mockStorage = new Map();
globalThis.window = {
  dataLayer: [],
  localStorage: {
    getItem: (key) => mockStorage.get(key) || null,
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key),
    clear: () => mockStorage.clear()
  }
};

// Import GTM tracking module
const {
  GOOGLE_ADS_CONFIG,
  validatePurchaseEligibility,
  buildPurchasePayload,
  trackPurchaseConversion,
  isOrderTracked,
  markOrderAsTracked,
  resetTrackedOrders
} = await import('../customer-web/src/utils/gtm.js');

describe('Google Ads & GTM Purchase Conversion Tracking Suite', () => {

  beforeEach(() => {
    mockStorage.clear();
    globalThis.window.dataLayer = [];
    resetTrackedOrders();
  });

  test('1. Google Ads Configuration Verification', () => {
    assert.strictEqual(GOOGLE_ADS_CONFIG.gtmContainerId, 'GTM-M4FRZ443');
    assert.strictEqual(GOOGLE_ADS_CONFIG.conversionId, 'AW-18577833262');
    assert.strictEqual(GOOGLE_ADS_CONFIG.conversionLabel, 'LENaCIGEm7kdEK76zJpF');
    assert.strictEqual(GOOGLE_ADS_CONFIG.currency, 'INR');
  });

  test('2. Successful Online Razorpay Payment Tracks Primary Purchase Event in dataLayer', () => {
    const verifiedOrder = {
      id: 'ord_12345_abc',
      order_number: 'MC-2026-000088',
      total_amount: '450.00',
      payment_method: 'RAZORPAY',
      payment_status: 'PAID',
      order_status: 'PAYMENT_CONFIRMED',
      delivery_charge: '0',
      discount_amount: '50.00',
      customer_name: 'Sri Vardhan',
      customer_email: 'test@example.com',
      customer_phone: '+919999999999'
    };

    const items = [
      {
        product_id: 'prod_1',
        product_name_snapshot: 'Chocolate Crunch Peanut Butter Inside',
        unit_price_snapshot: '250.00',
        quantity: 2
      }
    ];

    const result = trackPurchaseConversion(verifiedOrder, items);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.tracked, true);
    assert.strictEqual(result.event, 'purchase');
    assert.strictEqual(result.eventType, 'PURCHASE');
    assert.strictEqual(result.transaction_id, 'MC-2026-000088');
    assert.strictEqual(result.value, 450);
    assert.strictEqual(result.currency, 'INR');
    assert.strictEqual(result.isCod, false);

    // Verify dataLayer pushes: [ { ecommerce: null }, { event: 'purchase', ... } ]
    assert.strictEqual(window.dataLayer.length, 2);
    assert.deepStrictEqual(window.dataLayer[0], { ecommerce: null });

    const purchaseEvent = window.dataLayer[1];
    assert.strictEqual(purchaseEvent.event, 'purchase');
    assert.strictEqual(purchaseEvent.transaction_id, 'MC-2026-000088');
    assert.strictEqual(purchaseEvent.value, 450);
    assert.strictEqual(purchaseEvent.currency, 'INR');
    assert.strictEqual(purchaseEvent.conversion_id, 'AW-18577833262');
    assert.strictEqual(purchaseEvent.conversion_label, 'LENaCIGEm7kdEK76zJpF');
    assert.strictEqual(purchaseEvent.payment_type, 'online_prepaid');
    assert.strictEqual(purchaseEvent.payment_method, 'RAZORPAY');

    // Verify ecommerce items object
    assert.ok(purchaseEvent.ecommerce);
    assert.strictEqual(purchaseEvent.ecommerce.transaction_id, 'MC-2026-000088');
    assert.strictEqual(purchaseEvent.ecommerce.items.length, 1);
    assert.strictEqual(purchaseEvent.ecommerce.items[0].item_id, 'prod_1');
    assert.strictEqual(purchaseEvent.ecommerce.items[0].price, 250);
    assert.strictEqual(purchaseEvent.ecommerce.items[0].quantity, 2);
  });

  test('3. Duplicate Event Prevention for Online Orders (Page Refresh / Revisit)', () => {
    const verifiedOrder = {
      id: 'ord_99999_xyz',
      order_number: 'MC-2026-000089',
      total_amount: '380.00',
      payment_method: 'RAZORPAY',
      payment_status: 'PAID',
      order_status: 'PAYMENT_CONFIRMED'
    };

    // First visit -> fires
    const firstResult = trackPurchaseConversion(verifiedOrder, []);
    assert.strictEqual(firstResult.success, true);
    assert.strictEqual(firstResult.tracked, true);
    assert.strictEqual(firstResult.event, 'purchase');
    assert.strictEqual(window.dataLayer.length, 2);

    // Second visit / page refresh -> blocked by deduplication
    const secondResult = trackPurchaseConversion(verifiedOrder, []);
    assert.strictEqual(secondResult.success, false);
    assert.strictEqual(secondResult.tracked, false);
    assert.strictEqual(secondResult.reason, 'ALREADY_TRACKED');

    // dataLayer must NOT have received any additional events
    assert.strictEqual(window.dataLayer.length, 2);
  });

  test('4. COD Order at Initial Placement Fires cod_order_placed (NOT Purchase Conversion)', () => {
    const codPlacedOrder = {
      id: 'ord_cod_101',
      order_number: 'MC-2026-000101',
      total_amount: '350.00',
      payment_method: 'COD',
      payment_status: 'PENDING',
      order_status: 'ORDER_PLACED'
    };

    const result = trackPurchaseConversion(codPlacedOrder, []);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.tracked, true);
    assert.strictEqual(result.event, 'cod_order_placed');
    assert.strictEqual(result.eventType, 'COD_ORDER_PLACED');
    assert.strictEqual(result.isCod, true);
    assert.strictEqual(result.isPaid, false);

    const pushedEvent = window.dataLayer[1];
    // Must be cod_order_placed, NOT purchase!
    assert.strictEqual(pushedEvent.event, 'cod_order_placed');
    assert.strictEqual(pushedEvent.payment_method, 'COD');
    assert.strictEqual(pushedEvent.payment_type, 'cash_on_delivery');
    assert.strictEqual(pushedEvent.transaction_id, 'MC-2026-000101');

    // Must NOT have primary Google Ads conversion_label
    assert.strictEqual(pushedEvent.conversion_label, undefined);
  });

  test('5. COD Initial Placement Duplicate Prevention on Refresh', () => {
    const codOrder = {
      id: 'ord_cod_102',
      order_number: 'MC-2026-000102',
      total_amount: '290.00',
      payment_method: 'COD',
      payment_status: 'PENDING',
      order_status: 'ORDER_PLACED'
    };

    // First visit -> fires cod_order_placed
    const res1 = trackPurchaseConversion(codOrder, []);
    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.event, 'cod_order_placed');
    assert.strictEqual(window.dataLayer.length, 2);

    // Refresh -> suppressed
    const res2 = trackPurchaseConversion(codOrder, []);
    assert.strictEqual(res2.success, false);
    assert.strictEqual(res2.reason, 'ALREADY_TRACKED');
    assert.strictEqual(window.dataLayer.length, 2);
  });

  test('6. COD Order Later Delivered and Paid Fires Separate Completed Purchase Event', () => {
    const codCompletedOrder = {
      id: 'ord_cod_103',
      order_number: 'MC-2026-000103',
      total_amount: '400.00',
      payment_method: 'COD',
      payment_status: 'PAID', // Delivered & Cash collected!
      order_status: 'DELIVERED'
    };

    // First view of completed COD order receipt -> fires completed purchase!
    const result = trackPurchaseConversion(codCompletedOrder, []);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.tracked, true);
    assert.strictEqual(result.event, 'purchase');
    assert.strictEqual(result.eventType, 'COD_PURCHASE_COMPLETED');
    assert.strictEqual(result.isCod, true);
    assert.strictEqual(result.isPaid, true);

    const purchaseEvent = window.dataLayer[1];
    assert.strictEqual(purchaseEvent.event, 'purchase');
    assert.strictEqual(purchaseEvent.conversion_id, 'AW-18577833262');
    assert.strictEqual(purchaseEvent.conversion_label, 'LENaCIGEm7kdEK76zJpF');
    assert.strictEqual(purchaseEvent.payment_method, 'COD');
    assert.strictEqual(purchaseEvent.payment_type, 'cash_on_delivery');
    assert.strictEqual(purchaseEvent.is_cod_completed, true);

    // Revisit / refresh of delivered COD order -> blocked by duplicate prevention
    const repeatResult = trackPurchaseConversion(codCompletedOrder, []);
    assert.strictEqual(repeatResult.success, false);
    assert.strictEqual(repeatResult.reason, 'ALREADY_TRACKED');
  });

  test('7. Unverified / Pending Online Payment Must NOT Fire Any Event', () => {
    const pendingOrder = {
      id: 'ord_pending_01',
      order_number: 'MC-2026-000090',
      total_amount: '450.00',
      payment_method: 'RAZORPAY',
      payment_status: 'PENDING',
      order_status: 'ORDER_PLACED'
    };

    const result = trackPurchaseConversion(pendingOrder, []);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.tracked, false);
    assert.strictEqual(result.reason, 'PAYMENT_NOT_VERIFIED_PAID');
    assert.strictEqual(window.dataLayer.length, 0);
  });

  test('8. Failed Online Payment Must NOT Fire Purchase Event', () => {
    const failedOrder = {
      id: 'ord_failed_01',
      order_number: 'MC-2026-000091',
      total_amount: '450.00',
      payment_method: 'RAZORPAY',
      payment_status: 'FAILED',
      order_status: 'PAYMENT_FAILED'
    };

    const result = trackPurchaseConversion(failedOrder, []);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.tracked, false);
    assert.ok(result.reason === 'ORDER_CANCELLED_OR_FAILED' || result.reason === 'PAYMENT_FAILED_OR_REFUNDED');
    assert.strictEqual(window.dataLayer.length, 0);
  });

  test('9. Cancelled Order Must NOT Fire Any Purchase Event', () => {
    const cancelledOrder = {
      id: 'ord_cancelled_01',
      order_number: 'MC-2026-000092',
      total_amount: '450.00',
      payment_method: 'RAZORPAY',
      payment_status: 'PAID',
      order_status: 'CANCELLED'
    };

    const result = trackPurchaseConversion(cancelledOrder, []);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.tracked, false);
    assert.strictEqual(result.reason, 'ORDER_CANCELLED_OR_FAILED');
    assert.strictEqual(window.dataLayer.length, 0);
  });

  test('10. Privacy Guardrails: Customer PII and Secrets are NEVER Exposed in dataLayer', () => {
    const orderWithPII = {
      id: 'ord_pii_01',
      order_number: 'MC-2026-000094',
      total_amount: '500.00',
      payment_method: 'RAZORPAY',
      payment_status: 'PAID',
      order_status: 'PAYMENT_CONFIRMED',
      customer_name: 'John Doe',
      customer_email: 'john@secretmail.com',
      customer_phone: '+919876543210',
      delivery_address: 'Flat 101, Secret Residency, Nellore',
      razorpay_signature: 'dummy_sig',
      payment_reference: 'pay_secret123'
    };

    trackPurchaseConversion(orderWithPII, []);
    const event = window.dataLayer[1];

    assert.strictEqual(event.customer_email, undefined);
    assert.strictEqual(event.customer_phone, undefined);
    assert.strictEqual(event.customer_name, undefined);
    assert.strictEqual(event.delivery_address, undefined);
    assert.strictEqual(event.razorpay_signature, undefined);

    const serialized = JSON.stringify(event);
    assert.strictEqual(serialized.includes('john@secretmail.com'), false);
    assert.strictEqual(serialized.includes('+919876543210'), false);
    assert.strictEqual(serialized.includes('Secret Residency'), false);
  });

  test('11. Invalid or Empty Order Data Fails Gracefully Without Throwing', () => {
    assert.doesNotThrow(() => {
      const res1 = trackPurchaseConversion(null);
      assert.strictEqual(res1.success, false);

      const res2 = trackPurchaseConversion({});
      assert.strictEqual(res2.success, false);

      const res3 = trackPurchaseConversion({ total_amount: 100 });
      assert.strictEqual(res3.success, false);
    });
  });

});
