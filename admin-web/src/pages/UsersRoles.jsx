import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

export default function UsersRoles() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'ORDER_MANAGER'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getStaffUsers();
      if (res.success) {
        setUsers(res.data.users);
        setRoles(res.data.roles);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await adminApi.createStaffUser(form);
      if (res.success) {
        setSuccess('Staff user created successfully.');
        setModalOpen(false);
        setForm({
          full_name: '',
          email: '',
          phone: '',
          password: '',
          role: 'ORDER_MANAGER'
        });
        loadData();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="admin-badge admin-badge-danger">SUPER ADMIN</span>;
      case 'ADMIN':
        return <span className="admin-badge admin-badge-primary">BUSINESS ADMIN</span>;
      case 'ORDER_MANAGER':
        return <span className="admin-badge admin-badge-info">ORDER MANAGER</span>;
      case 'INVENTORY_MANAGER':
        return <span className="admin-badge admin-badge-warning">INVENTORY MANAGER</span>;
      default:
        return <span className="admin-badge admin-badge-neutral">{role}</span>;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>
            Staff & Role-Based Access Control (RBAC)
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Enforce granular access limits across super admins, order dispatchers, and warehouse inventory managers
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="admin-btn admin-btn-primary">
          + Add Staff Member
        </button>
      </div>

      {error && <div className="admin-alert admin-alert-danger">{error}</div>}
      {success && <div className="admin-alert admin-alert-success">{success}</div>}

      {/* Staff User Accounts Table */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
          Authorized Staff Directory
        </h2>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading team profiles...</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email & Phone</th>
                  <th>Assigned Role</th>
                  <th>Account Status</th>
                  <th>Date Added</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{u.full_name}</div>
                      <code style={{ fontSize: '11px', color: '#94a3b8' }}>{u.id}</code>
                    </td>
                    <td>
                      <div style={{ color: '#334155', fontSize: '13px' }}>{u.email}</div>
                      {u.phone && <div style={{ color: '#64748b', fontSize: '12px' }}>{u.phone}</div>}
                    </td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td>
                      <span className={`admin-badge ${u.is_active ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(u.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RBAC Privileges Matrix */}
      <div className="admin-card">
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
          🛡️ Role Privilege Matrix
        </h2>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Capability / Module</th>
                <th style={{ textAlign: 'center' }}>SUPER_ADMIN</th>
                <th style={{ textAlign: 'center' }}>ADMIN</th>
                <th style={{ textAlign: 'center' }}>ORDER_MANAGER</th>
                <th style={{ textAlign: 'center' }}>INVENTORY_MANAGER</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>View Store Dashboard & Metrics</strong></td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
              </tr>
              <tr>
                <td><strong>Product & Category Catalog Management</strong></td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>Read Only</td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
              </tr>
              <tr>
                <td><strong>Stock Adjustments, Restocking & Warehousing</strong></td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>✗ Restricted</td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
              </tr>
              <tr>
                <td><strong>Order Lifecycle & Dispatch Tracking</strong></td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>Read Only</td>
              </tr>
              <tr>
                <td><strong>Mark COD Cash Collected</strong></td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>✗ Restricted</td>
              </tr>
              <tr>
                <td><strong>Payment Gateway Refunds</strong></td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>✗ Restricted</td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>✗ Restricted</td>
              </tr>
              <tr>
                <td><strong>Delivery Rules, Pincodes & Rates</strong></td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>Read Only</td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>✗ Restricted</td>
              </tr>
              <tr>
                <td><strong>Coupons & Discounts</strong></td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>✗ Restricted</td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>✗ Restricted</td>
              </tr>
              <tr>
                <td><strong>Staff Accounts & RBAC Setup</strong></td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>✗ Restricted</td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>✗ Restricted</td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>✗ Restricted</td>
              </tr>
              <tr>
                <td><strong>Audit Logs & Security Revisions</strong></td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>✓ Full</td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>✗ Restricted</td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>✗ Restricted</td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>✗ Restricted</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Create Authorized Staff Account</h2>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="admin-input"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Staff Member Full Name"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Work Email *</label>
                  <input
                    type="email"
                    required
                    className="admin-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="staff@madhuraichocolate.com"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Phone Number</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Initial Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="admin-input"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Assigned Role *</label>
                  <select
                    className="admin-select"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="ORDER_MANAGER">ORDER_MANAGER (Orders, Fulfillment, Dispatch)</option>
                    <option value="INVENTORY_MANAGER">INVENTORY_MANAGER (Stock, Products, Catalog)</option>
                    <option value="ADMIN">ADMIN (All business modules except system staff)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Unrestricted system privilege)</option>
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
                  {saving ? 'Creating User...' : 'Provision Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
