import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';
import { query, get, all } from '../../db/index.js';
import { config } from '../../config/index.js';

const router = Router();

// Configure Multer for article image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(config.uploadsDir)) {
      fs.mkdirSync(config.uploadsDir, { recursive: true });
    }
    cb(null, config.uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `article_${Date.now()}_${Math.random().toString(36).substring(2, 6)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|jpg|png|webp|gif)/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WebP, and GIF images are allowed.'));
    }
  }
});

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
// PUBLIC ARTICLE APIS
// ==========================================

// Get published articles
router.get('/', async (req, res, next) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;
    let sql = 'SELECT id, title, slug, excerpt, cover_image, author_name, read_time, tags, created_at FROM articles WHERE is_published = 1';
    const params = [];

    if (q) {
      sql += ' AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const articles = await all(sql, params);
    return res.json({ success: true, data: articles });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// ADMIN ARTICLE APIS
// ==========================================

// Admin list all articles (including unpublished drafts)
router.get('/admin/all', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { q } = req.query;
    let sql = 'SELECT * FROM articles WHERE 1=1';
    const params = [];

    if (q) {
      sql += ' AND (title LIKE ? OR excerpt LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term);
    }

    sql += ' ORDER BY created_at DESC';
    const articles = await all(sql, params);
    return res.json({ success: true, data: articles });
  } catch (err) {
    next(err);
  }
});

// Admin upload article image
router.post('/upload-image', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  return res.json({
    success: true,
    message: 'Image uploaded successfully.',
    url: fileUrl,
    filename: req.file.filename
  });
});

// Get single article by slug or ID
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const article = await get(
      'SELECT * FROM articles WHERE slug = ? OR id = ?',
      [slug, slug]
    );

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }

    return res.json({ success: true, data: article });
  } catch (err) {
    next(err);
  }
});

// Admin create article
router.post('/', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      cover_image,
      author_name = 'Madhurai Chocolatier',
      read_time = '3 min read',
      tags = '',
      is_published = 1
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Article title and content are required.' });
    }

    const finalSlug = slug ? slugify(slug) : slugify(title);
    const existing = await get('SELECT id FROM articles WHERE slug = ?', [finalSlug]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An article with this URL slug already exists.' });
    }

    const id = `art_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await query(
      `INSERT INTO articles (id, title, slug, excerpt, content, cover_image, author_name, read_time, tags, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        title.trim(),
        finalSlug,
        excerpt ? excerpt.trim() : null,
        content.trim(),
        cover_image || null,
        author_name.trim(),
        read_time,
        tags ? tags.trim() : null,
        is_published ? 1 : 0
      ]
    );

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'ARTICLE_CREATE',
      entity: 'ARTICLE',
      entityId: id,
      newValue: { title, slug: finalSlug },
      req
    });

    const created = await get('SELECT * FROM articles WHERE id = ?', [id]);
    return res.status(201).json({ success: true, message: 'Article published successfully.', data: created });
  } catch (err) {
    next(err);
  }
});

// Admin update article
router.put('/:id', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      excerpt,
      content,
      cover_image,
      author_name,
      read_time,
      tags,
      is_published
    } = req.body;

    const existing = await get('SELECT * FROM articles WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }

    let finalSlug = existing.slug;
    if (slug && slug !== existing.slug) {
      finalSlug = slugify(slug);
      const duplicate = await get('SELECT id FROM articles WHERE slug = ? AND id != ?', [finalSlug, id]);
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'An article with this URL slug already exists.' });
      }
    }

    await query(
      `UPDATE articles
       SET title = ?, slug = ?, excerpt = ?, content = ?, cover_image = ?,
           author_name = ?, read_time = ?, tags = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title !== undefined ? title.trim() : existing.title,
        finalSlug,
        excerpt !== undefined ? excerpt : existing.excerpt,
        content !== undefined ? content.trim() : existing.content,
        cover_image !== undefined ? cover_image : existing.cover_image,
        author_name !== undefined ? author_name.trim() : existing.author_name,
        read_time !== undefined ? read_time : existing.read_time,
        tags !== undefined ? tags : existing.tags,
        is_published !== undefined ? (is_published ? 1 : 0) : existing.is_published,
        id
      ]
    );

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'ARTICLE_UPDATE',
      entity: 'ARTICLE',
      entityId: id,
      oldValue: existing,
      newValue: req.body,
      req
    });

    const updated = await get('SELECT * FROM articles WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Article updated successfully.', data: updated });
  } catch (err) {
    next(err);
  }
});

// Admin delete article
router.delete('/:id', authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await get('SELECT * FROM articles WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }

    await query('DELETE FROM articles WHERE id = ?', [id]);

    await recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'ARTICLE_DELETE',
      entity: 'ARTICLE',
      entityId: id,
      oldValue: existing,
      req
    });

    return res.json({ success: true, message: 'Article deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
