import { query } from '../db/index.js';

export async function recordAuditLog({
  adminId,
  adminEmail,
  action,
  entity,
  entityId = null,
  oldValue = null,
  newValue = null,
  req = null
}) {
  try {
    const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown') : 'internal';
    
    const oldStr = oldValue ? (typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue)) : null;
    const newStr = newValue ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : null;

    await query(
      `INSERT INTO audit_logs (id, admin_id, admin_email, action, entity, entity_id, old_value, new_value, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, adminId, adminEmail, action, entity, entityId, oldStr, newStr, ip]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
    // Audit failure should not crash main transaction
  }
}
