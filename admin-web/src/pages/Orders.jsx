import React, { useState, useEffect } from 'react';
import { Search, Eye, Filter, CheckCircle, RefreshCcw, DollarSign, X, AlertTriangle, Truck, ExternalLink } from 'lucide-react';
import { adminApi } from '../services/adminApi.js';
import DispatchModal from '../components/DispatchModal.jsx';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  // Selected Order for Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Status Update / Action State
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundModal, setRefundModal] = useState(false);
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null);

  const handleQuickMarkPaid = async (order) => {
    const utr = window.prompt(`Confirm online payment for ${order.order_number} (Amount: ₹${order.total_amount}).\nEnter UPI Ref / UTR number (optional):`, '');
    if (utr === null) return;

    try {
      const res = await adminApi.markOrderPaid(order.id, utr);
      if (res.success) {
        alert(`Order ${order.order_number} marked as PAID online!`);
        if (selectedOrder && selectedOrder.id === order.id) {
          setSelectedOrder(prev => ({ ...prev, payment_status: 'PAID', order_status: 'PAYMENT_CONFIRMED' }));
        }
        loadOrders();
      }
    } catch (err) {
      alert(err.message || 'Payment update failed.');
    }
  };

  const loadOrders = (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    adminApi.getOrders({
      q: search,
      status: statusFilter,
      payment_status: paymentFilter
    }).then(res => {
      if (res.success) setOrders(res.data);
    }).finally(() => {
      if (showSpinner) setLoading(false);
    });
  };

  useEffect(() => {
    loadOrders(true);
    // Background auto-refresh every 12 seconds so new orders appear live
    const interval = setInterval(() => {
      loadOrders(false);
    }, 12000);
    return () => clearInterval(interval);
  }, [search, statusFilter, paymentFilter]);

  const handleInspectOrder = async (order) => {
    setSelectedOrder(order);
    setModalLoading(true);
    try {
      // Fetch fresh order details with items using adminApi
      const data = await adminApi.getOrderDetails(order.id);
      if (data.success) {
        setOrderDetails(data.data);
      }
    } catch (e) {
      console.error('Failed to load order details:', e);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDirectStatusChange = async (orderId, newStatus) => {
    try {
      const res = await adminApi.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        setOrders(prev => prev.map(o => (o.id === orderId || o.order_number === orderId) ? { ...o, order_status: newStatus } : o));
        if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.order_number === orderId)) {
          setSelectedOrder(prev => ({ ...prev, order_status: newStatus }));
        }
      }
    } catch (err) {
      alert(err.message || 'Status update failed.');
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    try {
      const res = await adminApi.updateOrderStatus(selectedOrder.id, newStatus);
      if (res.success) {
        setSelectedOrder(prev => ({ ...prev, order_status: newStatus }));
        loadOrders(false);
      }
    } catch (err) {
      alert(err.message || 'Status update failed.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMarkCodCollected = async () => {
    if (!selectedOrder) return;
    if (window.confirm(`Confirm collection of ₹${selectedOrder.total_amount} in cash for ${selectedOrder.order_number}?`)) {
      try {
        const res = await adminApi.markCodCollected(selectedOrder.id);
        if (res.success) {
          alert('COD collected and order completed.');
          setSelectedOrder(prev => ({ ...prev, cod_collected: 1, payment_status: 'PAID', order_status: 'DELIVERED' }));
          loadOrders();
        }
      } catch (err) {
        alert(err.message || 'Action failed.');
      }
    }
  };

  const handleInitiateRefund = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      // Find successful payment id
      const payment = orderDetails?.payments?.find(p => p.status === 'SUCCESS');
      if (!payment) {
        alert('No successful gateway payment found on this order to refund.');
        return;
      }

      const res = await adminApi.refundOrder(payment.id, selectedOrder.total_amount, refundReason);
      if (res.success) {
        alert('Gateway refund processed successfully.');
        setRefundModal(false);
        setSelectedOrder(prev => ({ ...prev, payment_status: 'REFUNDED', order_status: 'REFUNDED' }));
        loadOrders();
      }
    } catch (err) {
      alert(err.message || 'Refund processing failed.');
    }
  };

  const statusOptions = [
    'ORDER_PLACED',
    'PAYMENT_CONFIRMED',
    'PROCESSING',
    'PACKED',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED'
  ];

  return (
    <div>
      {/* Search and Filters Toolbar */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
          <input
            type="text"
            placeholder="Search by order ID, customer, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-select"
          style={{ width: '180px' }}
        >
          <option value="">All Order Statuses</option>
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="admin-select"
          style={{ width: '180px' }}
        >
          <option value="">All Payment Statuses</option>
          <option value="PAID">PAID</option>
          <option value="PENDING">PENDING</option>
          <option value="REFUNDED">REFUNDED</option>
          <option value="FAILED">FAILED</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Buyer Delivery Address</th>
              <th>Total Amount</th>
              <th>Payment</th>
              <th>Fulfillment Status</th>
              <th>Courier / Tracking</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>Loading orders...</td></tr>
            ) : orders.length > 0 ? (
              orders.map(o => (
                <tr key={o.id}>
                  <td><strong>{o.order_number}</strong></td>
                  <td>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.88rem' }}>{o.customer_name}</strong>
                      <a href={`tel:${o.customer_phone}`} style={{ color: 'var(--admin-accent)', textDecoration: 'none', fontSize: '0.8rem', display: 'block' }}>
                        📞 {o.customer_phone}
                      </a>
                      {o.customer_email && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>{o.customer_email}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: '250px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-main)', lineHeight: '1.4', marginBottom: '4px' }}>
                        📍 {o.delivery_address || `Pincode: ${o.pincode}`}
                      </div>
                      {o.delivery_address && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(o.delivery_address);
                            alert(`Copied address for ${o.order_number}:\n${o.delivery_address}`);
                          }}
                          className="btn-admin btn-admin-outline"
                          style={{ fontSize: '0.68rem', padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          title="Copy delivery address to clipboard"
                        >
                          📋 Copy Address
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    {o.payment_status === 'PAID' ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: '#059669', fontSize: '0.98rem' }}>₹{o.total_amount}</strong>
                        <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: '600' }}>✓ In Revenue</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: '#D97706', fontSize: '0.92rem' }}>₹{o.total_amount}</strong>
                        <span style={{ fontSize: '0.68rem', color: 'var(--admin-text-muted)' }}>Payment Pending</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span className={`status-pill ${o.payment_status === 'PAID' ? 'pill-success' : o.payment_status === 'FAILED' ? 'pill-danger' : 'pill-warning'}`} style={{ fontSize: '0.72rem', width: 'fit-content' }}>
                        {o.payment_status} ({o.payment_method})
                      </span>
                      {o.payment_reference && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--admin-text-muted)' }}>
                          Ref: {o.payment_reference}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <select
                      value={o.order_status}
                      onChange={(e) => handleDirectStatusChange(o.id, e.target.value)}
                      className="admin-select"
                      style={{
                        fontSize: '0.74rem',
                        padding: '4px 6px',
                        fontWeight: '700',
                        width: '155px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        borderColor: o.order_status === 'DELIVERED' ? '#059669' : o.order_status === 'CANCELLED' ? '#DC2626' : ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.order_status) ? '#2563EB' : '#D97706',
                        backgroundColor: o.order_status === 'DELIVERED' ? '#ECFDF5' : o.order_status === 'CANCELLED' ? '#FEF2F2' : ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.order_status) ? '#EFF6FF' : '#FFFBEB'
                      }}
                      title="Click to change order lifecycle status"
                    >
                      {statusOptions.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {o.courier_name || o.tracking_number ? (
                      <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: '700', color: 'var(--admin-text-main)' }}>
                          🚚 {o.courier_name || 'Courier'}
                        </span>
                        {o.tracking_number && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: 'var(--admin-text-secondary)', fontSize: '0.72rem' }}>
                              #{o.tracking_number}
                            </span>
                            {o.tracking_url && (
                              <a
                                href={o.tracking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--admin-accent)', display: 'inline-flex', alignItems: 'center' }}
                                title="Open tracking"
                              >
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        onClick={() => setDispatchModalOrder(o)}
                        className="btn-admin btn-admin-primary btn-admin-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', padding: '4px 8px' }}
                        title="Edit dispatch, courier and tracking"
                      >
                        <Truck size={12} />
                        <span>Dispatch</span>
                      </button>

                      {o.payment_status !== 'PAID' && (
                        <button
                          onClick={() => handleQuickMarkPaid(o)}
                          className="btn-admin btn-admin-outline btn-admin-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', padding: '4px 7px', color: '#059669', borderColor: '#A7F3D0' }}
                          title="Mark online payment completed"
                        >
                          <CheckCircle size={11} />
                          <span>Paid</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleInspectOrder(o)}
                        className="btn-admin btn-admin-outline btn-admin-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.74rem', padding: '4px 8px' }}
                      >
                        <Eye size={12} />
                        <span>Inspect</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail & Actions Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '780px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>Order Inspection</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>{selectedOrder.order_number}</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                  Placed on {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ color: 'var(--admin-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Lifecycle Status Controller */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <label className="admin-label" style={{ marginBottom: '2px' }}>Current Lifecycle Status:</label>
                  <span className="status-pill pill-info" style={{ fontSize: '0.82rem' }}>{selectedOrder.order_status}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    disabled={updatingStatus}
                    value={selectedOrder.order_status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="admin-select"
                    style={{ width: '200px' }}
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Specialized Actions: Dispatch, COD Collection & Refunds */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setDispatchModalOrder(selectedOrder)}
                className="btn-admin btn-admin-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Truck size={16} />
                <span>Edit Dispatch & Shipping Logistics</span>
              </button>

              {selectedOrder.payment_status !== 'PAID' && (
                <button
                  onClick={() => handleQuickMarkPaid(selectedOrder)}
                  className="btn-admin btn-admin-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', borderColor: '#A7F3D0' }}
                >
                  <CheckCircle size={16} />
                  <span>Mark as Paid Online (Verified)</span>
                </button>
              )}

              {selectedOrder.payment_method === 'COD' && selectedOrder.cod_collected === 0 && (
                <button
                  onClick={handleMarkCodCollected}
                  className="btn-admin btn-admin-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <DollarSign size={16} />
                  <span>Mark COD Collected (₹{selectedOrder.total_amount})</span>
                </button>
              )}

              {selectedOrder.payment_status === 'PAID' && (
                <button
                  onClick={() => setRefundModal(true)}
                  className="btn-admin btn-admin-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                  <RefreshCcw size={16} />
                  <span>Initiate Gateway Refund</span>
                </button>
              )}
            </div>

            {/* Dispatch & Courier Logistics Snapshot */}
            <div style={{ padding: '16px', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-sm)', border: '1px solid #BFDBFE', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={18} style={{ color: '#2563EB' }} />
                  <strong style={{ fontSize: '0.92rem', color: '#1E3A8A' }}>Logistics & Shipping Dispatch Details</strong>
                </div>
                <button
                  onClick={() => setDispatchModalOrder(selectedOrder)}
                  className="btn-admin btn-admin-outline btn-admin-sm"
                  style={{ fontSize: '0.74rem', padding: '3px 8px' }}
                >
                  Update Logistics
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.84rem' }}>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>COURIER PARTNER</span>
                  <strong>{selectedOrder.courier_name || 'Not assigned yet'}</strong>
                </div>

                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>TRACKING / AWB #</span>
                  {selectedOrder.tracking_number ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong>#{selectedOrder.tracking_number}</strong>
                      {selectedOrder.tracking_url && (
                        <a
                          href={selectedOrder.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#2563EB', display: 'inline-flex', alignItems: 'center' }}
                          title="Open tracking"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: '#94A3B8' }}>None provided</span>
                  )}
                </div>

                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>DISPATCH DATE</span>
                  <span>{selectedOrder.dispatch_date ? new Date(selectedOrder.dispatch_date).toLocaleString('en-IN') : 'Pending'}</span>
                </div>
              </div>

              {selectedOrder.dispatch_notes && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #DBEAFE', fontSize: '0.8rem', color: '#1E3A8A' }}>
                  <strong>Notes: </strong>{selectedOrder.dispatch_notes}
                </div>
              )}
            </div>

            {/* Customer & Address Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ fontSize: '0.88rem', display: 'block', marginBottom: '6px' }}>Customer Contact</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-main)' }}>
                  <div>Name: {selectedOrder.customer_name}</div>
                  <div>Phone: {selectedOrder.customer_phone}</div>
                  <div>Email: {selectedOrder.customer_email}</div>
                </div>
              </div>

              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ fontSize: '0.88rem', display: 'block', marginBottom: '6px' }}>Delivery Address Snapshot</strong>
                <div style={{ fontSize: '0.84rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
                  {selectedOrder.delivery_address}
                </div>
              </div>
            </div>

            {/* Purchased Items Snapshot Table */}
            <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '10px' }}>Purchased Items (Price Snapshot)</h4>
            <div className="admin-table-container" style={{ marginBottom: '20px' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item Snapshot</th>
                    <th>Weight</th>
                    <th>Pieces</th>
                    <th>Price at Purchase</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetails?.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td><strong>{item.product_name_snapshot}</strong></td>
                      <td>{item.weight_snapshot}</td>
                      <td>{item.pieces_per_pack_snapshot} pcs</td>
                      <td>₹{item.price_snapshot}</td>
                      <td><strong>× {item.quantity}</strong></td>
                      <td><strong>₹{item.total_item_price}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Order Totals Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span>₹{selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                    <span>Coupon ({selectedOrder.coupon_code}):</span>
                    <span>-₹{selectedOrder.discount_amount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Delivery:</span>
                  <span>{selectedOrder.is_free_delivery ? 'FREE' : `₹${selectedOrder.delivery_charge}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.15rem', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                  <span>{selectedOrder.payment_status === 'PAID' ? 'Total Paid Amount:' : 'Order Total (Payment Pending):'}</span>
                  <span style={{ color: selectedOrder.payment_status === 'PAID' ? '#059669' : '#D97706' }}>
                    {selectedOrder.payment_status === 'PAID' ? `₹${selectedOrder.total_amount}` : `Pending (₹${selectedOrder.total_amount})`}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedOrder(null)} className="btn-admin btn-admin-outline">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gateway Refund Modal */}
      {refundModal && selectedOrder && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--danger)', marginBottom: '8px' }}>
              Initiate Gateway Refund
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--admin-text-muted)', marginBottom: '20px' }}>
              This will submit an API refund request to the payment gateway for <strong>₹{selectedOrder.total_amount}</strong>.
            </p>

            <form onSubmit={handleInitiateRefund}>
              <div style={{ marginBottom: '16px' }}>
                <label className="admin-label">Refund Reason *</label>
                <textarea
                  required
                  rows="3"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Customer cancelled before dispatch / batch replacement requested"
                  className="admin-textarea"
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setRefundModal(false)} className="btn-admin btn-admin-outline">
                  Cancel
                </button>
                <button type="submit" className="btn-admin btn-admin-danger">
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Logistics Modal */}
      {dispatchModalOrder && (
        <DispatchModal
          order={dispatchModalOrder}
          onClose={() => setDispatchModalOrder(null)}
          onUpdated={(updated) => {
            loadOrders();
            if (selectedOrder && selectedOrder.id === updated.id) {
              setSelectedOrder(updated);
            }
          }}
        />
      )}
    </div>
  );
}
