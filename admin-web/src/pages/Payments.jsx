import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [refundModal, setRefundModal] = useState(null);
  const [refundForm, setRefundForm] = useState({ amount: '', reason: '' });
  const [processingRefund, setProcessingRefund] = useState(false);
  const [refundSuccess, setRefundSuccess] = useState('');

  const loadPayments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.method = methodFilter;
      if (search) params.q = search;

      const res = await adminApi.getPayments(params);
      if (res.success) {
        setPayments(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [statusFilter, methodFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadPayments();
  };

  const openRefundModal = (p) => {
    setRefundModal(p);
    setRefundForm({
      amount: p.amount,
      reason: 'Customer requested return / damaged during transit'
    });
    setError('');
    setRefundSuccess('');
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    setProcessingRefund(true);
    setError('');
    try {
      const res = await adminApi.refundOrder(
        refundModal.id,
        parseFloat(refundForm.amount),
        refundForm.reason
      );
      if (res.success) {
        setRefundSuccess('Refund processed successfully.');
        setRefundModal(null);
        loadPayments();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingRefund(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>
            Payment & Gateway Transactions
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Audit UPI, dynamic QR, COD reconciliations, and execute gateway refunds
          </p>
        </div>
      </div>

      {error && <div className="admin-alert admin-alert-danger">{error}</div>}
      {refundSuccess && <div className="admin-alert admin-alert-success">{refundSuccess}</div>}

      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <input
            type="text"
            className="admin-input"
            placeholder="Search Order Number or Payment ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Payment Statuses</option>
            <option value="SUCCESS">Successful (SUCCESS)</option>
            <option value="PENDING">Pending (PENDING)</option>
            <option value="FAILED">Failed (FAILED)</option>
            <option value="REFUNDED">Refunded (REFUNDED)</option>
          </select>

          <select
            className="admin-select"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="">All Payment Methods</option>
            <option value="UPI_QR">Dynamic UPI QR</option>
            <option value="UPI">UPI App / Intent</option>
            <option value="COD">Cash on Delivery (COD)</option>
            <option value="CARD">Credit / Debit Card</option>
            <option value="NETBANKING">Net Banking</option>
          </select>

          <button type="submit" className="admin-btn admin-btn-primary">
            Apply Filter
          </button>
        </form>
      </div>

      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading payment records...</div>
        ) : payments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            No payment records found matching the filter criteria.
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Order Details</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Gateway Ref</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <code style={{ fontSize: '12px', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px' }}>
                        {p.id}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{p.order_number}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{p.customer_name} ({p.customer_phone})</div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                        ₹{parseFloat(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-info">
                        {p.payment_method}
                      </span>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        via {p.gateway || 'UPI Gateway'}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${
                          p.status === 'SUCCESS'
                            ? 'admin-badge-success'
                            : p.status === 'PENDING'
                            ? 'admin-badge-warning'
                            : p.status === 'REFUNDED'
                            ? 'admin-badge-neutral'
                            : 'admin-badge-danger'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: '11px', color: '#475569' }}>
                        {p.gateway_transaction_id || p.gateway_order_id || 'N/A'}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(p.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {p.status === 'SUCCESS' && (
                        <button
                          onClick={() => openRefundModal(p)}
                          className="admin-btn admin-btn-danger"
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                        >
                          Refund
                        </button>
                      )}
                      {p.status === 'REFUNDED' && (
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Refunded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {refundModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Initiate Server Gateway Refund</h2>
              <button
                onClick={() => setRefundModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleProcessRefund}>
              <div className="admin-modal-body">
                <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '6px', color: '#991b1b', fontSize: '13px', marginBottom: '16px' }}>
                  ⚠️ This will process an official refund via the payment gateway abstraction to the customer's source account and record audit logs.
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Payment ID</label>
                  <input
                    type="text"
                    readOnly
                    value={refundModal.id}
                    className="admin-input"
                    style={{ background: '#f8fafc' }}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Refund Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    max={refundModal.amount}
                    value={refundForm.amount}
                    onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                    className="admin-input"
                  />
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Max refundable amount: ₹{refundModal.amount}
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Reason for Refund *</label>
                  <textarea
                    rows={3}
                    required
                    value={refundForm.reason}
                    onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                    className="admin-input"
                    placeholder="Provide detailed justification for internal audit"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setRefundModal(null)}
                  className="admin-btn admin-btn-secondary"
                  disabled={processingRefund}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-danger"
                  disabled={processingRefund}
                >
                  {processingRefund ? 'Processing...' : 'Execute Gateway Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
