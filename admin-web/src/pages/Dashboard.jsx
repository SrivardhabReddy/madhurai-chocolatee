import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Truck, 
  CreditCard,
  ArrowRight,
  TrendingUp,
  Package,
  Calendar,
  ExternalLink,
  Edit2,
  RefreshCw,
  Eye,
  MapPin,
  X
} from 'lucide-react';
import { adminApi } from '../services/adminApi.js';
import DispatchModal from '../components/DispatchModal.jsx';

export default function Dashboard({ onNavigate }) {
  const [metrics, setMetrics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  // Tabs for Orders table: 'TODAY' | 'RECENT' | 'PAYMENTS'
  const [activeTab, setActiveTab] = useState('TODAY');

  // Selected Order for Dispatch Modal
  const [dispatchOrder, setDispatchOrder] = useState(null);

  // Selected Order for Inspect Modal
  const [inspectOrder, setInspectOrder] = useState(null);
  const [inspectDetails, setInspectDetails] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Quick Mark Paid State
  const [markingPaidId, setMarkingPaidId] = useState(null);

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

  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [dashRes, anaRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getAnalytics('7d')
      ]);
      if (dashRes.success) {
        setMetrics(dashRes.data);
        setLastSyncTime(new Date());
      }
      if (anaRes.success) setAnalytics(anaRes.data);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 10 seconds so payments & new orders sync live without manual reload
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDirectStatusChange = async (orderId, newStatus) => {
    try {
      const res = await adminApi.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        fetchDashboardData(false);
      }
    } catch (err) {
      alert(err.message || 'Status update failed.');
    }
  };

  const handleInspect = async (order) => {
    setInspectOrder(order);
    setInspectLoading(true);
    try {
      const res = await adminApi.getOrderDetails(order.id);
      if (res.success) {
        setInspectDetails(res.data);
      }
    } catch (e) {
      console.error('Failed to inspect order:', e);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleQuickMarkPaid = async (order) => {
    const utr = window.prompt(`Confirm online payment for ${order.order_number} (Amount: ₹${order.total_amount}).\nEnter UPI Ref / UTR number (optional):`, '');
    if (utr === null) return; // user cancelled

    setMarkingPaidId(order.id);
    try {
      const res = await adminApi.markOrderPaid(order.id, utr);
      if (res.success) {
        alert(`Order ${order.order_number} marked as PAID online! Revenue has been updated.`);
        fetchDashboardData(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to update payment status.');
    } finally {
      setMarkingPaidId(null);
    }
  };

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading operations dashboard & live metrics...</div>;
  }

  const statCards = [
    { 
      label: "Orders Today", 
      val: metrics?.todayOrders || 0, 
      sub: `${metrics?.todayPaidOrders || 0} paid online • ${metrics?.todayPendingOrders || 0} pending`,
      icon: ShoppingBag, 
      color: '#D97706', 
      bg: '#FFFBEB' 
    },
    { 
      label: "Today's Online Revenue", 
      val: `₹${(metrics?.todayOnlineRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      sub: 'Verified online payments today',
      icon: DollarSign, 
      color: '#059669', 
      bg: '#ECFDF5' 
    },
    { 
      label: 'Total Online Revenue', 
      val: `₹${(metrics?.onlineRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      sub: 'All-time completed online sales',
      icon: TrendingUp, 
      color: '#2563EB', 
      bg: '#EFF6FF' 
    },
    { 
      label: 'Awaiting Dispatch', 
      val: metrics?.awaitingDispatch || 0, 
      sub: 'Orders ready to pack & ship',
      icon: Clock, 
      color: '#EA580C', 
      bg: '#FFF7ED' 
    },
    { 
      label: 'Dispatched / In Transit', 
      val: metrics?.inTransitOrders || 0, 
      sub: 'Currently with couriers',
      icon: Truck, 
      color: '#7C3AED', 
      bg: '#F5F3FF' 
    },
    { 
      label: 'Total Store Orders', 
      val: metrics?.totalOrders || 0, 
      sub: `${metrics?.deliveredOrders || 0} delivered successfully`,
      icon: Package, 
      color: '#0891B2', 
      bg: '#ECFEFF' 
    },
    { 
      label: 'Pending Payments', 
      val: metrics?.pendingOrders || 0, 
      sub: `₹${(metrics?.pendingRevenue || 0).toFixed(2)} awaiting verification`,
      icon: CreditCard, 
      color: '#CA8A04', 
      bg: '#FEFCE8' 
    },
    { 
      label: 'Failed Payments', 
      val: metrics?.failedPaymentsCount || metrics?.failedOrdersCount || 0, 
      sub: (metrics?.failedPaymentsCount || 0) > 0 ? `${metrics?.failedPaymentsCount} transactions failed` : 'No failed transactions recorded',
      icon: AlertTriangle, 
      color: (metrics?.failedPaymentsCount || 0) > 0 ? '#DC2626' : '#64748B', 
      bg: (metrics?.failedPaymentsCount || 0) > 0 ? '#FEF2F2' : '#F8FAFC' 
    },
    { 
      label: 'Low Stock Alerts', 
      val: metrics?.lowStock || 0, 
      sub: metrics?.lowStock > 0 ? 'Requires immediate restock' : 'All items well stocked',
      icon: AlertTriangle, 
      color: metrics?.lowStock > 0 ? '#DC2626' : '#64748B', 
      bg: '#FEF2F2' 
    }
  ];

  const displayedOrders = activeTab === 'TODAY' 
    ? (metrics?.todayOrdersList || []) 
    : (metrics?.recentOrders || []);

  return (
    <div>
      {/* Dashboard Header Bar with Live Sync & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--admin-text-main)', margin: '0 0 4px 0' }}>
            Store Operations & Dispatch Hub
          </h1>
          <p style={{ margin: 0, color: 'var(--admin-text-muted)', fontSize: '0.86rem' }}>
            Real-time orders, verified online revenue tracking, and order dispatch management
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#059669', backgroundColor: '#ECFDF5', padding: '5px 12px', borderRadius: '20px', border: '1px solid #A7F3D0', fontWeight: '600' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }}></span>
            <span>Live Auto-Syncing (10s)</span>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="btn-admin btn-admin-outline btn-admin-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Now'}</span>
          </button>
        </div>
      </div>

      {/* 1. Stat Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '18px',
        marginBottom: '32px'
      }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: card.bg,
                  color: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {card.label}
                  </span>
                  <div style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--admin-text-main)', marginTop: '2px' }}>
                    {card.val}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', borderTop: '1px solid #F1F5F9', paddingTop: '6px' }}>
                {card.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Middle Row: Sales Trend & Payment Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Daily Sales Bar Representation */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Sales & Completed Revenue (Last 7 Days)</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>Only completed customer payments</span>
            </div>
            <span className="status-pill pill-success" style={{ fontSize: '0.72rem' }}>Verified Online Sales</span>
          </div>

          {analytics?.salesTrends && analytics.salesTrends.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '180px', paddingTop: '20px' }}>
              {analytics.salesTrends.map((t, idx) => {
                const maxRev = Math.max(...analytics.salesTrends.map(x => x.revenue || 1), 100);
                const heightPct = Math.max(15, Math.min(100, ((t.revenue || 0) / maxRev) * 100));
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--admin-text-main)', marginBottom: '4px' }}>
                      ₹{t.revenue}
                    </span>
                    <div style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: `${heightPct}%`,
                      backgroundColor: 'var(--admin-accent)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }}></div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', marginTop: '6px' }}>
                      {t.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
              No orders recorded in this date range yet.
            </div>
          )}
        </div>

        {/* Payment Methods Breakdown */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Payment Method Split</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>Revenue strictly from completed transactions</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {analytics?.paymentMethods && analytics.paymentMethods.length > 0 ? (
              analytics.paymentMethods.map((pm, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CreditCard size={18} style={{ color: pm.payment_method === 'COD' ? '#0D9488' : '#2563EB' }} />
                    <div>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem', display: 'block' }}>{pm.payment_method}</span>
                      <span style={{ fontSize: '0.74rem', color: pm.payment_method === 'COD' ? '#0D9488' : '#059669', fontWeight: '600' }}>
                        {pm.payment_method === 'COD' ? 'Cash on Delivery' : 'Online Completed'}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '0.98rem', color: '#059669' }}>₹{pm.total}</strong>
                    <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>{pm.count} orders</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                Waiting for completed customer transactions...
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. DEDICATED ORDERS & PAYMENTS SECTION */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>
                {activeTab === 'TODAY' ? "Today's Orders" : activeTab === 'RECENT' ? "Recent Orders" : "Live Payment Ledger"}
              </h3>
              <span className="badge badge-gold" style={{ fontSize: '0.78rem', padding: '4px 8px', borderRadius: '6px' }}>
                {activeTab === 'TODAY' 
                  ? `${metrics?.todayOrders || 0} Today` 
                  : activeTab === 'RECENT' 
                    ? `${metrics?.recentOrders?.length || 0} Recent` 
                    : `${metrics?.recentPayments?.length || 0} Transactions`}
              </span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
              {activeTab === 'TODAY' 
                ? 'Orders placed today — manage dispatch, update status, and view customer address' 
                : activeTab === 'RECENT'
                  ? 'All recent customer orders — instant inline status updater and address copy'
                  : 'Live log of all customer payments (Successful, Failed, and Pending)'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Tab switchers */}
            <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
              <button
                onClick={() => setActiveTab('TODAY')}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'TODAY' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'TODAY' ? 'var(--admin-text-main)' : 'var(--admin-text-muted)',
                  boxShadow: activeTab === 'TODAY' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Orders Today ({metrics?.todayOrders || 0})
              </button>
              <button
                onClick={() => setActiveTab('RECENT')}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'RECENT' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'RECENT' ? 'var(--admin-text-main)' : 'var(--admin-text-muted)',
                  boxShadow: activeTab === 'RECENT' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Recent Orders ({metrics?.recentOrders?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('PAYMENTS')}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'PAYMENTS' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'PAYMENTS' ? 'var(--admin-text-main)' : 'var(--admin-text-muted)',
                  boxShadow: activeTab === 'PAYMENTS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Live Payments ({metrics?.recentPayments?.length || 0})
              </button>
            </div>

            <button onClick={() => onNavigate('orders')} className="btn-admin btn-admin-outline btn-admin-sm">
              <span>All Orders ({metrics?.totalOrders || 0})</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* 3A. Orders Table (for TODAY & RECENT tabs) */}
        {activeTab !== 'PAYMENTS' ? (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Buyer Delivery Address</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Fulfillment Status</th>
                  <th>Courier / Tracking</th>
                  <th>Date / Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders && displayedOrders.length > 0 ? (
                  displayedOrders.map(order => {
                    const isPaid = order.payment_status === 'PAID';
                    const isDelivered = order.order_status === 'DELIVERED';
                    const isCancelled = order.order_status === 'CANCELLED';
                    const isShipped = ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.order_status);

                    return (
                      <tr key={order.id}>
                        <td>
                          <strong style={{ fontSize: '0.92rem' }}>{order.order_number}</strong>
                        </td>
                        <td>
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.88rem' }}>{order.customer_name}</strong>
                            <a href={`tel:${order.customer_phone}`} style={{ color: 'var(--admin-accent)', textDecoration: 'none', fontSize: '0.8rem', display: 'block' }}>
                              📞 {order.customer_phone}
                            </a>
                            {order.customer_email && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>{order.customer_email}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ maxWidth: '240px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-main)', lineHeight: '1.4', marginBottom: '4px' }}>
                              📍 {order.delivery_address || `Pincode: ${order.pincode}`}
                            </div>
                            {order.delivery_address && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(order.delivery_address);
                                  alert(`Copied address for ${order.order_number}:\n${order.delivery_address}`);
                                }}
                                className="btn-admin btn-admin-outline"
                                style={{ fontSize: '0.68rem', padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                title="Copy address to clipboard"
                              >
                                📋 Copy Address
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          {isPaid ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <strong style={{ color: '#059669', fontSize: '0.98rem' }}>₹{order.total_amount}</strong>
                              <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '600' }}>✓ In Revenue</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <strong style={{ color: '#D97706', fontSize: '0.95rem' }}>₹{order.total_amount}</strong>
                              <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>Pending (Not in Rev)</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span className={`status-pill ${isPaid ? 'pill-success' : order.payment_status === 'FAILED' ? 'pill-danger' : 'pill-warning'}`} style={{ fontSize: '0.75rem', width: 'fit-content' }}>
                              {order.payment_status} ({order.payment_method})
                            </span>
                            {order.payment_reference && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>
                                Ref: {order.payment_reference}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <select
                            value={order.order_status}
                            onChange={(e) => handleDirectStatusChange(order.id, e.target.value)}
                            className="admin-select"
                            style={{
                              fontSize: '0.74rem',
                              padding: '4px 6px',
                              fontWeight: '700',
                              width: '145px',
                              cursor: 'pointer',
                              borderRadius: '6px',
                              borderColor: isDelivered ? '#059669' : isCancelled ? '#DC2626' : isShipped ? '#2563EB' : '#D97706',
                              backgroundColor: isDelivered ? '#ECFDF5' : isCancelled ? '#FEF2F2' : isShipped ? '#EFF6FF' : '#FFFBEB'
                            }}
                            title="Click to update order lifecycle status (Packed, Shipped, Delivered, etc.)"
                          >
                            {statusOptions.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          {order.courier_name || order.tracking_number ? (
                            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontWeight: '700', color: 'var(--admin-text-main)' }}>
                                🚚 {order.courier_name || 'Courier'}
                              </span>
                              {order.tracking_number && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ color: 'var(--admin-text-secondary)', fontSize: '0.74rem' }}>
                                    #{order.tracking_number}
                                  </span>
                                  {order.tracking_url && (
                                    <a
                                      href={order.tracking_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: 'var(--admin-accent)', display: 'inline-flex', alignItems: 'center' }}
                                      title="Open tracking link"
                                    >
                                      <ExternalLink size={11} />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>
                              Not dispatched yet
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                          {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          <br />
                          {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {/* Dispatch / Shipping Edit Button */}
                            <button
                              onClick={() => setDispatchOrder(order)}
                              className="btn-admin btn-admin-primary btn-admin-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', padding: '4px 8px' }}
                              title="Edit courier, tracking number and dispatch logistics"
                            >
                              <Truck size={12} />
                              <span>Dispatch</span>
                            </button>

                            {/* Inspect Order Button */}
                            <button
                              onClick={() => handleInspect(order)}
                              className="btn-admin btn-admin-outline btn-admin-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.74rem', padding: '4px 8px' }}
                              title="Inspect full order items and customer breakdown"
                            >
                              <Eye size={12} />
                              <span>Inspect</span>
                            </button>

                            {/* Quick Mark Paid Button if pending */}
                            {!isPaid && (
                              <button
                                onClick={() => handleQuickMarkPaid(order)}
                                disabled={markingPaidId === order.id}
                                className="btn-admin btn-admin-outline btn-admin-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', padding: '4px 7px', color: '#059669', borderColor: '#A7F3D0' }}
                                title="Mark online payment as confirmed"
                              >
                                <CheckCircle size={11} />
                                <span>Paid</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--admin-text-muted)' }}>
                      {activeTab === 'TODAY' 
                        ? "No new orders received today yet. Total store orders are recorded in 'Recent Orders'."
                        : "No customer orders found in database."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* 3B. Live Payment Ledger Tab */
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Payment Ref</th>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Gateway</th>
                  <th>Amount</th>
                  <th>Transaction Status</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.recentPayments && metrics.recentPayments.length > 0 ? (
                  metrics.recentPayments.map(p => (
                    <tr key={p.id}>
                      <td>
                        <strong style={{ fontSize: '0.84rem' }}>{p.gateway_payment_id || p.id}</strong>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--admin-accent)' }}>{p.order_number || 'N/A'}</strong>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem' }}>
                          <div>{p.customer_name || 'Guest'}</div>
                          {p.customer_phone && <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.74rem' }}>{p.customer_phone}</span>}
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ fontSize: '0.72rem', backgroundColor: '#F1F5F9', color: '#334155' }}>
                          {p.gateway || p.payment_method}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.94rem', color: p.status === 'SUCCESS' ? '#059669' : p.status === 'FAILED' ? '#DC2626' : '#D97706' }}>
                          ₹{parseFloat(p.amount).toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <span className={`status-pill ${p.status === 'SUCCESS' ? 'pill-success' : p.status === 'FAILED' ? 'pill-danger' : 'pill-warning'}`} style={{ fontSize: '0.74rem' }}>
                          {p.status === 'SUCCESS' ? '✓ SUCCESS / PAID' : p.status === 'FAILED' ? '✗ FAILED' : '⏳ PENDING'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                        {new Date(p.created_at).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--admin-text-muted)' }}>
                      No live payments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Render Dispatch Modal if an order is selected */}
      {dispatchOrder && (
        <DispatchModal
          order={dispatchOrder}
          onClose={() => setDispatchOrder(null)}
          onUpdated={() => {
            fetchDashboardData(true);
          }}
        />
      )}

      {/* Render Inspect Modal on Dashboard */}
      {inspectOrder && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-card" style={{ maxWidth: '780px', width: '94%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>Order Inspection</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '4px 0' }}>{inspectOrder.order_number}</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                  Placed on {new Date(inspectOrder.created_at).toLocaleString('en-IN')}
                </span>
              </div>
              <button onClick={() => { setInspectOrder(null); setInspectDetails(null); }} style={{ color: 'var(--admin-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Lifecycle Status Controller */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <label className="admin-label" style={{ marginBottom: '2px' }}>Current Lifecycle Status:</label>
                  <span className="status-pill pill-info" style={{ fontSize: '0.82rem' }}>{inspectOrder.order_status}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    value={inspectOrder.order_status}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      await handleDirectStatusChange(inspectOrder.id, newStatus);
                      setInspectOrder(prev => ({ ...prev, order_status: newStatus }));
                    }}
                    className="admin-select"
                    style={{ width: '200px' }}
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Customer & Address Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ fontSize: '0.88rem', display: 'block', marginBottom: '8px' }}>👤 Customer Contact</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-main)', lineHeight: '1.6' }}>
                  <div><strong>Name:</strong> {inspectOrder.customer_name}</div>
                  <div><strong>Phone:</strong> {inspectOrder.customer_phone}</div>
                  <div><strong>Email:</strong> {inspectOrder.customer_email || 'N/A'}</div>
                </div>
              </div>

              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '0.88rem' }}>📍 Delivery Address</strong>
                  {inspectOrder.delivery_address && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inspectOrder.delivery_address);
                        alert(`Copied address for ${inspectOrder.order_number}`);
                      }}
                      className="btn-admin btn-admin-outline btn-admin-sm"
                      style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                    >
                      📋 Copy Address
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
                  {inspectOrder.delivery_address || `Pincode: ${inspectOrder.pincode}`}
                </div>
              </div>
            </div>

            {/* Purchased Items Table */}
            <h4 style={{ fontSize: '0.96rem', fontWeight: '700', marginBottom: '10px' }}>Purchased Items</h4>
            <div className="admin-table-container" style={{ marginBottom: '20px' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {inspectDetails?.items && inspectDetails.items.length > 0 ? (
                    inspectDetails.items.map((item, idx) => (
                      <tr key={idx}>
                        <td><strong>{item.product_name_snapshot}</strong></td>
                        <td>₹{item.price_snapshot}</td>
                        <td><strong>× {item.quantity}</strong></td>
                        <td><strong>₹{item.total_item_price}</strong></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--admin-text-muted)' }}>
                        {inspectLoading ? 'Loading items snapshot...' : 'Items snapshot loaded from record'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <div style={{ width: '240px', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Payment:</span>
                  <span className={`status-pill ${inspectOrder.payment_status === 'PAID' ? 'pill-success' : 'pill-warning'}`} style={{ fontSize: '0.72rem' }}>
                    {inspectOrder.payment_status} ({inspectOrder.payment_method})
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.15rem' }}>
                  <span>Total Amount:</span>
                  <span style={{ color: '#059669' }}>₹{inspectOrder.total_amount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
