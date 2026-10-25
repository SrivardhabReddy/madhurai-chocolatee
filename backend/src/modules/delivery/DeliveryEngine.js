import { get, all } from '../../db/index.js';

export class DeliveryEngine {
  /**
   * Check full serviceability and calculate delivery pricing
   * @param {Object} params
   * @param {string} params.pincode
   * @param {Array} params.items - [{ product_id, quantity, selling_price, pieces_per_pack }]
   * @param {number} params.subtotal
   */
  static async evaluateDelivery({ pincode, items = [], subtotal = 0 }) {
    if (!pincode || typeof pincode !== 'string' || pincode.trim().length === 0) {
      return {
        serviceable: false,
        reason: 'Please enter a valid 6-digit delivery pincode.',
        deliveryCharge: 0,
        freeDelivery: false,
        codAvailable: false
      };
    }

    const cleanPin = pincode.trim();

    // 1. Check Pincode record in database
    const pinRecord = await get(
      `SELECT p.*, z.name as zone_name 
       FROM delivery_pincodes p
       LEFT JOIN delivery_zones z ON p.zone_id = z.id
       WHERE p.pincode = ? AND p.status = 'ACTIVE'`,
      [cleanPin]
    );

    if (!pinRecord || !pinRecord.is_serviceable) {
      return {
        serviceable: false,
        pincode: cleanPin,
        reason: 'Sorry, we currently do not deliver to this location.',
        deliveryCharge: 0,
        freeDelivery: false,
        codAvailable: false,
        estimatedMinDays: 0,
        estimatedMaxDays: 0
      };
    }

    // Calculate total quantity of items
    const totalQuantity = items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 1), 0);
    
    // Fetch active delivery rules sorted by priority ASC (1 is highest priority)
    const activeRules = await all(
      `SELECT * FROM delivery_rules WHERE is_active = 1 ORDER BY priority ASC, created_at ASC`
    );

    // Fetch delivery settings
    const settingsRows = await all(`SELECT setting_key, setting_value FROM delivery_settings`);
    const settings = settingsRows.reduce((acc, row) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});

    const isAreaLimitActive = settings.delivery_area_limit_active === 'true' || settings.delivery_area_limit_active === '1' || settings.delivery_area_limit_active === undefined;
    const limitCity = settings.delivery_area_limit_city || 'Nellore';
    const allowedCitiesRaw = settings.delivery_allowed_cities || 'Gudur, Nellore, Tirupati, Sullurpeta, Naidupeta, Kavali, Chennai, Bengaluru, Hyderabad, Madurai';
    const allowedCitiesList = allowedCitiesRaw
      .split(',')
      .map(c => c.trim().toLowerCase())
      .filter(Boolean);

    // If delivery area limit is enforced, verify if destination area/city is within allowed limit
    if (isAreaLimitActive && allowedCitiesList.length > 0) {
      const pinCityLower = (pinRecord.city || '').trim().toLowerCase();
      const pinDistLower = (pinRecord.district || '').trim().toLowerCase();
      const pinStateLower = (pinRecord.state || '').trim().toLowerCase();
      
      const isAllowed = allowedCitiesList.some(c => 
        pinCityLower.includes(c) || c.includes(pinCityLower) || 
        pinDistLower.includes(c) || c.includes(pinDistLower) ||
        pinStateLower.includes(c) ||
        cleanPin === c
      );

      if (!isAllowed) {
        return {
          serviceable: false,
          pincode: cleanPin,
          city: pinRecord.city,
          state: pinRecord.state,
          reason: `Delivery is currently limited to ${limitCity} and approved areas. Deliveries to ${pinRecord.city || cleanPin} are temporarily beyond our service boundary limit.`,
          deliveryCharge: 0,
          freeDelivery: false,
          codAvailable: false,
          areaLimitNotice: `Active Delivery Limit: Upto ${limitCity}`,
          estimatedMinDays: 0,
          estimatedMaxDays: 0
        };
      }
    }

    const defaultCharge = parseFloat(settings.default_delivery_charge || '40.00');
    const freeThreshold = parseFloat(settings.free_delivery_threshold || '500.00');
    const codEnabledGlobal = settings.cod_enabled !== 'false';
    const minCod = parseFloat(settings.min_cod_order || '0');
    const maxCod = parseFloat(settings.max_cod_order || '100000');

    let isFreeDelivery = false;
    let freeDeliveryReason = '';
    let appliedCharge = pinRecord.delivery_charge !== undefined ? parseFloat(pinRecord.delivery_charge) : defaultCharge;
    let ruleMatched = false;

    // RULE PRIORITY 1: Product-specific rule
    for (const rule of activeRules.filter(r => r.rule_type === 'PRODUCT' && r.product_id)) {
      const hasProduct = items.some(item => item.product_id === rule.product_id);
      if (hasProduct) {
        if (rule.free_delivery) {
          isFreeDelivery = true;
          freeDeliveryReason = rule.description || `Free delivery for ${rule.name}`;
          appliedCharge = 0;
          ruleMatched = true;
          break;
        } else if (rule.delivery_charge !== null) {
          appliedCharge = parseFloat(rule.delivery_charge);
          ruleMatched = true;
          break;
        }
      }
    }

    // RULE PRIORITY 2: Pincode-specific rule
    if (!ruleMatched) {
      const pinRule = activeRules.find(r => r.rule_type === 'PINCODE' && r.pincode === cleanPin);
      if (pinRule) {
        if (pinRule.free_delivery) {
          isFreeDelivery = true;
          freeDeliveryReason = pinRule.description || `Free delivery in ${cleanPin}`;
          appliedCharge = 0;
        } else {
          appliedCharge = parseFloat(pinRule.delivery_charge);
        }
        ruleMatched = true;
      }
    }

    // RULE PRIORITY 3: Area/Zone-specific rule
    if (!ruleMatched && pinRecord.zone_id) {
      const zoneRule = activeRules.find(r => r.rule_type === 'AREA' && r.zone_id === pinRecord.zone_id);
      if (zoneRule) {
        if (zoneRule.free_delivery) {
          isFreeDelivery = true;
          freeDeliveryReason = zoneRule.description || `Free delivery in your zone`;
          appliedCharge = 0;
        } else {
          appliedCharge = parseFloat(zoneRule.delivery_charge);
        }
        ruleMatched = true;
      }
    }

    // RULE PRIORITY 4: Quantity and Order-Value rules
    if (!isFreeDelivery) {
      // Check Quantity rule (e.g. >= 5 items free)
      const qtyRule = activeRules.find(r => r.rule_type === 'QUANTITY' && r.operator === '>=' && totalQuantity >= parseFloat(r.condition_value));
      if (qtyRule && qtyRule.free_delivery) {
        isFreeDelivery = true;
        freeDeliveryReason = qtyRule.description || `Free delivery on 5+ packs/items!`;
        appliedCharge = 0;
      }

      // Check Order-value rule (e.g. >= 500 order free)
      if (!isFreeDelivery) {
        const valRule = activeRules.find(r => r.rule_type === 'ORDER_VALUE' && r.operator === '>=' && subtotal >= parseFloat(r.condition_value));
        if (valRule && valRule.free_delivery) {
          isFreeDelivery = true;
          freeDeliveryReason = valRule.description || `Free delivery on orders above ₹${valRule.condition_value}!`;
          appliedCharge = 0;
        }
      }

      // Check Slabs if not free (e.g. ₹0-₹299 = ₹60, ₹300-₹499 = ₹40)
      if (!isFreeDelivery && !ruleMatched) {
        const slabRule = activeRules.find(r => {
          if (r.rule_type !== 'ORDER_VALUE' || r.free_delivery) return false;
          const val = parseFloat(r.condition_value);
          if (r.operator === '<' && subtotal < val) return true;
          if (r.operator === '<=' && subtotal <= val) return true;
          if (r.operator === '>=' && subtotal >= val) return true;
          return false;
        });
        if (slabRule) {
          appliedCharge = parseFloat(slabRule.delivery_charge);
        }
      }
    }

    // Final Free Delivery fallback check: subtotal >= global freeThreshold
    if (!isFreeDelivery && freeThreshold > 0 && subtotal >= freeThreshold) {
      isFreeDelivery = true;
      freeDeliveryReason = `Free delivery on orders above ₹${freeThreshold}!`;
      appliedCharge = 0;
    }

    // COD eligibility check
    let codAvailable = Boolean(pinRecord.cod_available) && codEnabledGlobal;
    let codReason = '';
    if (codAvailable) {
      if (subtotal > 0 && subtotal < minCod) {
        codAvailable = false;
        codReason = `COD is only available for orders of at least ₹${minCod}.`;
      } else if (subtotal > maxCod) {
        codAvailable = false;
        codReason = `Orders above ₹${maxCod} must be paid online.`;
      }
    }

    return {
      serviceable: true,
      pincode: cleanPin,
      city: pinRecord.city,
      district: pinRecord.district,
      state: pinRecord.state,
      zoneName: pinRecord.zone_name || 'Standard Zone',
      deliveryCharge: isFreeDelivery ? 0 : appliedCharge,
      freeDelivery: isFreeDelivery,
      freeDeliveryReason: isFreeDelivery ? freeDeliveryReason : null,
      estimatedMinDays: pinRecord.min_delivery_days,
      estimatedMaxDays: pinRecord.max_delivery_days,
      codAvailable,
      codReason: codReason || null,
      areaLimitNotice: isAreaLimitActive ? `Within Delivery Area Limit (Upto ${limitCity})` : null,
      limitCity: isAreaLimitActive ? limitCity : null,
      reason: null
    };
  }

  /**
   * Get active area limit configuration
   */
  static async getAreaLimitInfo() {
    const settingsRows = await all(`SELECT setting_key, setting_value FROM delivery_settings`);
    const settings = settingsRows.reduce((acc, row) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});

    const active = settings.delivery_area_limit_active === 'true' || settings.delivery_area_limit_active === '1' || settings.delivery_area_limit_active === undefined;
    const limitCity = settings.delivery_area_limit_city || 'Nellore';
    const rawAllowed = settings.delivery_allowed_cities || 'Gudur, Nellore, Tirupati, Sullurpeta, Naidupeta, Kavali, Chennai, Bengaluru, Hyderabad, Madurai';
    const allowedCities = rawAllowed.split(',').map(c => c.trim()).filter(Boolean);

    return {
      active,
      limitCity,
      allowedCities,
      rawAllowedCities: rawAllowed,
      bannerText: settings.delivery_area_banner_text || `🚚 Fresh Artisanal Cacao: Delivering across South India up to ${limitCity}! Check your pincode.`,
      preset: settings.delivery_area_preset || 'UPTO_NELLORE'
    };
  }
}
