import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAnalytics(range);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [range]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>
            Store Analytics & Performance
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Deep dive into sales trends, product velocity, payment methods, and geographic demand
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['today', '7d', '30d'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`admin-btn ${range === r ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {r === 'today' ? 'Today' : r === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="admin-alert admin-alert-danger">{error}</div>}

      {loading ? (
        <div className="admin-card" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Aggregating financial and inventory intelligence...
        </div>
      ) : data ? (
        <div>
          {/* Top Selling Products */}
          <div className="admin-grid-2" style={{ marginBottom: '24px' }}>
            <div className="admin-card">
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
                🏆 Top Velocity Products
              </h2>
              {data.topProducts?.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                  No product sales recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {data.topProducts?.map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        background: '#f8fafc',
                        borderRadius: '8px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{p.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {p.units_sold} units sold
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '700', color: '#059669' }}>
                          ₹{parseFloat(p.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Gross Sales</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method Distribution */}
            <div className="admin-card">
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
                💳 Payment Method Split
              </h2>
              {data.paymentMethods?.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                  No payment events yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {data.paymentMethods?.map((pm, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        background: '#f8fafc',
                        borderRadius: '8px'
                      }}
                    >
                      <div>
                        <span className="admin-badge admin-badge-info" style={{ marginRight: '8px' }}>
                          {pm.payment_method}
                        </span>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                          {pm.count} transactions
                        </span>
                      </div>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>
                        ₹{parseFloat(pm.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Regional Delivery Demand & Order Lifecycle */}
          <div className="admin-grid-2" style={{ marginBottom: '24px' }}>
            <div className="admin-card">
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
                📍 Delivery Zone Performance
              </h2>
              {data.zonePerformance?.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                  No zone metrics recorded.
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Zone</th>
                      <th>Orders</th>
                      <th style={{ textAlign: 'right' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.zonePerformance?.map((z, idx) => (
                      <tr key={idx}>
                        <td><strong>{z.zone}</strong></td>
                        <td>{z.order_count}</td>
                        <td style={{ textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                          ₹{parseFloat(z.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="admin-card">
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
                📦 Order Lifecycle Statuses
              </h2>
              {data.orderStatuses?.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                  No active orders.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {data.orderStatuses?.map((st, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '14px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        borderLeft: '4px solid #3b82f6'
                      }}
                    >
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        {st.order_status}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                        {st.count}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Daily Revenue Trend Table */}
          <div className="admin-card">
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
              📈 Daily Order & Revenue Trends
            </h2>
            {data.salesTrends?.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                No daily sales trends recorded in this time range.
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Orders Created</th>
                    <th style={{ textAlign: 'right' }}>Total Order Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.salesTrends?.map((trend, idx) => (
                    <tr key={idx}>
                      <td><strong>{trend.date}</strong></td>
                      <td>
                        <span className="admin-badge admin-badge-info">{trend.orders_count} orders</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#059669' }}>
                        ₹{parseFloat(trend.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
