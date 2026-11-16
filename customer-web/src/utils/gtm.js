/**
 * Google Tag Manager & Google Ads Purchase Conversion Tracking Utility
 * 
 * Container: GTM-M4FRZ443
 * Google Ads Conversion ID: AW-18577833262
 * Google Ads Conversion Label: LENaCIGEm7kdEK76zJpF
 * Currency: INR
 */

export const GOOGLE_ADS_CONFIG = {
  gtmContainerId: 'GTM-M4FRZ443',
  conversionId: 'AW-18577833262',
  conversionLabel: 'LENaCIGEm7kdEK76zJpF',
  currency: 'INR'
};

const TRACKED_ORDERS_STORAGE_KEY = 'madhurai_gtm_tracked_orders';

// In-memory set for fast session-level deduplication
const inMemoryTrackedOrders = new Set();

/**
 * Generate deduplication key for order and event type
 * 
 * @param {string|number} orderIdOrNumber 
 * @param {string} eventCategory - 'PURCHASE' | 'COD_PLACED'
 * @returns {string}
 */
function getStorageKey(orderIdOrNumber, eventCategory = 'PURCHASE') {
  return `${String(orderIdOrNumber).trim()}_${eventCategory.toUpperCase()}`;
}

/**
 * Check if an order has already had this specific conversion event fired.
 * Checks both in-memory set and persistent localStorage.
 * 
 * @param {string|number} orderIdOrNumber - Order ID or Order Number
 * @param {string} eventCategory - 'PURCHASE' | 'COD_PLACED'
 * @returns {boolean} True if already tracked
 */
export function isOrderTracked(orderIdOrNumber, eventCategory = 'PURCHASE') {
  if (!orderIdOrNumber) return false;
  const rawKey = String(orderIdOrNumber).trim();
  if (!rawKey) return false;

  const scopedKey = getStorageKey(rawKey, eventCategory);

  // Check in-memory
  if (inMemoryTrackedOrders.has(scopedKey) || inMemoryTrackedOrders.has(rawKey)) {
    return true;
  }

  // Check localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(TRACKED_ORDERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && (parsed.includes(scopedKey) || parsed.includes(rawKey))) {
          inMemoryTrackedOrders.add(scopedKey);
          return true;
        }
      }
    }
  } catch (e) {
    console.warn('[GTM] LocalStorage access warning:', e.message);
  }
  return false;
}

/**
 * Mark an order event as tracked to prevent duplicate event firing.
 * Persists to both in-memory set and localStorage.
 * 
 * @param {string|number} orderIdOrNumber - Order ID or Order Number
 * @param {string} eventCategory - 'PURCHASE' | 'COD_PLACED'
 */
export function markOrderAsTracked(orderIdOrNumber, eventCategory = 'PURCHASE') {
  if (!orderIdOrNumber) return;
  const rawKey = String(orderIdOrNumber).trim();
  if (!rawKey) return;

  const scopedKey = getStorageKey(rawKey, eventCategory);
  inMemoryTrackedOrders.add(scopedKey);

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(TRACKED_ORDERS_STORAGE_KEY);
      let list = [];
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) list = parsed;
        } catch (_) {}
      }
      if (!list.includes(scopedKey)) {
        list.push(scopedKey);
        // Retain last 300 entries to avoid indefinite growth
        if (list.length > 300) list = list.slice(list.length - 300);
        window.localStorage.setItem(TRACKED_ORDERS_STORAGE_KEY, JSON.stringify(list));
      }
    }
  } catch (e) {
    console.warn('[GTM] LocalStorage write warning:', e.message);
  }
}

/**
 * Clear tracking history (useful for automated testing)
 */
export function resetTrackedOrders() {
  inMemoryTrackedOrders.clear();
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(TRACKED_ORDERS_STORAGE_KEY);
    }
  } catch (_) {}
}

/**
 * Validate order eligibility for Google Ads & GTM conversion tracking.
 * 
 * Strict Conversion Rules:
 * 1. Online Orders (Razorpay, UPI, etc.):
 *    - Must be backend-verified as PAID (`payment_status === 'PAID'`).
 *    - Triggers primary `purchase` event with Google Ads conversion label.
 *    - Fires once per order with duplicate prevention.
 * 
 * 2. Cash on Delivery (COD) Orders at Initial Placement:
 *    - Must NOT trigger the primary `purchase` conversion tag immediately when ORDER_PLACED.
 *    - Tracked separately with event `cod_order_placed` (no conversion_label attached).
 *    - Fires once per COD placement with duplicate prevention.
 * 
 * 3. COD Orders Later Completed & Paid (e.g. Delivered & Cash Collected):
 *    - If an order was COD and backend confirms `payment_status === 'PAID'`,
 *      triggers a separate completed purchase event with its own duplicate prevention.
 * 
 * 4. Failed, cancelled, or unverified orders NEVER fire purchase events.
 * 
 * @param {object} order - Backend order record
 * @returns {object} { eligible: boolean, eventType?: string, reason?: string, isCod?: boolean, isPaid?: boolean, orderId?: string }
 */
export function validatePurchaseEligibility(order) {
  if (!order || typeof order !== 'object') {
    return { eligible: false, reason: 'NO_ORDER_DATA' };
  }

  const orderId = order.order_number || order.id;
  if (!orderId) {
    return { eligible: false, reason: 'MISSING_ORDER_ID' };
  }

  const orderStatus = String(order.order_status || '').toUpperCase();
  const paymentStatus = String(order.payment_status || '').toUpperCase();
  const paymentMethod = String(order.payment_method || '').toUpperCase();
  const isCod = paymentMethod === 'COD';

  // 1. Cancellation and failure guardrails
  if (orderStatus === 'CANCELLED' || orderStatus === 'PAYMENT_FAILED') {
    return { eligible: false, reason: 'ORDER_CANCELLED_OR_FAILED', orderId: String(orderId), orderStatus };
  }

  if (paymentStatus === 'FAILED' || paymentStatus === 'REFUNDED') {
    return { eligible: false, reason: 'PAYMENT_FAILED_OR_REFUNDED', orderId: String(orderId), paymentStatus };
  }

  // 2. CASH ON DELIVERY (COD) LOGIC
  if (isCod) {
    // Case 2A: COD Order Later Delivered & Payment Collected (PAID)
    if (paymentStatus === 'PAID') {
      const alreadyTrackedPurchase = isOrderTracked(order.id, 'PURCHASE') || isOrderTracked(order.order_number, 'PURCHASE');
      if (alreadyTrackedPurchase) {
        return { eligible: false, reason: 'ALREADY_TRACKED', orderId: String(orderId), eventType: 'COD_PURCHASE_COMPLETED' };
      }
      return { eligible: true, eventType: 'COD_PURCHASE_COMPLETED', isCod: true, isPaid: true, orderId: String(orderId) };
    }

    // Case 2B: Initial COD Order Placement (payment_status: PENDING, order_status: ORDER_PLACED / CONFIRMED)
    const validCodPlacementStatuses = ['ORDER_PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    if (!validCodPlacementStatuses.includes(orderStatus)) {
      return { eligible: false, reason: 'COD_NOT_CONFIRMED', orderId: String(orderId), orderStatus };
    }

    const alreadyTrackedCod = isOrderTracked(order.id, 'COD_PLACED') || isOrderTracked(order.order_number, 'COD_PLACED');
    if (alreadyTrackedCod) {
      return { eligible: false, reason: 'ALREADY_TRACKED', orderId: String(orderId), eventType: 'COD_ORDER_PLACED' };
    }

    return { eligible: true, eventType: 'COD_ORDER_PLACED', isCod: true, isPaid: false, orderId: String(orderId) };
  }

  // 3. ONLINE PREPAID ORDERS (Razorpay, Cards, UPI, etc.)
  // Must be verified by backend as PAID
  if (paymentStatus !== 'PAID') {
    return {
      eligible: false,
      reason: 'PAYMENT_NOT_VERIFIED_PAID',
      orderId: String(orderId),
      paymentStatus
    };
  }

  // Deduplication for online purchase
  const alreadyTrackedPurchase = isOrderTracked(order.id, 'PURCHASE') || isOrderTracked(order.order_number, 'PURCHASE');
  if (alreadyTrackedPurchase) {
    return { eligible: false, reason: 'ALREADY_TRACKED', orderId: String(orderId), eventType: 'PURCHASE' };
  }

  return { eligible: true, eventType: 'PURCHASE', isCod: false, isPaid: true, orderId: String(orderId) };
}

/**
 * Construct sanitized Google Tag Manager purchase event payload.
 * Strictly avoids PII (customer email, phone, personal addresses) and payment secrets.
 * 
 * @param {object} order - Verified backend order record
 * @param {array} items - Order items snapshot
 * @param {string} eventType - 'PURCHASE' | 'COD_ORDER_PLACED' | 'COD_PURCHASE_COMPLETED'
 * @returns {object} Standardized dataLayer purchase payload
 */
export function buildPurchasePayload(order, items = [], eventType = 'PURCHASE') {
  const transactionId = String(order.order_number || order.id);
  const totalAmount = Math.max(0, parseFloat(order.total_amount) || 0);
  const isCod = String(order.payment_method || '').toUpperCase() === 'COD';

  const sanitizedItems = (Array.isArray(items) ? items : []).map((item, idx) => ({
    item_id: String(item.product_id || item.id || `item_${idx}`),
    item_name: String(item.product_name_snapshot || item.name || 'Madhurai Artisanal Chocolate'),
    price: Math.max(0, parseFloat(item.unit_price_snapshot || item.selling_price || item.price || 0)),
    quantity: Math.max(1, parseInt(item.quantity || 1, 10))
  }));

  // CASE 1: Initial COD Order Placement
  // Tracks separately with event name 'cod_order_placed'.
  // Does NOT attach primary Google Ads conversion_label so it will not trigger the primary purchase conversion tag!
  if (eventType === 'COD_ORDER_PLACED') {
    return {
      event: 'cod_order_placed',
      transaction_id: transactionId,
      value: totalAmount,
      currency: GOOGLE_ADS_CONFIG.currency,
      payment_method: 'COD',
      payment_type: 'cash_on_delivery',
      order_status: order.order_status,
      ecommerce: {
        transaction_id: transactionId,
        value: totalAmount,
        currency: GOOGLE_ADS_CONFIG.currency,
        payment_type: 'cash_on_delivery',
        shipping: parseFloat(order.delivery_charge || 0),
        discount: parseFloat(order.discount_amount || 0),
        items: sanitizedItems
      }
    };
  }

  // CASE 2: Verified Online Purchase or Later-Completed COD Purchase
  // Fires primary 'purchase' event with Google Ads Conversion Label
  return {
    event: 'purchase',
    transaction_id: transactionId,
    value: totalAmount,
    currency: GOOGLE_ADS_CONFIG.currency,
    conversion_id: GOOGLE_ADS_CONFIG.conversionId,
    conversion_label: GOOGLE_ADS_CONFIG.conversionLabel,
    payment_method: isCod ? 'COD' : (order.payment_method || 'RAZORPAY'),
    payment_type: isCod ? 'cash_on_delivery' : 'online_prepaid',
    is_cod_completed: eventType === 'COD_PURCHASE_COMPLETED',
    ecommerce: {
      transaction_id: transactionId,
      value: totalAmount,
      currency: GOOGLE_ADS_CONFIG.currency,
      payment_type: isCod ? 'cash_on_delivery' : 'online_prepaid',
      shipping: parseFloat(order.delivery_charge || 0),
      discount: parseFloat(order.discount_amount || 0),
      items: sanitizedItems
    }
  };
}

/**
 * Primary conversion trigger: Evaluates order and pushes verified event to GTM dataLayer.
 * 
 * @param {object} order - Backend order record
 * @param {array} items - Order items snapshot
 * @returns {object} Status of the tracking execution
 */
export function trackPurchaseConversion(order, items = []) {
  const eligibility = validatePurchaseEligibility(order);

  if (!eligibility.eligible) {
    if (typeof window !== 'undefined' && window.__DEBUG_GTM__) {
      console.log(`[GTM] Tracking skipped for order ${eligibility.orderId || 'unknown'}: ${eligibility.reason}`);
    }
    return {
      success: false,
      tracked: false,
      reason: eligibility.reason,
      orderId: eligibility.orderId
    };
  }

  const payload = buildPurchasePayload(order, items, eligibility.eventType);

  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    // Clear previous ecommerce object to prevent event parameter bleed (official GTM recommendation)
    window.dataLayer.push({ ecommerce: null });
    // Push the verified conversion event
    window.dataLayer.push(payload);

    if (window.__DEBUG_GTM__ || process.env.NODE_ENV !== 'production') {
      console.log(`[GTM] ✅ ${payload.event} event pushed to dataLayer:`, payload);
    }
  }

  // Determine storage category: 'COD_PLACED' for initial COD placement, 'PURCHASE' for completed purchase
  const trackingCategory = eligibility.eventType === 'COD_ORDER_PLACED' ? 'COD_PLACED' : 'PURCHASE';

  // Mark both primary ID and human-readable order number as tracked
  if (order.id) markOrderAsTracked(order.id, trackingCategory);
  if (order.order_number) markOrderAsTracked(order.order_number, trackingCategory);

  return {
    success: true,
    tracked: true,
    eventType: eligibility.eventType,
    event: payload.event,
    transaction_id: payload.transaction_id,
    value: payload.value,
    currency: payload.currency,
    payment_type: payload.payment_type,
    isCod: eligibility.isCod,
    isPaid: eligibility.isPaid,
    payload
  };
}
