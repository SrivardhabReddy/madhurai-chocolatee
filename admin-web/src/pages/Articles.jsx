import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Image as ImageIcon, Upload, CheckCircle, Clock, BookOpen, X } from 'lucide-react';
import { adminApi } from '../services/adminApi.js';

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image: '',
    author_name: 'Madhurai Chocolatier',
    read_time: '3 min read',
    tags: 'Handcrafted, Chocolate, Gudur',
    is_published: 1
  });

  const loadArticles = () => {
    setLoading(true);
    adminApi.getArticles({ q: search })
      .then(res => {
        if (res.success) setArticles(res.data);
      })
      .catch(err => {
        console.error('Failed to load articles:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadArticles();
  }, [search]);

  const handleOpenCreate = () => {
    setEditingArticle(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      cover_image: '',
      author_name: 'Madhurai Chocolatier',
      read_time: '3 min read',
      tags: 'Handcrafted, Chocolate, Gudur',
      is_published: 1
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (art) => {
    setEditingArticle(art);
    setFormData({
      title: art.title || '',
      slug: art.slug || '',
      excerpt: art.excerpt || '',
      content: art.content || '',
      cover_image: art.cover_image || '',
      author_name: art.author_name || 'Madhurai Chocolatier',
      read_time: art.read_time || '3 min read',
      tags: art.tags || '',
      is_published: art.is_published ? 1 : 0
    });
    setModalOpen(true);
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData(prev => ({
      ...prev,
      title: val,
      slug: editingArticle ? prev.slug : autoSlug
    }));
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await adminApi.uploadArticleImage(file);
      if (res.success && res.url) {
        setFormData(prev => ({ ...prev, cover_image: res.url }));
      } else {
        alert(res.message || 'Image upload failed');
      }
    } catch (err) {
      alert(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in both title and content.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingArticle) {
        const res = await adminApi.updateArticle(editingArticle.id, formData);
        if (res.success) {
          alert('Article updated successfully.');
          setModalOpen(false);
          loadArticles();
        }
      } else {
        const res = await adminApi.createArticle(formData);
        if (res.success) {
          alert('Article created and published successfully.');
          setModalOpen(false);
          loadArticles();
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to save article.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete article "${title}"?`)) {
      try {
        const res = await adminApi.deleteArticle(id);
        if (res.success) {
          alert('Article deleted.');
          loadArticles();
        }
      } catch (err) {
        alert(err.message || 'Failed to delete article.');
      }
    }
  };

  return (
    <div>
      {/* Top Header & Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
          <input
            type="text"
            placeholder="Search articles by title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <button onClick={handleOpenCreate} className="btn-admin btn-admin-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} />
          <span>Write New Article</span>
        </button>
      </div>

      {/* Articles Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Cover</th>
              <th>Title & URL Slug</th>
              <th>Excerpt</th>
              <th>Author</th>
              <th>Read Time</th>
              <th>Status</th>
              <th>Published Date</th>
              <th style={{ width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>Loading articles...</td></tr>
            ) : articles.length > 0 ? (
              articles.map(art => (
                <tr key={art.id}>
                  <td>
                    {art.cover_image ? (
                      <img
                        src={art.cover_image}
                        alt={art.title}
                        style={{ width: '60px', height: '42px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                      />
                    ) : (
                      <div style={{ width: '60px', height: '42px', backgroundColor: '#F1F5F9', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                        <ImageIcon size={18} />
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: '700', color: 'var(--admin-text-main)', fontSize: '0.94rem' }}>
                      {art.title}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>
                      /articles/{art.slug}
                    </div>
                  </td>
                  <td style={{ maxWidth: '240px' }}>
                    <div style={{ fontSize: '0.84rem', color: 'var(--admin-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {art.excerpt || art.content?.slice(0, 75) + '...'}
                    </div>
                  </td>
                  <td><span style={{ fontSize: '0.84rem' }}>{art.author_name}</span></td>
                  <td><span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>{art.read_time}</span></td>
                  <td>
                    <span className={`status-pill ${art.is_published ? 'pill-success' : 'pill-warning'}`}>
                      {art.is_published ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                      {new Date(art.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEdit(art)}
                        className="btn-admin btn-admin-outline btn-admin-sm"
                        title="Edit Article"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(art.id, art.title)}
                        className="btn-admin btn-admin-sm"
                        style={{ backgroundColor: '#FEE2E2', color: '#DC2626', borderColor: '#FCA5A5' }}
                        title="Delete Article"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  <BookOpen size={36} style={{ color: 'var(--admin-text-muted)', marginBottom: '8px' }} />
                  <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.92rem' }}>No articles published yet.</p>
                  <button onClick={handleOpenCreate} className="btn-admin btn-admin-primary btn-admin-sm" style={{ marginTop: '12px' }}>
                    Create First Article
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Article Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '820px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>
                  {editingArticle ? 'Edit Article' : 'Write New Article'}
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                  Publish stories, production updates, and chocolate craftsmanship articles on the website.
                </span>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ color: 'var(--admin-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '16px' }}>
                <div>
                  <label className="admin-label">Article Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., The Art of Slow Roasting Peanuts in Gudur"
                    value={formData.title}
                    onChange={handleTitleChange}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="admin-label">URL Slug *</label>
                  <input
                    type="text"
                    required
                    placeholder="art-of-slow-roasting-peanuts"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              {/* Cover Image Upload & Preview */}
              <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <label className="admin-label" style={{ marginBottom: '8px' }}>Cover Image</label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {formData.cover_image ? (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={formData.cover_image}
                        alt="Article Cover"
                        style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, cover_image: '' })}
                        style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#DC2626', color: '#fff', borderRadius: '50%', padding: '2px' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : null}

                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <label className="btn-admin btn-admin-outline btn-admin-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Upload size={14} />
                        <span>{uploadingImage ? 'Uploading Image...' : 'Upload Image from Computer'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          disabled={uploadingImage}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>or paste URL:</span>
                    </div>
                    <input
                      type="text"
                      placeholder="https://... or /uploads/my-photo.jpg"
                      value={formData.cover_image}
                      onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                      className="admin-input"
                      style={{ marginTop: '8px', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Excerpt */}
              <div style={{ marginBottom: '16px' }}>
                <label className="admin-label">Short Excerpt / Teaser</label>
                <textarea
                  rows={2}
                  placeholder="A brief 1-2 sentence preview shown on the articles catalog cards..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="admin-textarea"
                />
              </div>

              {/* Full Content */}
              <div style={{ marginBottom: '16px' }}>
                <label className="admin-label">Full Article Body * (Paragraphs)</label>
                <textarea
                  rows={8}
                  required
                  placeholder="Write the full story here. Separate paragraphs with double enter..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="admin-textarea"
                  style={{ fontFamily: 'inherit', lineHeight: 1.6 }}
                />
              </div>

              {/* Metadata: Author, Read Time, Tags, Published */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr auto', gap: '16px', alignItems: 'flex-end', marginBottom: '24px' }}>
                <div>
                  <label className="admin-label">Author Name</label>
                  <input
                    type="text"
                    value={formData.author_name}
                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="admin-label">Read Time</label>
                  <input
                    type="text"
                    value={formData.read_time}
                    onChange={(e) => setFormData({ ...formData, read_time: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="admin-label">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Chocolates, Gudur, Peanuts"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div style={{ paddingBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.is_published)}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked ? 1 : 0 })}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--admin-accent)' }}
                    />
                    <span>Publish Live</span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-admin btn-admin-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="btn-admin btn-admin-primary"
                >
                  {submitting ? 'Saving Article...' : editingArticle ? 'Update Article' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
