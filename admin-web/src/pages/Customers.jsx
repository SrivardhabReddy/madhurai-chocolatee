import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [error, setError] = useState('');

  const loadCustomers = async (searchTerm = '') => {
    try {
      setLoading(true);
      const res = await adminApi.getCustomers(searchTerm);
      if (res.success) {
        setCustomers(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadCustomers(search);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>
            Customer Directory
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            View registered shoppers, total lifetime value, and order engagement
          </p>
        </div>
      </div>

      {error && <div className="admin-alert admin-alert-danger">{error}</div>}

      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            className="admin-input"
            placeholder="Search by customer name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="admin-btn admin-btn-primary">
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                loadCustomers('');
              }}
              className="admin-btn admin-btn-secondary"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading customer records...</div>
        ) : customers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            No customer accounts found matching your query.
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact Details</th>
                  <th>Orders Placed</th>
                  <th>Total Spent (LTV)</th>
                  <th>Member Since</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: '#e0e7ff',
                            color: '#4338ca',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '14px'
                          }}
                        >
                          {(c.full_name || 'C')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#0f172a' }}>{c.full_name || 'Customer'}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: '#334155' }}>📧 {c.email}</div>
                      {c.phone && <div style={{ fontSize: '12px', color: '#64748b' }}>📱 {c.phone}</div>}
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-info">
                        {c.total_orders || 0} orders
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '700', color: '#0f172a' }}>
                        ₹{parseFloat(c.total_spent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        {new Date(c.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        View Summary
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Quick Summary Modal */}
      {selectedCustomer && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Customer Profile: {selectedCustomer.full_name}</h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Lifetime Revenue
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669' }}>
                    ₹{parseFloat(selectedCustomer.total_spent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Total Purchases
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#3b82f6' }}>
                    {selectedCustomer.total_orders || 0} Orders
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#64748b', width: '120px', display: 'inline-block' }}>Customer ID:</span>
                  <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{selectedCustomer.id}</code>
                </div>
                <div>
                  <span style={{ color: '#64748b', width: '120px', display: 'inline-block' }}>Email Address:</span>
                  <strong>{selectedCustomer.email}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', width: '120px', display: 'inline-block' }}>Contact Phone:</span>
                  <strong>{selectedCustomer.phone || 'Not provided'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', width: '120px', display: 'inline-block' }}>Joined Date:</span>
                  <span>{new Date(selectedCustomer.created_at).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', width: '120px', display: 'inline-block' }}>Account Type:</span>
                  <span className="admin-badge admin-badge-info">Verified Retail Shopper</span>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="admin-btn admin-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
