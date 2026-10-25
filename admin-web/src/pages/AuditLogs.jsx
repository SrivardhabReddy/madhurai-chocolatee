import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [error, setError] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity = entityFilter;
      params.limit = 100;

      const res = await adminApi.getAuditLogs(params);
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter, entityFilter]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>
            System Audit Trail & Security Logs
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Immutable administrative action logs recording catalog adjustments, status overrides, refunds, and policy changes
          </p>
        </div>
      </div>

      {error && <div className="admin-alert admin-alert-danger">{error}</div>}

      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <div>
            <label className="admin-label">Filter by Action</label>
            <select
              className="admin-select"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="">All Administrative Actions</option>
              <option value="ADMIN_LOGIN">ADMIN_LOGIN</option>
              <option value="ORDER_STATUS_UPDATE">ORDER_STATUS_UPDATE</option>
              <option value="COD_COLLECTED">COD_COLLECTED</option>
              <option value="PAYMENT_REFUND">PAYMENT_REFUND</option>
              <option value="INVENTORY_RESTOCK">INVENTORY_RESTOCK</option>
              <option value="INVENTORY_ADJUST">INVENTORY_ADJUST</option>
              <option value="PRODUCT_CREATE">PRODUCT_CREATE</option>
              <option value="PRODUCT_UPDATE">PRODUCT_UPDATE</option>
              <option value="CATEGORY_CREATE">CATEGORY_CREATE</option>
              <option value="DELIVERY_RULE_CREATE">DELIVERY_RULE_CREATE</option>
              <option value="COUPON_CREATE">COUPON_CREATE</option>
              <option value="BUSINESS_SETTINGS_UPDATE">BUSINESS_SETTINGS_UPDATE</option>
            </select>
          </div>

          <div>
            <label className="admin-label">Filter by Entity Type</label>
            <select
              className="admin-select"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
            >
              <option value="">All Entities</option>
              <option value="AUTH">AUTH</option>
              <option value="ORDER">ORDER</option>
              <option value="PAYMENT">PAYMENT</option>
              <option value="PRODUCT">PRODUCT</option>
              <option value="CATEGORY">CATEGORY</option>
              <option value="INVENTORY">INVENTORY</option>
              <option value="DELIVERY_RULE">DELIVERY_RULE</option>
              <option value="COUPON">COUPON</option>
              <option value="SETTINGS">SETTINGS</option>
            </select>
          </div>
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading security event audit trail...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            No audit logs match your filter criteria.
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Admin Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>IP Address</th>
                  <th style={{ textAlign: 'right' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{log.admin_email || 'System'}</div>
                      <code style={{ fontSize: '11px', color: '#94a3b8' }}>{log.admin_id}</code>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-primary">
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-info">
                        {log.entity}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: '11px', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px' }}>
                        {log.entity_id || 'N/A'}
                      </code>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', color: '#64748b' }}>
                        {log.ip_address || '127.0.0.1'}
                      </code>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                      >
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Log Modal */}
      {selectedLog && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal" style={{ maxWidth: '640px' }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Audit Record: {selectedLog.action}</h2>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px', fontSize: '13px' }}>
                <div><strong>Admin:</strong> {selectedLog.admin_email}</div>
                <div><strong>Timestamp:</strong> {new Date(selectedLog.created_at).toLocaleString('en-IN')}</div>
                <div><strong>Entity:</strong> {selectedLog.entity}</div>
                <div><strong>Entity ID:</strong> {selectedLog.entity_id || 'N/A'}</div>
              </div>

              {selectedLog.old_value && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="admin-label">Previous Value Snapshot</label>
                  <pre style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '12px', overflowX: 'auto', border: '1px solid #e2e8f0' }}>
                    {typeof selectedLog.old_value === 'string'
                      ? selectedLog.old_value
                      : JSON.stringify(selectedLog.old_value, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_value && (
                <div>
                  <label className="admin-label">New Value Snapshot</label>
                  <pre style={{ background: '#f0fdf4', padding: '12px', borderRadius: '6px', fontSize: '12px', overflowX: 'auto', border: '1px solid #bbf7d0', color: '#166534' }}>
                    {typeof selectedLog.new_value === 'string'
                      ? selectedLog.new_value
                      : JSON.stringify(selectedLog.new_value, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
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
