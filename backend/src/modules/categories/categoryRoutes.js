import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';
import { query, get, all } from '../../db/index.js';

const router = Router();

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// ==========================================
// CUSTOMER APIS
// ==========================================

// Get all active categories with product counts
router.get('/', async (req, res, next) => {
  try {
    const categories = await all(
      `SELECT c.*, COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id AND p.status = 'ACTIVE' AND p.deleted_at IS NULL
       WHERE c.is_active = 1
       GROUP BY c.id
       ORDER BY c.display_order ASC, c.name ASC`
    );
    return res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

// Single category by slug with its products
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const category = await get(
      'SELECT * FROM categories WHERE slug = ? OR id = ?',
      [slug, slug]
    );

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const products = await all(
      `SELECT * FROM products WHERE category_id = ? AND status = 'ACTIVE' AND deleted_at IS NULL ORDER BY is_featured DESC, created_at DESC`,
      [category.id]
    );

    for (const p of products) {
      const imgs = await all('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC', [p.id]);
      p.primary_image = imgs[0] || null;
      p.images = imgs;
    }

    return res.json({ success: true, data: { category, products } });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// ADMIN APIS
// ==========================================

router.get('/admin/all', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'), async (req, res, next) => {
  try {
    const categories = await all(
      `SELECT c.*, COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id AND p.deleted_at IS NULL
       GROUP BY c.id
       ORDER BY c.display_order ASC, c.created_at DESC`
    );
    return res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/create', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'), async (req, res, next) => {
  try {
    const { name, slug, description, image_url, display_order = 0, is_active = 1 } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });

    const finalSlug = slug ? slugify(slug) : slugify(name);
    const existing = await get('SELECT id FROM categories WHERE slug = ?', [finalSlug]);
    if (existing) return res.status(400).json({ success: false, message: 'Category slug already exists.' });

    const id = `cat_${Date.now()}`;
    await query(
      `INSERT INTO categories (id, name, slug, description, image_url, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, finalSlug, description || null, image_url || null, parseInt(display_order, 10) || 0, is_active ? 1 : 0]
    );

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'CATEGORY_CREATE',
      entity: 'CATEGORY',
      entityId: id,
      newValue: req.body,
      req
    });

    return res.status(201).json({ success: true, message: 'Category created.', data: { id } });
  } catch (err) {
    next(err);
  }
});

router.put('/admin/:id', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const oldCat = await get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!oldCat) return res.status(404).json({ success: false, message: 'Category not found.' });

    const { name, slug, description, image_url, display_order, is_active } = req.body;
    const finalSlug = slug ? slugify(slug) : slugify(name);

    await query(
      `UPDATE categories SET name = ?, slug = ?, description = ?, image_url = ?, display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, finalSlug, description || null, image_url || null, parseInt(display_order, 10) || 0, is_active ? 1 : 0, id]
    );

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'CATEGORY_UPDATE',
      entity: 'CATEGORY',
      entityId: id,
      oldValue: oldCat,
      newValue: req.body,
      req
    });

    return res.json({ success: true, message: 'Category updated.' });
  } catch (err) {
    next(err);
  }
});

router.delete('/admin/:id', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const oldCat = await get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!oldCat) return res.status(404).json({ success: false, message: 'Category not found.' });

    // Set products in this category to NULL category
    await query('UPDATE products SET category_id = NULL WHERE category_id = ?', [id]);
    await query('DELETE FROM categories WHERE id = ?', [id]);

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'CATEGORY_DELETE',
      entity: 'CATEGORY',
      entityId: id,
      oldValue: oldCat,
      req
    });

    return res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;
