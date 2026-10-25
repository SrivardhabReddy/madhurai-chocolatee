import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { query, get, all } from '../../db/index.js';
import { authenticate } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';

const router = Router();

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

// ==========================================
// CUSTOMER AUTH
// ==========================================

// Register Customer
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { email, password, phone } = req.body;
    const full_name = (req.body.full_name || req.body.fullName || req.body.name || '').trim();
    if (!email || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await get('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await query(
      `INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active)
       VALUES (?, ?, ?, ?, ?, 'CUSTOMER', 1)`,
      [userId, cleanEmail, password_hash, full_name.trim(), phone ? phone.trim() : null]
    );

    const token = generateToken({ id: userId, email: cleanEmail, role: 'CUSTOMER' });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        token,
        user: {
          id: userId,
          email: cleanEmail,
          full_name: full_name.trim(),
          phone: phone ? phone.trim() : null,
          role: 'CUSTOMER'
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// Login Customer
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await get('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// ADMIN AUTH (SEPARATE SECURE ENDPOINT)
// ==========================================

router.post('/admin/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide administrator email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await get('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    // STRICT ROLE CHECK: Customers are forbidden from administrative portals
    if (user.role === 'CUSTOMER') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: This portal is reserved exclusively for authorized business staff.'
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    // Load RBAC permissions
    const perms = await all(
      `SELECT module, can_read, can_write, can_delete, can_manage 
       FROM admin_permissions p
       JOIN admin_roles r ON p.role_id = r.id
       WHERE r.name = ?`,
      [user.role]
    );
    const permissions = perms.reduce((acc, p) => {
      acc[p.module] = {
        read: Boolean(p.can_read),
        write: Boolean(p.can_write),
        delete: Boolean(p.can_delete),
        manage: Boolean(p.can_manage)
      };
      return acc;
    }, {});

    const token = generateToken(user);

    // Record audit log
    await recordAuditLog({
      adminId: user.id,
      adminEmail: user.email,
      action: 'ADMIN_LOGIN',
      entity: 'AUTH',
      entityId: user.id,
      req
    });

    return res.json({
      success: true,
      message: 'Admin authentication successful.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
          permissions
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// Current User Profile
router.get('/me', authenticate, async (req, res, next) => {
  try {
    return res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (err) {
    next(err);
  }
});

// Update Profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { full_name, phone } = req.body;
    if (!full_name) return res.status(400).json({ success: false, message: 'Full name is required.' });

    await query(
      'UPDATE users SET full_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [full_name.trim(), phone ? phone.trim() : null, req.user.id]
    );

    return res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    next(err);
  }
});

// Change Password
router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await get('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await query('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newHash, req.user.id]);

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// CUSTOMER ADDRESSES
// ==========================================

router.get('/addresses', authenticate, async (req, res, next) => {
  try {
    const addresses = await all('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [req.user.id]);
    return res.json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
});

router.post('/addresses', authenticate, async (req, res, next) => {
  try {
    const { full_name, phone, house_building, street, area, landmark, city, district, state, pincode, is_default = 0 } = req.body;
    if (!full_name || !phone || !house_building || !street || !area || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: 'Please provide all mandatory address fields.' });
    }

    const id = `addr_${Date.now()}`;
    if (is_default) {
      await query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }

    await query(
      `INSERT INTO addresses (id, user_id, full_name, phone, house_building, street, area, landmark, city, district, state, pincode, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, full_name, phone, house_building, street, area, landmark || null, city, district || city, state, pincode, is_default ? 1 : 0]
    );

    return res.status(201).json({ success: true, message: 'Address saved.', data: { id } });
  } catch (err) {
    next(err);
  }
});

router.delete('/addresses/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);
    return res.json({ success: true, message: 'Address removed.' });
  } catch (err) {
    next(err);
  }
});

export default router;
