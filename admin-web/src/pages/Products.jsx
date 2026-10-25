import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Upload, Check, AlertCircle, X, Image as ImageIcon } from 'lucide-react';
import { adminApi } from '../services/adminApi.js';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category_id: '',
    mrp: '',
    selling_price: '',
    stock: '',
    weight: '500g',
    selling_unit: 'BOX',
    pieces_per_pack: 40,
    description: '',
    ingredients: '',
    nutrition: '',
    status: 'ACTIVE',
    is_featured: 0,
    is_bestseller: 0,
    is_new: 0,
    image_urls: []
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      adminApi.getProducts({ q: search }),
      adminApi.getCategories()
    ]).then(([prodRes, catRes]) => {
      if (prodRes.success) setProducts(prodRes.data);
      if (catRes.success) setCategories(catRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      slug: '',
      category_id: categories[0]?.id || '',
      mrp: '450',
      selling_price: '400',
      stock: '100',
      weight: '500g',
      selling_unit: 'BOX',
      pieces_per_pack: 40,
      description: '',
      ingredients: '',
      nutrition: '',
      status: 'ACTIVE',
      is_featured: 1,
      is_bestseller: 1,
      is_new: 0,
      image_urls: ['/uploads/chocolate-crunch-pb.jpg']
    });
    setModalError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      slug: p.slug,
      category_id: p.category_id || '',
      mrp: String(p.mrp),
      selling_price: String(p.selling_price),
      stock: String(p.stock),
      weight: p.weight,
      selling_unit: p.selling_unit,
      pieces_per_pack: p.pieces_per_pack,
      description: p.description,
      ingredients: p.ingredients || '',
      nutrition: p.nutrition || '',
      status: p.status,
      is_featured: p.is_featured,
      is_bestseller: p.is_bestseller,
      is_new: p.is_new,
      image_urls: p.images ? p.images.map(img => img.image_url) : []
    });
    setModalError('');
    setModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await adminApi.uploadImage(file);
      if (res.success && res.data?.url) {
        setFormData(prev => ({
          ...prev,
          image_urls: [...prev.image_urls, res.data.url]
        }));
      } else {
        alert(res.message || 'Image upload failed.');
      }
    } catch (err) {
      alert(err.message || 'Error uploading image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    try {
      if (editingProduct) {
        await adminApi.updateProduct(editingProduct.id, formData);
      } else {
        await adminApi.createProduct(formData);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setModalError(err.message || 'Failed to save product.');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the store catalog?\n\n• If this product has customer order history, it will be safely deactivated so past invoices and customer order histories are never corrupted.\n• If it is a test product or has no orders, it will be permanently deleted.`)) {
      try {
        const res = await adminApi.deleteProduct(id, true);
        alert(res.message || 'Product removed successfully.');
        loadData();
      } catch (err) {
        alert(err.message || 'Delete failed.');
      }
    }
  };

  return (
    <div>
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
          <input
            type="text"
            placeholder="Search products by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <button onClick={handleOpenAdd} className="btn-admin btn-admin-primary">
          <Plus size={16} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product Name</th>
              <th>Unit / Weight</th>
              <th>Pieces</th>
              <th>MRP</th>
              <th>Selling Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>Loading catalog products...</td></tr>
            ) : products.length > 0 ? (
              products.map(prod => {
                const img = prod.images?.[0]?.image_url || '/chocolate-crunch-pb.jpg';
                return (
                  <tr key={prod.id}>
                    <td>
                      <div style={{ width: '44px', height: '44px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--admin-text-main)' }}>{prod.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{prod.slug}</div>
                    </td>
                    <td>{prod.weight} ({prod.selling_unit})</td>
                    <td><strong>{prod.pieces_per_pack} pcs</strong></td>
                    <td style={{ color: 'var(--admin-text-muted)' }}>₹{prod.mrp}</td>
                    <td><strong style={{ color: 'var(--admin-accent)' }}>₹{prod.selling_price}</strong></td>
                    <td>
                      <span className={`status-pill ${prod.stock > 10 ? 'pill-success' : prod.stock > 0 ? 'pill-warning' : 'pill-danger'}`}>
                        {prod.stock} units
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${prod.status === 'ACTIVE' ? 'pill-success' : 'pill-neutral'}`}>
                        {prod.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="btn-admin btn-admin-outline btn-admin-sm"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id, prod.name)}
                          className="btn-admin btn-admin-danger btn-admin-sm"
                          title="Deactivate / Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '720px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>
                {editingProduct ? 'Edit Catalog Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ color: 'var(--admin-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{ padding: '10px', backgroundColor: '#FEE2E2', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '16px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                <div>
                  <label className="admin-label">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="admin-label">Slug (URL friendly)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="admin-label">MRP (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="admin-label">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="admin-label">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="admin-label">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="admin-select"
                  >
                    <option value="">None</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Units & Pieces */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="admin-label">Weight (e.g. 500g, 1kg) *</label>
                  <input
                    type="text"
                    required
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="admin-label">Selling Unit *</label>
                  <select
                    value={formData.selling_unit}
                    onChange={(e) => setFormData({ ...formData, selling_unit: e.target.value })}
                    className="admin-select"
                  >
                    <option value="BOX">BOX</option>
                    <option value="PACK">PACK</option>
                    <option value="PIECE">PIECE</option>
                    <option value="KG">KG</option>
                    <option value="GRAM">GRAM</option>
                  </select>
                </div>

                <div>
                  <label className="admin-label">Pieces Per Pack *</label>
                  <input
                    type="number"
                    required
                    value={formData.pieces_per_pack}
                    onChange={(e) => setFormData({ ...formData, pieces_per_pack: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="admin-label">Description *</label>
                <textarea
                  rows="3"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="admin-textarea"
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label className="admin-label">Ingredients</label>
                  <textarea
                    rows="2"
                    value={formData.ingredients}
                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                    className="admin-textarea"
                  ></textarea>
                </div>

                <div>
                  <label className="admin-label">Nutrition Facts (JSON string)</label>
                  <textarea
                    rows="2"
                    value={formData.nutrition}
                    onChange={(e) => setFormData({ ...formData, nutrition: e.target.value })}
                    className="admin-textarea"
                    placeholder='{"calories":"68 kcal","protein":"2.2g"}'
                  ></textarea>
                </div>
              </div>

              {/* Image Manager */}
              <div style={{ marginBottom: '18px', padding: '14px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <label className="admin-label" style={{ marginBottom: '8px' }}>Product Images</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {formData.image_urls.map((url, i) => (
                    <div key={i} style={{ width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image_urls: formData.image_urls.filter((_, idx) => idx !== i) })}
                        style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  
                  <label className="btn-admin btn-admin-outline btn-admin-sm" style={{ cursor: 'pointer' }}>
                    <Upload size={14} />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.is_featured === 1} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked ? 1 : 0 })} />
                  <span>Featured Product</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.is_bestseller === 1} onChange={(e) => setFormData({ ...formData, is_bestseller: e.target.checked ? 1 : 0 })} />
                  <span>Best Seller Tag</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.is_new === 1} onChange={(e) => setFormData({ ...formData, is_new: e.target.checked ? 1 : 0 })} />
                  <span>New Batch Tag</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-admin btn-admin-outline">
                  Cancel
                </button>
                <button type="submit" className="btn-admin btn-admin-primary">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
