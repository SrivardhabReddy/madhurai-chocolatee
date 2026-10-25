import React, { useState } from 'react';
import { Search, Package, MapPin, Truck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { api } from '../services/api.js';

export default function TrackOrder({ onNavigate }) {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setError('Please provide both your Order ID and registered Mobile Number.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await api.trackOrder(orderNumber.trim(), phone.trim());
      if (res.success && res.data) {
        setOrderData(res.data);
      } else {
        setError(res.message || 'No order found matching these details.');
        setOrderData(null);
      }
    } catch (err) {
      setError(err.message || 'Could not find order. Please verify your order ID.');
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  const order = orderData?.order;
  const items = orderData?.items || [];

  return (
    <div style={{ padding: '60px 0 100px', backgroundColor: 'var(--cream-50)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '780px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', backgroundColor: 'var(--peanut-gold-100)', color: 'var(--peanut-gold-700)', marginBottom: '12px' }}>
            <Package size={32} />
          </div>
          <h1 style={{ fontSize: '2.4rem', color: 'var(--cacao-950)', marginBottom: '8px' }}>
            Track Your Chocolate Order
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Enter your order number and 10-digit mobile number to view live fulfillment status.
          </p>
        </div>

        {/* Input Form */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '32px',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--border-medium)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '36px'
        }}>
          <form onSubmit={handleTrack}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="order_number">Order Number *</label>
                <input
                  type="text"
                  id="order_number"
                  placeholder="Enter Order Number"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  className="form-input"
                  style={{ textTransform: 'uppercase' }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="phone">Mobile Number *</label>
                <input
                  type="tel"
                  id="phone"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  className="form-input"
                  required
                />
              </div>
            </div>

            {error && (
              <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: '#FEE2E2', color: 'var(--danger-color)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
            >
              <Search size={18} />
              <span>{loading ? 'Locating Order...' : 'Track Live Status'}</span>
            </button>
          </form>
        </div>

        {/* Tracking Details Result */}
        {order && (
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '36px',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--border-medium)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Order ID:</span>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--cacao-950)' }}>{order.order_number}</h3>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Placed on: {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-dark" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
                  {order.order_status}
                </span>
                <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Payment: <strong>{order.payment_status}</strong> ({order.payment_method})
                </span>
              </div>
            </div>

            {/* Status Stepper */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
              gap: '12px',
              textAlign: 'center',
              backgroundColor: 'var(--cream-100)',
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '32px'
            }}>
              <div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--success-color)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem' }}>✓</div>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--cacao-950)', marginTop: '6px' }}>Order Placed</div>
              </div>

              <div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: order.payment_status === 'PAID' ? 'var(--success-color)' : 'var(--cream-300)', color: order.payment_status === 'PAID' ? '#fff' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem' }}>
                  {order.payment_status === 'PAID' ? '✓' : '•'}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--cacao-950)', marginTop: '6px' }}>Payment</div>
              </div>

              <div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.order_status) ? 'var(--success-color)' : 'var(--cream-300)', color: ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.order_status) ? '#fff' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem' }}>
                  {['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.order_status) ? '✓' : '•'}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--cacao-950)', marginTop: '6px' }}>Packed</div>
              </div>

              <div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.order_status) ? 'var(--success-color)' : 'var(--cream-300)', color: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.order_status) ? '#fff' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem' }}>
                  {['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.order_status) ? '✓' : '•'}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--cacao-950)', marginTop: '6px' }}>Shipped</div>
              </div>

              <div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: order.order_status === 'DELIVERED' ? 'var(--success-color)' : 'var(--cream-300)', color: order.order_status === 'DELIVERED' ? '#fff' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem' }}>
                  {order.order_status === 'DELIVERED' ? '✓' : '•'}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--cacao-950)', marginTop: '6px' }}>Delivered</div>
              </div>
            </div>

            {/* Items */}
            <h4 style={{ fontSize: '1.05rem', color: 'var(--cacao-950)', marginBottom: '14px' }}>Items in this Delivery</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>{item.product_name_snapshot} ({item.weight_snapshot}) <strong>× {item.quantity}</strong></span>
                  <span style={{ fontWeight: '700' }}>₹{item.total_item_price}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--cream-50)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: '700', color: 'var(--cacao-950)', marginBottom: '2px' }}>Shipping Address:</div>
              <div style={{ color: 'var(--text-secondary)' }}>{order.delivery_address}</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
