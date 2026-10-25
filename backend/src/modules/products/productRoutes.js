import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';
import { query, get, all, transaction } from '../../db/index.js';
import { config } from '../../config/index.js';

const router = Router();

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(config.uploadsDir)) {
      fs.mkdirSync(config.uploadsDir, { recursive: true });
    }
    cb(null, config.uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|jpg|png|webp)/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed.'));
    }
  }
});

// Helper to create slug
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

// Catalog list with search, category, price, and sorting
router.get('/', async (req, res, next) => {
  try {
    const { q, category, min_price, max_price, in_stock, sort, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'ACTIVE' AND p.deleted_at IS NULL
    `;
    const params = [];

    if (q) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.ingredients LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term);
    }

    if (category) {
      sql += ' AND (c.slug = ? OR c.id = ?)';
      params.push(category, category);
    }

    if (min_price) {
      sql += ' AND p.selling_price >= ?';
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      sql += ' AND p.selling_price <= ?';
      params.push(parseFloat(max_price));
    }

    if (in_stock === 'true' || in_stock === '1') {
      sql += ' AND p.stock > 0';
    }

    // Sort order
    if (sort === 'price_asc') {
      sql += ' ORDER BY p.selling_price ASC';
    } else if (sort === 'price_desc') {
      sql += ' ORDER BY p.selling_price DESC';
    } else if (sort === 'bestseller') {
      sql += ' ORDER BY p.is_bestseller DESC, p.created_at DESC';
    } else if (sort === 'discount') {
      sql += ' ORDER BY p.discount DESC';
    } else {
      // Default: featured first, then newest
      sql += ' ORDER BY p.is_featured DESC, p.created_at DESC';
    }

    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const products = await all(sql, params);

    // Attach primary and gallery images
    for (const prod of products) {
      const images = await all(
        'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, display_order ASC',
        [prod.id]
      );
      prod.images = images;
      prod.primary_image = images.find(img => img.is_primary) || images[0] || null;
      if (prod.nutrition) {
        try {
          prod.nutrition_data = JSON.parse(prod.nutrition);
        } catch (e) {
          prod.nutrition_data = null;
        }
      }
    }

    return res.json({ success: true, data: products, count: products.length });
  } catch (err) {
    next(err);
  }
});

// Single product by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await get(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE (p.slug = ? OR p.id = ?) AND p.deleted_at IS NULL`,
      [slug, slug]
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const images = await all(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, display_order ASC',
      [product.id]
    );
    product.images = images;
    product.primary_image = images.find(img => img.is_primary) || images[0] || null;

    if (product.nutrition) {
      try {
        product.nutrition_data = JSON.parse(product.nutrition);
      } catch (e) {
        product.nutrition_data = null;
      }
    }

    return res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// ADMIN APIS
// ==========================================

// Admin get all products (including drafts and inactive)
router.get('/admin/all', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER', 'ORDER_MANAGER'), async (req, res, next) => {
  try {
    const { q, category_id, status } = req.query;
    let sql = `
      SELECT p.*, c.name as category_name, i.current_stock, i.low_stock_threshold
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.deleted_at IS NULL
    `;
    const params = [];

    if (q) {
      sql += ' AND (p.name LIKE ? OR p.slug LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term);
    }
    if (category_id) {
      sql += ' AND p.category_id = ?';
      params.push(category_id);
    }
    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY p.created_at DESC';
    const products = await all(sql, params);

    for (const p of products) {
      p.images = await all('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, display_order ASC', [p.id]);
    }

    return res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
});

// Admin Create Product
router.post('/admin/create', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'), async (req, res, next) => {
  try {
    const {
      name,
      slug,
      description,
      category_id,
      mrp,
      selling_price,
      stock = 0,
      weight,
      selling_unit = 'BOX',
      pieces_per_pack = 1,
      ingredients,
      nutrition,
      delivery_available = 1,
      cod_available = 1,
      status = 'ACTIVE',
      is_featured = 0,
      is_bestseller = 0,
      is_new = 0,
      image_urls = []
    } = req.body;

    if (!name || !mrp || !selling_price || !weight) {
      return res.status(400).json({ success: false, message: 'Please provide product name, MRP, selling price, and weight.' });
    }

    const mrpNum = parseFloat(mrp);
    const priceNum = parseFloat(selling_price);
    const discount = mrpNum > priceNum ? parseFloat((((mrpNum - priceNum) / mrpNum) * 100).toFixed(2)) : 0;
    const finalSlug = slug ? slugify(slug) : slugify(name);
    const prodId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Verify slug uniqueness
    const existing = await get('SELECT id FROM products WHERE slug = ?', [finalSlug]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'A product with this slug/name already exists.' });
    }

    await transaction(async (tx) => {
      await tx.query(
        `INSERT INTO products (
          id, name, slug, description, category_id, mrp, selling_price, discount, stock,
          weight, selling_unit, pieces_per_pack, ingredients, nutrition, delivery_available,
          cod_available, status, is_featured, is_bestseller, is_new
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          prodId,
          name,
          finalSlug,
          description || '',
          category_id || null,
          mrpNum,
          priceNum,
          discount,
          parseInt(stock, 10) || 0,
          weight,
          selling_unit,
          parseInt(pieces_per_pack, 10) || 1,
          ingredients || '',
          typeof nutrition === 'object' ? JSON.stringify(nutrition) : (nutrition || ''),
          delivery_available ? 1 : 0,
          cod_available ? 1 : 0,
          status,
          is_featured ? 1 : 0,
          is_bestseller ? 1 : 0,
          is_new ? 1 : 0
        ]
      );

      // Inventory record
      await tx.query(
        'INSERT INTO inventory (id, product_id, current_stock, reserved_stock, low_stock_threshold) VALUES (?, ?, ?, 0, 15)',
        [`inv_${prodId}`, prodId, parseInt(stock, 10) || 0]
      );

      // Record restock transaction if initial stock > 0
      if (parseInt(stock, 10) > 0) {
        await tx.query(
          `INSERT INTO inventory_transactions (id, product_id, type, quantity, previous_stock, new_stock, reference_id, notes, created_by)
           VALUES (?, ?, 'RESTOCK', ?, 0, ?, 'NEW_PRODUCT', 'Initial stock on product creation', ?)`,
          [`tx_${Date.now()}`, prodId, parseInt(stock, 10), parseInt(stock, 10), req.user.email]
        );
      }

      // Attach image URLs if provided
      if (Array.isArray(image_urls)) {
        for (let i = 0; i < image_urls.length; i++) {
          const imgUrl = image_urls[i];
          await tx.query(
            'INSERT INTO product_images (id, product_id, image_url, display_order, is_primary) VALUES (?, ?, ?, ?, ?)',
            [`img_${Date.now()}_${i}`, prodId, imgUrl, i, i === 0 ? 1 : 0]
          );
        }
      }
    });

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'PRODUCT_CREATE',
      entity: 'PRODUCT',
      entityId: prodId,
      newValue: req.body,
      req
    });

    return res.status(201).json({ success: true, message: 'Product created successfully.', data: { id: prodId } });
  } catch (err) {
    next(err);
  }
});

// Admin Update Product
router.put('/admin/:id', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const oldProduct = await get('SELECT * FROM products WHERE id = ?', [id]);
    if (!oldProduct) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const {
      name,
      slug,
      description,
      category_id,
      mrp,
      selling_price,
      stock,
      weight,
      selling_unit,
      pieces_per_pack,
      ingredients,
      nutrition,
      delivery_available,
      cod_available,
      status,
      is_featured,
      is_bestseller,
      is_new,
      image_urls
    } = req.body;

    const finalName = name !== undefined ? name : oldProduct.name;
    const finalDescription = description !== undefined ? description : (oldProduct.description || '');
    const finalCategoryId = category_id !== undefined ? (category_id || null) : oldProduct.category_id;
    const mrpNum = mrp !== undefined ? parseFloat(mrp) : oldProduct.mrp;
    const priceNum = selling_price !== undefined ? parseFloat(selling_price) : oldProduct.selling_price;
    const discount = mrpNum > priceNum ? parseFloat((((mrpNum - priceNum) / mrpNum) * 100).toFixed(2)) : 0;
    const finalSlug = slug ? slugify(slug) : slugify(finalName);
    const finalStock = stock !== undefined ? (parseInt(stock, 10) || 0) : oldProduct.stock;
    const finalWeight = weight !== undefined ? weight : (oldProduct.weight || '500g');
    const finalSellingUnit = selling_unit !== undefined ? selling_unit : (oldProduct.selling_unit || 'BOX');
    const finalPieces = pieces_per_pack !== undefined ? (parseInt(pieces_per_pack, 10) || 1) : oldProduct.pieces_per_pack;
    const finalIngredients = ingredients !== undefined ? ingredients : (oldProduct.ingredients || '');
    const finalNutrition = nutrition !== undefined ? (typeof nutrition === 'object' ? JSON.stringify(nutrition) : (nutrition || '')) : (oldProduct.nutrition || '');
    const finalDeliveryAvail = delivery_available !== undefined ? (delivery_available ? 1 : 0) : (oldProduct.delivery_available || 1);
    const finalCodAvail = cod_available !== undefined ? (cod_available ? 1 : 0) : (oldProduct.cod_available || 1);
    const finalStatus = status !== undefined ? status : (oldProduct.status || 'ACTIVE');
    const finalFeatured = is_featured !== undefined ? (is_featured ? 1 : 0) : (oldProduct.is_featured || 0);
    const finalBestseller = is_bestseller !== undefined ? (is_bestseller ? 1 : 0) : (oldProduct.is_bestseller || 0);
    const finalNew = is_new !== undefined ? (is_new ? 1 : 0) : (oldProduct.is_new || 0);

    await transaction(async (tx) => {
      await tx.query(
        `UPDATE products SET
          name = ?, slug = ?, description = ?, category_id = ?, mrp = ?, selling_price = ?,
          discount = ?, stock = ?, weight = ?, selling_unit = ?, pieces_per_pack = ?,
          ingredients = ?, nutrition = ?, delivery_available = ?, cod_available = ?,
          status = ?, is_featured = ?, is_bestseller = ?, is_new = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          finalName,
          finalSlug,
          finalDescription,
          finalCategoryId,
          mrpNum,
          priceNum,
          discount,
          finalStock,
          finalWeight,
          finalSellingUnit,
          finalPieces,
          finalIngredients,
          finalNutrition,
          finalDeliveryAvail,
          finalCodAvail,
          finalStatus,
          finalFeatured,
          finalBestseller,
          finalNew,
          id
        ]
      );

      // If stock changed, update inventory & log transaction
      if (stock !== undefined && parseInt(stock, 10) !== oldProduct.stock) {
        const diff = parseInt(stock, 10) - oldProduct.stock;
        await tx.query('UPDATE inventory SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?', [
          parseInt(stock, 10),
          id
        ]);
        await tx.query(
          `INSERT INTO inventory_transactions (id, product_id, type, quantity, previous_stock, new_stock, reference_id, notes, created_by)
           VALUES (?, ?, 'MANUAL_ADJUSTMENT', ?, ?, ?, 'ADMIN_EDIT', 'Stock updated via product edit', ?)`,
          [`tx_${Date.now()}`, id, Math.abs(diff), oldProduct.stock, parseInt(stock, 10), req.user.email]
        );
      }

      // If new images provided, sync them
      if (Array.isArray(image_urls) && image_urls.length > 0) {
        await tx.query('DELETE FROM product_images WHERE product_id = ?', [id]);
        for (let i = 0; i < image_urls.length; i++) {
          await tx.query(
            'INSERT INTO product_images (id, product_id, image_url, display_order, is_primary) VALUES (?, ?, ?, ?, ?)',
            [`img_${Date.now()}_${i}`, id, image_urls[i], i, i === 0 ? 1 : 0]
          );
        }
      }
    });

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'PRODUCT_UPDATE',
      entity: 'PRODUCT',
      entityId: id,
      oldValue: oldProduct,
      newValue: req.body,
      req
    });

    return res.json({ success: true, message: 'Product updated successfully.' });
  } catch (err) {
    next(err);
  }
});

// Admin Delete Product (Supports permanent delete if no order history, or safe deactivation)
router.delete('/admin/:id', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    const oldProduct = await get('SELECT * FROM products WHERE id = ?', [id]);
    if (!oldProduct) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Check if product is referenced in customer orders
    const hasOrders = await get('SELECT id FROM order_items WHERE product_id = ? LIMIT 1', [id]);

    if (permanent === 'true' && !hasOrders) {
      // Clean permanent delete
      await query('DELETE FROM product_images WHERE product_id = ?', [id]);
      await query('DELETE FROM inventory_transactions WHERE product_id = ?', [id]);
      await query('DELETE FROM inventory WHERE product_id = ?', [id]);
      await query('DELETE FROM products WHERE id = ?', [id]);

      await recordAuditLog({
        adminId: req.user.id,
        adminEmail: req.user.email,
        action: 'PRODUCT_PERMANENT_DELETE',
        entity: 'PRODUCT',
        entityId: id,
        oldValue: oldProduct,
        req
      });

      return res.json({ success: true, message: `Product "${oldProduct.name}" permanently deleted.` });
    }

    // Safe soft-delete / deactivation (preserves historical order snapshots)
    await query("UPDATE products SET deleted_at = CURRENT_TIMESTAMP, status = 'INACTIVE' WHERE id = ?", [id]);

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'PRODUCT_SOFT_DELETE',
      entity: 'PRODUCT',
      entityId: id,
      oldValue: oldProduct,
      req
    });

    return res.json({
      success: true,
      message: hasOrders 
        ? `Product "${oldProduct.name}" deactivated and removed from storefront catalog (historical customer orders preserved).`
        : `Product "${oldProduct.name}" removed from catalog.`
    });
  } catch (err) {
    next(err);
  }
});

// Image Upload Endpoint (Multer)
router.post('/admin/upload-image', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded.' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  return res.json({
    success: true,
    message: 'Image uploaded successfully.',
    data: {
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    }
  });
});

export default router;
