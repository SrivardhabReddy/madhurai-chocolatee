import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { get, all } from '../db/index.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please log in again.'
      });
    }

    const user = await get(
      'SELECT id, email, full_name, phone, role, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account not found or has been disabled.'
      });
    }

    // If user is staff/admin, attach their permissions
    if (user.role !== 'CUSTOMER') {
      const perms = await all(
        `SELECT module, can_read, can_write, can_delete, can_manage 
         FROM admin_permissions p
         JOIN admin_roles r ON p.role_id = r.id
         WHERE r.name = ?`,
        [user.role]
      );
      user.permissions = perms.reduce((acc, p) => {
        acc[p.module] = {
          read: Boolean(p.can_read),
          write: Boolean(p.can_write),
          delete: Boolean(p.can_delete),
          manage: Boolean(p.can_manage)
        };
        return acc;
      }, {});
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({
      success: false,
      message: 'Authentication processing failed.'
    });
  }
}

// Optional Auth (e.g. For Cart / Checkout where user might be guest or logged in)
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        const user = await get(
          'SELECT id, email, full_name, phone, role FROM users WHERE id = ? AND is_active = 1',
          [decoded.userId]
        );
        if (user) {
          req.user = user;
        }
      } catch (e) {
        // Token invalid, continue as guest
      }
    }
    next();
  } catch (err) {
    next();
  }
}
