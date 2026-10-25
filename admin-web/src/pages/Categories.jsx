import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    display_order: 0,
    is_active: 1
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCategories();
      if (res.success) {
        setCategories(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCat(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      display_order: categories.length,
      is_active: 1
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCat(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image_url: cat.image_url || '',
      display_order: cat.display_order || 0,
      is_active: cat.is_active ? 1 : 0
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingCat) {
        await adminApi.updateCategory(editingCat.id, form);
        setSuccess('Category updated successfully.');
      } else {
        await adminApi.createCategory(form);
        setSuccess('Category created successfully.');
      }
      setModalOpen(false);
      loadCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name, productCount) => {
    if (productCount > 0) {
      alert(`Cannot delete category "${name}" because it still contains ${productCount} products. Please reassign or delete products first.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await adminApi.deleteCategory(id);
      loadCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>
            Category Management
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Organize products into customer-facing storefront categories
          </p>
        </div>
        <button onClick={openCreateModal} className="admin-btn admin-btn-primary">
          + Add Category
        </button>
      </div>

      {error && <div className="admin-alert admin-alert-danger">{error}</div>}
      {success && <div className="admin-alert admin-alert-success">{success}</div>}

      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading categories...</div>
        ) : categories.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            No categories found. Click "+ Add Category" to create your first category.
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Order</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {c.image_url ? (
                          <img
                            src={c.image_url}
                            alt={c.name}
                            style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '6px',
                              background: '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#94a3b8',
                              fontWeight: '600'
                            }}
                          >
                            📁
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: '600', color: '#0f172a' }}>{c.name}</div>
                          {c.description && (
                            <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {c.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <code style={{ background: '#f8fafc', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                        {c.slug}
                      </code>
                    </td>
                    <td>{c.display_order}</td>
                    <td>
                      <span className="admin-badge admin-badge-info">
                        {c.product_count || 0} products
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${c.is_active ? 'admin-badge-success' : 'admin-badge-neutral'}`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openEditModal(c)}
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name, c.product_count)}
                          className="admin-btn admin-btn-danger"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editingCat ? `Edit Category: ${editingCat.name}` : 'Create New Category'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-label">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="admin-input"
                    placeholder="e.g. Peanut Butter Truffles"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Slug (URL identifier)</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="admin-input"
                    placeholder="Leave empty to auto-generate from name"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="admin-input"
                    placeholder="Brief description for customer catalog"
                  />
                </div>

                <div className="admin-grid-2">
                  <div className="admin-form-group">
                    <label className="admin-label">Image URL</label>
                    <input
                      type="text"
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      className="admin-input"
                      placeholder="e.g. /madhurai-pack-box.jpg"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Display Order</label>
                    <input
                      type="number"
                      value={form.display_order}
                      onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value, 10) || 0 })}
                      className="admin-input"
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Category Status</label>
                  <select
                    value={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: parseInt(e.target.value, 10) })}
                    className="admin-select"
                  >
                    <option value={1}>Active (Visible on Storefront)</option>
                    <option value={0}>Inactive (Hidden from Customers)</option>
                  </select>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="admin-btn admin-btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editingCat ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
