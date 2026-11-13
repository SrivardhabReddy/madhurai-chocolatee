import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import app from '../backend/src/app.js';
import { initDatabase, get, query } from '../backend/src/db/index.js';
import { config } from '../backend/src/config/index.js';

async function runTests() {
  console.log('🧪 Starting Razorpay Standard Web Checkout Integration Tests...\n');
  
  await initDatabase();

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`Server listening on port ${port} for test suite\n`);

  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || config.razorpayKeySecret;
    assert.strictEqual(process.env.RAZORPAY_KEY_ID, 'rzp_test_TzgbxfjfSbjUZT', 'RAZORPAY_KEY_ID must match credential');
    assert.strictEqual(keySecret, '1BejLzi7vkYk0Tf6hTsh2uS2', 'RAZORPAY_KEY_SECRET must match credential');

    // -------------------------------------------------------------
    // TEST 1: POST /api/create-order Validation (< 100 paise)
    // -------------------------------------------------------------
    console.log('Test 1: Validating minimum amount (< 100 paise)...');
    const minAmountRes = await fetch(`${baseUrl}/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 50, currency: 'INR' })
    });
    const minAmountData = await minAmountRes.json();
    assert.strictEqual(minAmountRes.status, 400, 'Amount < 100 paise must return 400');
    assert.strictEqual(minAmountData.success, false);
    console.log('  ✓ Correctly rejected amount < 100 paise with status 400\n');

    // -------------------------------------------------------------
    // TEST 2: POST /api/create-order Valid Order Creation
    // -------------------------------------------------------------
    console.log('Test 2: Creating valid order via POST /api/create-order...');
    const createRes = await fetch(`${baseUrl}/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 45000, // 45000 paise = ₹450
        currency: 'INR',
        receipt: `test_rcpt_${Date.now()}`
      })
    });
    const createData = await createRes.json();
    assert.strictEqual(createRes.status, 200, 'Valid order must return 200');
    assert.strictEqual(createData.success, true);
    assert.ok(createData.order_id, 'Response must include order_id');
    assert.strictEqual(createData.amount, 45000, 'Response amount must match 45000');
    assert.strictEqual(createData.currency, 'INR', 'Currency must be INR');
    console.log(`  ✓ Successfully created order: ${createData.order_id} for amount ${createData.amount} paise\n`);

    const orderId = createData.order_id;
    const paymentId = `pay_test_${Date.now()}`;

    // -------------------------------------------------------------
    // TEST 3: POST /api/verify-payment Missing Fields
    // -------------------------------------------------------------
    console.log('Test 3: Testing verify endpoint missing fields...');
    const missingRes = await fetch(`${baseUrl}/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId }) // missing payment_id & signature
    });
    const missingData = await missingRes.json();
    assert.strictEqual(missingRes.status, 400, 'Missing fields must return 400');
    assert.strictEqual(missingData.success, false);
    console.log('  ✓ Correctly rejected missing payment_id / signature with status 400\n');

    // -------------------------------------------------------------
    // TEST 4: POST /api/verify-payment Invalid Signature (Mismatch)
    // -------------------------------------------------------------
    console.log('Test 4: Testing signature mismatch rejection...');
    const mismatchRes = await fetch(`${baseUrl}/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        payment_id: paymentId,
        signature: 'invalid_tampered_signature_hex_12345'
      })
    });
    const mismatchData = await mismatchRes.json();
    assert.strictEqual(mismatchRes.status, 400, 'Tampered signature must return 400');
    assert.strictEqual(mismatchData.success, false);
    console.log('  ✓ Correctly rejected invalid signature with status 400\n');

    // -------------------------------------------------------------
    // TEST 5: POST /api/verify-payment Valid HMAC-SHA256 Signature
    // -------------------------------------------------------------
    console.log('Test 5: Testing valid HMAC-SHA256 signature verification...');
    const validSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const verifyRes = await fetch(`${baseUrl}/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        payment_id: paymentId,
        signature: validSignature
      })
    });
    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyRes.status, 200, 'Valid signature must return 200');
    assert.strictEqual(verifyData.success, true);
    assert.strictEqual(verifyData.order_id, orderId);
    assert.strictEqual(verifyData.payment_id, paymentId);
    console.log('  ✓ Valid signature verified successfully with status 200\n');

    console.log('========================================================');
    console.log('🎉 ALL 5 RAZORPAY STANDARD CHECKOUT TESTS PASSED!');
    console.log('========================================================\n');

  } finally {
    server.close();
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
