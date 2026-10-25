import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Trash2, Edit2, X, CheckCircle } from 'lucide-react';
import { adminApi } from '../services/adminApi.js';

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'PERCENTAGE',
    discount_value: '',
    min_order_amount: '300',
    max_discount_amount: '100',
    usage_limit: '',
    per_customer_limit: '1',
    is_active: 1
  });

  const loadCoupons = () => {
    setLoading(true);
    adminApi.getCoupons()
      .then(res => {
        if (res.success) setCoupons(res.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await adminApi.updateCoupon(editingCoupon.id, formData);
      } else {
        await adminApi.createCoupon(formData);
      }
      setModalOpen(false);
      loadCoupons();
    } catch (err) {
      alert(err.message || 'Failed to save coupon.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this coupon?')) {
      await adminApi.deleteCoupon(id);
      loadCoupons();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800' }}>Promotional Coupons & Discounts</h2>
          <span style={{ fontSize: '0.84rem', color: 'var(--admin-text-muted)' }}>
            Configure percentage or flat discounts with minimum order thresholds and limits
          </span>
        </div>

        <button
          onClick={() => {
            setEditingCoupon(null);
            setFormData({
              code: '',
              description: '',
              discount_type: 'PERCENTAGE',
              discount_value: '10',
              min_order_amount: '300',
              max_discount_amount: '100',
              usage_limit: '',
              per_customer_limit: '1',
              is_active: 1
            });
            setModalOpen(true);
          }}
          className="btn-admin btn-admin-primary"
        >
          <Plus size={16} />
          <span>Create Coupon</span>
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Coupon Code</th>
              <th>Description</th>
              <th>Discount</th>
              <th>Min Order</th>
              <th>Max Cap</th>
              <th>Redemptions</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>Loading coupons...</td></tr>
            ) : coupons.length > 0 ? (
              coupons.map(c => (
                <tr key={c.id}>
                  <td>
                    <strong style={{ letterSpacing: '0.05em', color: 'var(--admin-accent)' }}>{c.code}</strong>
                  </td>
                  <td>{c.description || 'N/A'}</td>
                  <td>
                    <strong>{c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT`}</strong>
                  </td>
                  <td>₹{c.min_order_amount}</td>
                  <td>{c.max_discount_amount ? `₹${c.max_discount_amount}` : 'No Cap'}</td>
                  <td>
                    <span className="status-pill pill-info">{c.usage_count} used</span>
                  </td>
                  <td>
                    <span className={`status-pill ${c.is_active === 1 ? 'pill-success' : 'pill-neutral'}`}>
                      {c.is_active === 1 ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setEditingCoupon(c);
                          setFormData({
                            code: c.code,
                            description: c.description || '',
                            discount_type: c.discount_type,
                            discount_value: String(c.discount_value),
                            min_order_amount: String(c.min_order_amount),
                            max_discount_amount: c.max_discount_amount ? String(c.max_discount_amount) : '',
                            usage_limit: c.usage_limit ? String(c.usage_limit) : '',
                            per_customer_limit: String(c.per_customer_limit),
                            is_active: c.is_active
                          });
                          setModalOpen(true);
                        }}
                        className="btn-admin btn-admin-outline btn-admin-sm"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="btn-admin btn-admin-danger btn-admin-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>No coupons created yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </h3>
              <button onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="admin-label">Coupon Code (Uppercase) *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. FESTIVE20"
                    className="admin-input"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                <div>
                  <label className="admin-label">Discount Type *</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="admin-select"
                  >
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    <option value="FIXED">FLAT AMOUNT (₹)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="admin-label">Discount Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder="10 or 50"
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="admin-label">Min Order (₹)</label>
                  <input
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="admin-label">Max Cap (₹)</label>
                  <input
                    type="number"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                    placeholder="Unlimited"
                    className="admin-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="admin-label">Description / Offer Note</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. 10% OFF on first purchase"
                  className="admin-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active === 1}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                  />
                  <span>Coupon Is Active</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-admin btn-admin-outline">Cancel</button>
                <button type="submit" className="btn-admin btn-admin-primary">Save Coupon</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
