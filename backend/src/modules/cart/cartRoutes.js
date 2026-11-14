import { Router } from 'express';
import { optionalAuth, authenticate } from '../../middleware/auth.js';
import { DeliveryEngine } from '../delivery/DeliveryEngine.js';
import { query, get, all, transaction } from '../../db/index.js';

const router = Router();

// Validate cart items and recalculate official pricing breakdown
router.post('/validate', optionalAuth, async (req, res, next) => {
  try {
    const { items = [], pincode, coupon_code } = req.body;

    let subtotal = 0;
    let totalMrp = 0;
    const validatedItems = [];

    for (const item of items) {
      const pId = item.product_id || item.id;
      let prod = await get(
        `SELECT p.*, c.name as category_name 
         FROM products p 
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE (p.id = ? OR p.slug = ? OR p.name = ?) AND p.status = 'ACTIVE' AND p.deleted_at IS NULL`,
        [pId, item.slug || pId, item.name || pId]
      );

      if (!prod && item.name) {
        prod = await get(
          `SELECT p.*, c.name as category_name 
           FROM products p 
           LEFT JOIN categories c ON p.category_id = c.id
           WHERE (LOWER(p.name) LIKE ? OR LOWER(p.slug) LIKE ?) AND p.status = 'ACTIVE' AND p.deleted_at IS NULL`,
          [`%${item.name.toLowerCase().replace(/[^a-z0-9]/g, '%')}%`, `%${item.name.toLowerCase().replace(/[^a-z0-9]/g, '%')}%`]
        );
      }

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const sellingPrice = prod ? parseFloat(prod.selling_price) : (parseFloat(item.selling_price) || parseFloat(item.price) || 0);
      const mrp = prod ? parseFloat(prod.mrp) : (parseFloat(item.mrp) || sellingPrice);

      let currentStock = 99;
      if (prod) {
        const inv = await get('SELECT current_stock FROM inventory WHERE product_id = ?', [prod.id]);
        currentStock = inv ? inv.current_stock : prod.stock;
      }

      let primaryImage = item.image_url || '/uploads/chocolate-crunch-pb.jpg';
      if (prod) {
        const imgs = await all('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC', [prod.id]);
        primaryImage = imgs[0]?.image_url || prod.image_url || primaryImage;
      }

      const itemTotal = sellingPrice * qty;
      const itemMrpTotal = mrp * qty;
      subtotal += itemTotal;
      totalMrp += itemMrpTotal;

      validatedItems.push({
        product_id: prod ? prod.id : pId,
        name: prod ? prod.name : (item.name || 'Madhurai Chocolate'),
        slug: prod ? prod.slug : (item.slug || 'chocolate'),
        image_url: primaryImage,
        weight: prod ? prod.weight : (item.weight || '320g'),
        selling_unit: prod ? prod.selling_unit : (item.selling_unit || 'BOX'),
        pieces_per_pack: prod ? prod.pieces_per_pack : (item.pieces_per_pack || 1),
        mrp,
        selling_price: sellingPrice,
        discount: prod ? prod.discount : (mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0),
        quantity: qty,
        itemTotal,
        inStock: currentStock >= qty,
        availableStock: currentStock
      });
    }

    // Coupon calculation
    let discountAmount = 0;
    let appliedCoupon = null;

    if (coupon_code) {
      const code = String(coupon_code).trim().toUpperCase();
      const coupon = await get('SELECT * FROM coupons WHERE code = ? AND is_active = 1', [code]);
      if (coupon) {
        const minOrder = parseFloat(coupon.min_order_amount) || 0;
        if (subtotal >= minOrder) {
          const discountVal = parseFloat(coupon.discount_value) || 0;
          const minRange = parseFloat(coupon.min_discount_amount) || 0;
          const maxRange = parseFloat(coupon.max_discount_amount) || 0;

          if (coupon.discount_type === 'PERCENTAGE') {
            discountAmount = (subtotal * discountVal) / 100;
            if (minRange > 0 && discountAmount < minRange) {
              discountAmount = minRange;
            }
            if (maxRange > 0 && discountAmount > maxRange) {
              discountAmount = maxRange;
            }
          } else if (coupon.discount_type === 'RANGE') {
            const val1 = minRange > 0 ? minRange : discountVal;
            const val2 = maxRange > 0 ? maxRange : (discountVal > 0 ? discountVal : val1);
            const minD = Math.min(val1, val2);
            const maxD = Math.max(val1, val2);
            if (minD === maxD) {
              discountAmount = minD;
            } else {
              const seed = Math.abs(Math.sin(subtotal + (code.charCodeAt(0) || 7)));
              discountAmount = Math.round(minD + seed * (maxD - minD));
            }
          } else {
            // FIXED / FLAT AMOUNT
            discountAmount = discountVal;
            if (minRange > 0 && discountAmount < minRange) {
              discountAmount = minRange;
            }
            if (maxRange > 0 && discountAmount > maxRange) {
              discountAmount = maxRange;
            }
          }
          discountAmount = Math.min(discountAmount, subtotal);
          discountAmount = Math.round(discountAmount * 100) / 100;
          appliedCoupon = {
            code: coupon.code,
            description: coupon.description,
            discount: discountAmount,
            discount_amount: discountAmount
          };
        }
      }
    }

    // Delivery calculation
    let deliveryInfo = {
      serviceable: true,
      deliveryCharge: 0,
      freeDelivery: false,
      reason: null
    };

    if (pincode) {
      deliveryInfo = await DeliveryEngine.evaluateDelivery({
        pincode,
        items: validatedItems,
        subtotal: subtotal - discountAmount
      });
    }

    const deliveryCharge = deliveryInfo.freeDelivery ? 0 : deliveryInfo.deliveryCharge;
    const finalTotal = Math.max(0, subtotal - discountAmount + deliveryCharge);
    const totalSavings = (totalMrp - subtotal) + discountAmount;

    return res.json({
      success: true,
      data: {
        items: validatedItems,
        subtotal,
        totalMrp,
        totalSavings,
        coupon: appliedCoupon,
        discountAmount,
        delivery: deliveryInfo,
        deliveryCharge,
        tax: 0, // In India, FMCG packaged food prices are inclusive of GST
        finalTotal
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
