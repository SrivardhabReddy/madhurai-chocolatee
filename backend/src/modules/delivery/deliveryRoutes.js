import { Router } from 'express';
import { DeliveryEngine } from './DeliveryEngine.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles, requirePermission } from '../../middleware/rbac.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';
import { query, get, all } from '../../db/index.js';

const router = Router();

// ==========================================
// CUSTOMER APIS
// ==========================================

// Check pincode serviceability
router.post('/check', async (req, res, next) => {
  try {
    const { pincode, items = [], subtotal = 0 } = req.body;
    const result = await DeliveryEngine.evaluateDelivery({
      pincode,
      items,
      subtotal: parseFloat(subtotal) || 0
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Calculate delivery charge with cart items
router.post('/calculate', async (req, res, next) => {
  try {
    const { pincode, items = [], subtotal = 0 } = req.body;
    const result = await DeliveryEngine.evaluateDelivery({
      pincode,
      items,
      subtotal: parseFloat(subtotal) || 0
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Public Delivery Area Limit & Coverage
router.get('/area-limit', async (req, res, next) => {
  try {
    const info = await DeliveryEngine.getAreaLimitInfo();
    return res.json({ success: true, data: info });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// ADMIN APIS
// ==========================================

// Zones
router.get('/admin/zones', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'), async (req, res, next) => {
  try {
    const zones = await all('SELECT * FROM delivery_zones ORDER BY created_at DESC');
    return res.json({ success: true, data: zones });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/zones', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { name, zone_type = 'STATE', state, district, city, description, is_active = 1 } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Zone name is required.' });

    const id = `zone_${Date.now()}`;
    await query(
      `INSERT INTO delivery_zones (id, name, zone_type, state, district, city, description, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, zone_type, state || null, district || null, city || null, description || null, is_active ? 1 : 0]
    );

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'ZONE_CREATE',
      entity: 'DELIVERY_ZONE',
      entityId: id,
      newValue: req.body,
      req
    });

    return res.status(201).json({ success: true, message: 'Delivery zone created successfully.', data: { id } });
  } catch (err) {
    next(err);
  }
});

router.put('/admin/zones/:id', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, zone_type, state, district, city, description, is_active } = req.body;
    const old = await get('SELECT * FROM delivery_zones WHERE id = ?', [id]);
    if (!old) return res.status(404).json({ success: false, message: 'Zone not found.' });

    await query(
      `UPDATE delivery_zones SET name = ?, zone_type = ?, state = ?, district = ?, city = ?, description = ?, is_active = ?
       WHERE id = ?`,
      [name, zone_type, state || null, district || null, city || null, description || null, is_active ? 1 : 0, id]
    );

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'ZONE_UPDATE',
      entity: 'DELIVERY_ZONE',
      entityId: id,
      oldValue: old,
      newValue: req.body,
      req
    });

    return res.json({ success: true, message: 'Zone updated successfully.' });
  } catch (err) {
    next(err);
  }
});

// Pincodes
router.get('/admin/pincodes', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'), async (req, res, next) => {
  try {
    const { q, serviceable } = req.query;
    let sql = `SELECT p.*, z.name as zone_name FROM delivery_pincodes p LEFT JOIN delivery_zones z ON p.zone_id = z.id WHERE 1=1`;
    const params = [];

    if (q) {
      sql += ` AND (p.pincode LIKE ? OR p.city LIKE ? OR p.district LIKE ? OR p.state LIKE ?)`;
      const term = `%${q}%`;
      params.push(term, term, term, term);
    }
    if (serviceable !== undefined && serviceable !== '') {
      sql += ` AND p.is_serviceable = ?`;
      params.push(serviceable === '1' || serviceable === 'true' ? 1 : 0);
    }

    sql += ` ORDER BY p.pincode ASC`;
    const pincodes = await all(sql, params);
    return res.json({ success: true, data: pincodes });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/pincodes', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { pincode, zone_id, city, district, state, is_serviceable = 1, cod_available = 1, delivery_charge = 40, min_delivery_days = 2, max_delivery_days = 5 } = req.body;
    if (!pincode || !city || !state) {
      return res.status(400).json({ success: false, message: 'Pincode, city, and state are required.' });
    }

    const existing = await get('SELECT id FROM delivery_pincodes WHERE pincode = ?', [pincode.trim()]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Pincode already exists.' });
    }

    const id = `pin_${pincode.trim()}`;
    await query(
      `INSERT INTO delivery_pincodes (id, pincode, zone_id, city, district, state, is_serviceable, cod_available, delivery_charge, min_delivery_days, max_delivery_days)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, pincode.trim(), zone_id || null, city, district || city, state, is_serviceable ? 1 : 0, cod_available ? 1 : 0, parseFloat(delivery_charge) || 40, parseInt(min_delivery_days) || 2, parseInt(max_delivery_days) || 5]
    );

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'PINCODE_ADD',
      entity: 'DELIVERY_PINCODE',
      entityId: id,
      newValue: req.body,
      req
    });

    return res.status(201).json({ success: true, message: 'Pincode registered successfully.' });
  } catch (err) {
    next(err);
  }
});

router.put('/admin/pincodes/:id', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { zone_id, city, district, state, is_serviceable, cod_available, delivery_charge, min_delivery_days, max_delivery_days, status } = req.body;
    const old = await get('SELECT * FROM delivery_pincodes WHERE id = ?', [id]);
    if (!old) return res.status(404).json({ success: false, message: 'Pincode record not found.' });

    await query(
      `UPDATE delivery_pincodes SET zone_id = ?, city = ?, district = ?, state = ?, is_serviceable = ?, cod_available = ?, delivery_charge = ?, min_delivery_days = ?, max_delivery_days = ?, status = ?
       WHERE id = ?`,
      [zone_id || null, city, district, state, is_serviceable ? 1 : 0, cod_available ? 1 : 0, parseFloat(delivery_charge), parseInt(min_delivery_days), parseInt(max_delivery_days), status || 'ACTIVE', id]
    );

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'PINCODE_UPDATE',
      entity: 'DELIVERY_PINCODE',
      entityId: id,
      oldValue: old,
      newValue: req.body,
      req
    });

    return res.json({ success: true, message: 'Pincode updated successfully.' });
  } catch (err) {
    next(err);
  }
});

router.delete('/admin/pincodes/:id', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const old = await get('SELECT * FROM delivery_pincodes WHERE id = ?', [id]);
    if (!old) return res.status(404).json({ success: false, message: 'Pincode record not found.' });

    await query('DELETE FROM delivery_pincodes WHERE id = ?', [id]);
    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'PINCODE_DELETE',
      entity: 'DELIVERY_PINCODE',
      entityId: id,
      oldValue: old,
      req
    });

    return res.json({ success: true, message: 'Pincode deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

// Bulk Pincode Upload / Insert
router.post('/admin/pincodes/bulk', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { pincodes = [] } = req.body;
    if (!Array.isArray(pincodes) || pincodes.length === 0) {
      return res.status(400).json({ success: false, message: 'No pincodes provided for bulk import.' });
    }

    let addedCount = 0;
    for (const p of pincodes) {
      if (!p.pincode || !p.city) continue;
      const cleanPin = String(p.pincode).trim();
      const existing = await get('SELECT id FROM delivery_pincodes WHERE pincode = ?', [cleanPin]);
      if (!existing) {
        await query(
          `INSERT INTO delivery_pincodes (id, pincode, zone_id, city, district, state, is_serviceable, cod_available, delivery_charge, min_delivery_days, max_delivery_days)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `pin_${cleanPin}`,
            cleanPin,
            p.zone_id || null,
            p.city,
            p.district || p.city,
            p.state || 'Tamil Nadu',
            p.is_serviceable !== 0 ? 1 : 0,
            p.cod_available !== 0 ? 1 : 0,
            parseFloat(p.delivery_charge) || 40,
            parseInt(p.min_delivery_days) || 2,
            parseInt(p.max_delivery_days) || 5
          ]
        );
        addedCount++;
      }
    }

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'PINCODE_BULK_IMPORT',
      entity: 'DELIVERY_PINCODE',
      newValue: { count: addedCount },
      req
    });

    return res.json({ success: true, message: `Successfully imported ${addedCount} pincodes.` });
  } catch (err) {
    next(err);
  }
});

// Delivery Rules
router.get('/admin/rules', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'), async (req, res, next) => {
  try {
    const rules = await all('SELECT * FROM delivery_rules ORDER BY priority ASC, created_at DESC');
    return res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/rules', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const {
      name,
      rule_type, // 'QUANTITY', 'ORDER_VALUE', 'PINCODE', 'AREA', 'PRODUCT'
      condition_field,
      operator,
      condition_value,
      delivery_charge = 0,
      free_delivery = 1,
      priority = 4,
      is_active = 1,
      zone_id,
      pincode,
      product_id,
      description
    } = req.body;

    if (!name || !rule_type) {
      return res.status(400).json({ success: false, message: 'Rule name and type are required.' });
    }

    const id = `rule_${Date.now()}`;
    await query(
      `INSERT INTO delivery_rules (
        id, name, rule_type, condition_field, operator, condition_value, 
        delivery_charge, free_delivery, priority, is_active, zone_id, pincode, product_id, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        rule_type,
        condition_field || null,
        operator || null,
        condition_value || null,
        parseFloat(delivery_charge) || 0,
        free_delivery ? 1 : 0,
        parseInt(priority, 10) || 4,
        is_active ? 1 : 0,
        zone_id || null,
        pincode || null,
        product_id || null,
        description || null
      ]
    );

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'DELIVERY_RULE_CREATE',
      entity: 'DELIVERY_RULE',
      entityId: id,
      newValue: req.body,
      req
    });

    return res.status(201).json({ success: true, message: 'Delivery rule created.', data: { id } });
  } catch (err) {
    next(err);
  }
});

router.put('/admin/rules/:id', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const old = await get('SELECT * FROM delivery_rules WHERE id = ?', [id]);
    if (!old) return res.status(404).json({ success: false, message: 'Rule not found.' });

    const {
      name,
      rule_type,
      condition_field,
      operator,
      condition_value,
      delivery_charge,
      free_delivery,
      priority,
      is_active,
      zone_id,
      pincode,
      product_id,
      description
    } = req.body;

    await query(
      `UPDATE delivery_rules SET 
        name = ?, rule_type = ?, condition_field = ?, operator = ?, condition_value = ?,
        delivery_charge = ?, free_delivery = ?, priority = ?, is_active = ?,
        zone_id = ?, pincode = ?, product_id = ?, description = ?
       WHERE id = ?`,
      [
        name,
        rule_type,
        condition_field,
        operator,
        condition_value,
        parseFloat(delivery_charge) || 0,
        free_delivery ? 1 : 0,
        parseInt(priority, 10) || 4,
        is_active ? 1 : 0,
        zone_id || null,
        pincode || null,
        product_id || null,
        description || null,
        id
      ]
    );

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'DELIVERY_RULE_UPDATE',
      entity: 'DELIVERY_RULE',
      entityId: id,
      oldValue: old,
      newValue: req.body,
      req
    });

    return res.json({ success: true, message: 'Rule updated.' });
  } catch (err) {
    next(err);
  }
});

router.delete('/admin/rules/:id', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const old = await get('SELECT * FROM delivery_rules WHERE id = ?', [id]);
    if (!old) return res.status(404).json({ success: false, message: 'Rule not found.' });

    await query('DELETE FROM delivery_rules WHERE id = ?', [id]);

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'DELIVERY_RULE_DELETE',
      entity: 'DELIVERY_RULE',
      entityId: id,
      oldValue: old,
      req
    });

    return res.json({ success: true, message: 'Rule deleted.' });
  } catch (err) {
    next(err);
  }
});

// Delivery Settings
router.get('/admin/settings', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const settings = await all('SELECT * FROM delivery_settings');
    return res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

router.put('/admin/settings', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { settings = {} } = req.body;
    for (const [key, value] of Object.entries(settings)) {
      const existing = await get('SELECT id FROM delivery_settings WHERE setting_key = ?', [key]);
      if (existing) {
        await query('UPDATE delivery_settings SET setting_value = ? WHERE setting_key = ?', [String(value), key]);
      } else {
        await query(
          'INSERT INTO delivery_settings (id, setting_key, setting_value, description) VALUES (?, ?, ?, ?)',
          [`set_${key}`, key, String(value), key]
        );
      }
    }

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'DELIVERY_SETTINGS_UPDATE',
      entity: 'DELIVERY_SETTINGS',
      newValue: settings,
      req
    });

    return res.json({ success: true, message: 'Delivery settings updated.' });
  } catch (err) {
    next(err);
  }
});

export default router;
