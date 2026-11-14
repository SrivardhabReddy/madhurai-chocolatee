import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Trash2, Edit2, X, CheckCircle, HelpCircle, Tag, DollarSign, Shuffle } from 'lucide-react';
import { adminApi } from '../services/adminApi.js';

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'FIXED', // 'FIXED' | 'RANGE' | 'PERCENTAGE'
    discount_value: '180',
    min_order_amount: '0',
    min_discount_amount: '95',
    max_discount_amount: '180',
    usage_limit: '',
    per_customer_limit: '1',
    is_active: 1
  });

  const loadCoupons = () => {
    setLoading(true);
    adminApi.getCoupons()
      .then(res => {
        if (res && res.success) {
          setCoupons(res.data || []);
        }
      })
      .catch(err => {
        console.error('Failed to load coupons:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discount_type: 'FIXED',
      discount_value: '180',
      min_order_amount: '190',
      min_discount_amount: '95',
      max_discount_amount: '180',
      usage_limit: '',
      per_customer_limit: '1',
      is_active: 1
    });
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCoupon(c);
    setFormData({
      code: c.code || '',
      description: c.description || '',
      discount_type: c.discount_type || 'FIXED',
      discount_value: c.discount_value !== undefined && c.discount_value !== null ? String(c.discount_value) : '',
      min_order_amount: c.min_order_amount !== undefined && c.min_order_amount !== null ? String(c.min_order_amount) : '0',
      min_discount_amount: c.min_discount_amount !== undefined && c.min_discount_amount !== null ? String(c.min_discount_amount) : '',
      max_discount_amount: c.max_discount_amount !== undefined && c.max_discount_amount !== null ? String(c.max_discount_amount) : '',
      usage_limit: c.usage_limit ? String(c.usage_limit) : '',
      per_customer_limit: c.per_customer_limit ? String(c.per_customer_limit) : '1',
      is_active: c.is_active !== undefined ? c.is_active : 1
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let dVal = parseFloat(formData.discount_value) || 0;
      let minD = formData.min_discount_amount ? parseFloat(formData.min_discount_amount) : 0;
      let maxD = formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null;

      if (formData.discount_type === 'RANGE') {
        // For range coupons: ensure min and max discount bounds are logical
        if (minD <= 0 && dVal > 0) minD = dVal;
        if (!maxD && dVal > minD) maxD = dVal;
        if (maxD !== null && minD > maxD) {
          const temp = minD;
          minD = maxD;
          maxD = temp;
        }
        dVal = minD; // Fallback value
      } else if (formData.discount_type === 'FIXED') {
        minD = 0;
        maxD = null;
      }

      const payload = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description ? formData.description.trim() : null,
        discount_type: formData.discount_type,
        discount_value: dVal,
        min_order_amount: parseFloat(formData.min_order_amount) || 0,
        min_discount_amount: minD,
        max_discount_amount: maxD,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit, 10) : null,
        per_customer_limit: parseInt(formData.per_customer_limit, 10) || 1,
        is_active: formData.is_active ? 1 : 0
      };

      if (editingCoupon) {
        await adminApi.updateCoupon(editingCoupon.id, payload);
      } else {
        await adminApi.createCoupon(payload);
      }
      setModalOpen(false);
      loadCoupons();
    } catch (err) {
      alert(err.message || 'Failed to save coupon.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await adminApi.deleteCoupon(id);
        loadCoupons();
      } catch (err) {
        alert(err.message || 'Failed to delete coupon.');
      }
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--admin-text-main)' }}>
            Promotional Coupons & Discounts
          </h2>
          <span style={{ fontSize: '0.86rem', color: 'var(--admin-text-muted)' }}>
            Configure Flat (Fixed) Discounts, Range-based Lucky Discounts, or Percentage Discounts
          </span>
        </div>

        <button
          onClick={openCreateModal}
          className="btn-admin btn-admin-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Coupon Code</th>
              <th>Description</th>
              <th>Discount Type & Value</th>
              <th>Min Order</th>
              <th>Discount Range / Cap</th>
              <th>Redemptions</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--admin-text-muted)' }}>
                  Loading promotional coupons...
                </td>
              </tr>
            ) : coupons.length > 0 ? (
              coupons.map(c => {
                const isFixed = c.discount_type === 'FIXED';
                const isRange = c.discount_type === 'RANGE';
                const isPercentage = c.discount_type === 'PERCENTAGE';

                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Ticket size={15} color="var(--admin-accent)" />
                        <strong style={{ letterSpacing: '0.06em', color: 'var(--admin-accent)', fontSize: '0.92rem' }}>
                          {c.code}
                        </strong>
                      </div>
                    </td>
                    <td style={{ maxWidth: '220px', color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                      {c.description || '—'}
                    </td>
                    <td>
                      {isFixed && (
                        <span className="status-pill pill-warning" style={{ fontWeight: 800 }}>
                          FLAT ₹{c.discount_value} OFF
                        </span>
                      )}
                      {isRange && (
                        <span className="status-pill pill-info" style={{ fontWeight: 800 }}>
                          ₹{c.min_discount_amount || 0} - ₹{c.max_discount_amount || c.discount_value} RANGE
                        </span>
                      )}
                      {isPercentage && (
                        <span className="status-pill pill-success" style={{ fontWeight: 800 }}>
                          {c.discount_value}% OFF
                        </span>
                      )}
                    </td>
                    <td>
                      <strong>₹{Number(c.min_order_amount || 0).toFixed(0)}</strong>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {isFixed && (
                        <span style={{ color: 'var(--admin-text-muted)' }}>Flat ₹{c.discount_value}</span>
                      )}
                      {isRange && (
                        <strong style={{ color: 'var(--info)' }}>
                          ₹{c.min_discount_amount || 0} to ₹{c.max_discount_amount || c.discount_value}
                        </strong>
                      )}
                      {isPercentage && (
                        <span>
                          {c.max_discount_amount ? `Max Cap: ₹${c.max_discount_amount}` : 'Unlimited Cap'}
                          {c.min_discount_amount > 0 ? ` (Min ₹${c.min_discount_amount})` : ''}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="status-pill pill-neutral" style={{ fontSize: '0.74rem' }}>
                        {c.usage_count || 0} used
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${c.is_active === 1 ? 'pill-success' : 'pill-neutral'}`}>
                        {c.is_active === 1 ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => openEditModal(c)}
                          className="btn-admin btn-admin-outline btn-admin-sm"
                          title="Edit Coupon"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="btn-admin btn-admin-danger btn-admin-sm"
                          title="Delete Coupon"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--admin-text-muted)' }}>
                  No coupons found. Click "Create Coupon" to add your first promotion.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '620px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-accent)' }}>
                  <Ticket size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                    {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Promotional Coupon'}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                    Set up flat discount, min-max range, or percentage off
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              {/* Row 1: Code and Discount Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label className="admin-label">Coupon Code (Uppercase) *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                    placeholder="e.g. SREEKAR"
                    className="admin-input"
                    style={{ textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}
                  />
                </div>

                <div>
                  <label className="admin-label">Discount Type *</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="admin-select"
                    style={{ fontWeight: '600' }}
                  >
                    <option value="FIXED">🏷️ Fixed / Flat Amount (₹ Flat Off)</option>
                    <option value="RANGE">🎲 Range Discount (Min ₹ to Max ₹)</option>
                    <option value="PERCENTAGE">% Percentage Discount</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Discount Configuration Inputs */}
              {formData.discount_type === 'FIXED' && (
                <div style={{ padding: '16px', backgroundColor: '#FFFBEB', borderRadius: 'var(--radius-md)', border: '1px solid #FDE68A', marginBottom: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '10px' }}>
                    <div>
                      <label className="admin-label" style={{ color: '#92400E' }}>Flat Discount Amount (₹) *</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        required
                        value={formData.discount_value}
                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                        placeholder="e.g. 180"
                        className="admin-input"
                        style={{ fontWeight: '700', fontSize: '1rem' }}
                      />
                    </div>
                    <div>
                      <label className="admin-label" style={{ color: '#92400E' }}>Min Order Subtotal (₹)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={formData.min_order_amount}
                        onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                        placeholder="e.g. 190"
                        className="admin-input"
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#B45309' }}>
                    💡 <strong>Flat Discount:</strong> The buyer gets exactly <strong>₹{formData.discount_value || '0'} OFF</strong> their order when their cart subtotal is at least ₹{formData.min_order_amount || '0'}.
                  </div>
                </div>
              )}

              {formData.discount_type === 'RANGE' && (
                <div style={{ padding: '16px', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-md)', border: '1px solid #BFDBFE', marginBottom: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                    <div>
                      <label className="admin-label" style={{ color: '#1E40AF' }}>Min Discount (₹) *</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        required
                        value={formData.min_discount_amount}
                        onChange={(e) => setFormData({ ...formData, min_discount_amount: e.target.value })}
                        placeholder="e.g. 95"
                        className="admin-input"
                        style={{ fontWeight: '700', fontSize: '1rem' }}
                      />
                    </div>
                    <div>
                      <label className="admin-label" style={{ color: '#1E40AF' }}>Max Discount (₹) *</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        required
                        value={formData.max_discount_amount}
                        onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                        placeholder="e.g. 180"
                        className="admin-input"
                        style={{ fontWeight: '700', fontSize: '1rem' }}
                      />
                    </div>
                    <div>
                      <label className="admin-label" style={{ color: '#1E40AF' }}>Min Order Subtotal (₹)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={formData.min_order_amount}
                        onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                        placeholder="e.g. 190"
                        className="admin-input"
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#1D4ED8' }}>
                    🎲 <strong>Range Discount:</strong> The buyer will receive a discount anywhere from <strong>₹{formData.min_discount_amount || '0'}</strong> up to <strong>₹{formData.max_discount_amount || '0'}</strong>.
                  </div>
                </div>
              )}

              {formData.discount_type === 'PERCENTAGE' && (
                <div style={{ padding: '16px', backgroundColor: '#ECFDF5', borderRadius: 'var(--radius-md)', border: '1px solid #A7F3D0', marginBottom: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label className="admin-label" style={{ color: '#065F46' }}>Discount % *</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="100"
                        required
                        value={formData.discount_value}
                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                        placeholder="50"
                        className="admin-input"
                        style={{ fontWeight: '700' }}
                      />
                    </div>
                    <div>
                      <label className="admin-label" style={{ color: '#065F46' }}>Min Guaranteed (₹)</label>
                      <input
                        type="number"
                        step="1"
                        value={formData.min_discount_amount}
                        onChange={(e) => setFormData({ ...formData, min_discount_amount: e.target.value })}
                        placeholder="Optional"
                        className="admin-input"
                      />
                    </div>
                    <div>
                      <label className="admin-label" style={{ color: '#065F46' }}>Max Cap (₹)</label>
                      <input
                        type="number"
                        step="1"
                        value={formData.max_discount_amount}
                        onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                        placeholder="Optional"
                        className="admin-input"
                      />
                    </div>
                    <div>
                      <label className="admin-label" style={{ color: '#065F46' }}>Min Order (₹)</label>
                      <input
                        type="number"
                        step="1"
                        value={formData.min_order_amount}
                        onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                        placeholder="0"
                        className="admin-input"
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#047857' }}>
                    % <strong>Percentage Discount:</strong> Gives {formData.discount_value || '0'}% off subtotal.
                    {formData.max_discount_amount ? ` Maximum discount is capped at ₹${formData.max_discount_amount}.` : ' No upper limit.'}
                    {formData.min_discount_amount ? ` Minimum discount floor is ₹${formData.min_discount_amount}.` : ''}
                  </div>
                </div>
              )}

              {/* Offer Description */}
              <div style={{ marginBottom: '14px' }}>
                <label className="admin-label">Description / Offer Note (Visible to Customers)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Special Flat ₹180 off on orders above ₹190"
                  className="admin-input"
                />
              </div>

              {/* Limits and Restrictions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label className="admin-label">Total Redemptions Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="Unlimited"
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="admin-label">Per Customer Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.per_customer_limit}
                    onChange={(e) => setFormData({ ...formData, per_customer_limit: e.target.value })}
                    placeholder="1"
                    className="admin-input"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div style={{ display: 'flex', gap: '14px', marginBottom: '22px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active === 1}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <strong>Enable & Activate this Coupon immediately</strong>
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-admin btn-admin-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-admin btn-admin-primary"
                >
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
