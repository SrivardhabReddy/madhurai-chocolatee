import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RotateCcw, 
  Truck, 
  CreditCard,
  ArrowRight,
  TrendingUp,
  Package
} from 'lucide-react';
import { adminApi } from '../services/adminApi.js';

export default function Dashboard({ onNavigate }) {
  const [metrics, setMetrics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getDashboard(),
      adminApi.getAnalytics('7d')
    ]).then(([dashRes, anaRes]) => {
      if (dashRes.success) setMetrics(dashRes.data);
      if (anaRes.success) setAnalytics(anaRes.data);
    }).catch(err => {
      console.error('Failed to load admin dashboard:', err);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading operations metrics...</div>;
  }

  const statCards = [
    { label: "Today's Revenue", val: `₹${metrics?.todayRevenue?.toFixed(2) || '0.00'}`, icon: DollarSign, color: '#059669', bg: '#ECFDF5' },
    { label: "Today's Orders", val: metrics?.todayOrders || 0, icon: ShoppingBag, color: '#D97706', bg: '#FFFBEB' },
    { label: 'Total Revenue', val: `₹${metrics?.totalRevenue?.toFixed(2) || '0.00'}`, icon: TrendingUp, color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Total Orders', val: metrics?.totalOrders || 0, icon: Package, color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Pending Processing', val: metrics?.pendingOrders || 0, icon: Clock, color: '#D97706', bg: '#FFFBEB' },
    { label: 'COD Orders', val: metrics?.codOrders || 0, icon: CreditCard, color: '#0D9488', bg: '#F0FDFA' },
    { label: 'Low Stock Alerts', val: metrics?.lowStock || 0, icon: AlertTriangle, color: metrics?.lowStock > 0 ? '#DC2626' : '#64748B', bg: '#FEF2F2' },
    { label: 'Total Units Sold', val: metrics?.productsSold || 0, icon: CheckCircle, color: '#059669', bg: '#ECFDF5' }
  ];

  return (
    <div>
      {/* 1. Stat Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: card.bg,
                color: card.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {card.label}
                </span>
                <div style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--admin-text-main)', marginTop: '2px' }}>
                  {card.val}
                </div>
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Sales & Revenue Trends (Last 7 Days)</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>Daily Volume</span>
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
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px' }}>
            Payment Method Split
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {analytics?.paymentMethods && analytics.paymentMethods.length > 0 ? (
              analytics.paymentMethods.map((pm, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CreditCard size={18} style={{ color: 'var(--admin-accent)' }} />
                    <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{pm.payment_method}</span>
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>₹{pm.total}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginLeft: '8px' }}>({pm.count} orders)</span>
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

      {/* 3. Recent Orders Activity */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Recent Orders</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>Live order stream from customer store</span>
          </div>
          <button onClick={() => onNavigate('orders')} className="btn-admin btn-admin-outline btn-admin-sm">
            <span>Manage All Orders</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
                metrics.recentOrders.map(order => (
                  <tr key={order.id}>
                    <td><strong>{order.order_number}</strong></td>
                    <td>{order.customer_name}</td>
                    <td>{order.customer_phone}</td>
                    <td><strong>₹{order.total_amount}</strong></td>
                    <td>
                      <span className={`status-pill ${order.payment_status === 'PAID' ? 'pill-success' : 'pill-warning'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${order.order_status === 'DELIVERED' ? 'pill-success' : order.order_status === 'CANCELLED' ? 'pill-danger' : 'pill-info'}`}>
                        {order.order_status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td>
                      <button
                        onClick={() => onNavigate('orders')}
                        className="btn-admin btn-admin-outline btn-admin-sm"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>No orders placed yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
