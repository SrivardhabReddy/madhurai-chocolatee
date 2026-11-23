import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, MapPin, Truck, ShoppingBag, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../services/api.js';
import { trackPurchaseConversion } from '../utils/gtm.js';

function getOrderIdFromUrl() {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname || '';
  if (path.startsWith('/order-success/')) {
    return path.replace('/order-success/', '').split('/')[0].split('?')[0];
  }
  if (path.startsWith('/account/orders/')) {
    return path.replace('/account/orders/', '').split('/')[0].split('?')[0];
  }
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get('orderId') || searchParams.get('order_id');
}

export default function OrderSuccess({ orderId, onNavigate }) {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleNavigate = (page, params) => {
    if (typeof onNavigate === 'function') {
      onNavigate(page, params);
    } else if (typeof window !== 'undefined') {
      window.location.href = page === 'home' ? '/' : `/${page}`;
    }
  };

  useEffect(() => {
    const id = orderId || getOrderIdFromUrl();
    if (!id) {
      setLoading(false);
      setError('No order ID provided. Please verify your order link.');
      return;
    }

    setLoading(true);
    setError(null);

    api.getOrderById(id)
      .then(res => {
        if (res && res.success && res.data && res.data.order) {
          setOrderData(res.data);
          trackPurchaseConversion(res.data.order, res.data.items);
        } else {
          setError(res?.message || 'Order could not be found.');
        }
      })
      .catch(err => {
        setError(err.message || 'Unable to retrieve order details.');
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <Clock size={40} style={{ color: 'var(--peanut-gold-700)', marginBottom: '16px', display: 'inline-block' }} />
        <h3 style={{ color: 'var(--cacao-950)' }}>Loading your confirmed order...</h3>
      </div>
    );
  }

  const order = orderData?.order;
  const items = orderData?.items || [];
  const isCod = String(order?.payment_method || '').toUpperCase() === 'COD';
  const isPaid = String(order?.payment_status || '').toUpperCase() === 'PAID';
  const isPaymentFailed = String(order?.payment_status || '').toUpperCase() === 'FAILED' || 
                          String(order?.order_status || '').toUpperCase() === 'PAYMENT_FAILED';
  const isCancelled = String(order?.order_status || '').toUpperCase() === 'CANCELLED';
  const isPendingOnline = !isPaid && !isCod;

  if (error || !order) {
    return (
      <div style={{ padding: '60px 0 100px', backgroundColor: 'var(--cream-50)' }}>
        <div className="container" style={{ maxWidth: '640px' }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '40px',
            borderRadius: 'var(--radius-xl)',
            border: '1.5px solid var(--border-medium)',
            boxShadow: 'var(--shadow-md)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}>
              <AlertCircle size={36} />
            </div>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--cacao-950)', marginBottom: '10px' }}>
              Order Not Found
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {error || 'We could not retrieve details for this order. Please verify your order number or tracking link.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => handleNavigate('track_order')} className="btn btn-primary">
                Track Order
              </button>
              <button onClick={() => handleNavigate('home')} className="btn btn-outline">
                Return Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isPaymentFailed || isCancelled) {
    return (
      <div style={{ padding: '60px 0 100px', backgroundColor: 'var(--cream-50)' }}>
        <div className="container" style={{ maxWidth: '640px' }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '40px',
            borderRadius: 'var(--radius-xl)',
            border: '1.5px solid var(--border-medium)',
            boxShadow: 'var(--shadow-md)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}>
              <AlertCircle size={36} />
            </div>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--cacao-950)', marginBottom: '10px' }}>
              {isCancelled ? 'Order Cancelled' : 'Payment Not Completed'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {isCancelled
                ? `Order ${order?.order_number || ''} has been cancelled.`
                : `The payment for order ${order?.order_number || ''} was not completed or failed. No charge was captured.`}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => handleNavigate('checkout')} className="btn btn-primary">
                Return to Checkout
              </button>
              <button onClick={() => handleNavigate('products')} className="btn btn-outline">
                Browse Products
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isPendingOnline) {
    return (
      <div style={{ padding: '60px 0 100px', backgroundColor: 'var(--cream-50)' }}>
        <div className="container" style={{ maxWidth: '640px' }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '40px',
            borderRadius: 'var(--radius-xl)',
            border: '1.5px solid var(--border-medium)',
            boxShadow: 'var(--shadow-md)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FEF3C7',
              color: '#D97706',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}>
              <AlertCircle size={36} />
            </div>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--cacao-950)', marginBottom: '10px' }}>
              Payment Incomplete
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              We have not received a confirmed payment for order <strong>{order?.order_number || ''}</strong>.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Status: <strong>{order?.payment_status}</strong>. If you completed payment via UPI or netbanking, please check your bank account or allow a moment for confirmation.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => handleNavigate('checkout')} className="btn btn-primary">
                Return to Checkout
              </button>
              <button onClick={() => handleNavigate('track_order')} className="btn btn-outline">
                Track Order
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '60px 0 100px', backgroundColor: 'var(--cream-50)' }}>
      <div className="container" style={{ maxWidth: '780px' }}>
        
        {/* Success Header */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '40px',
          borderRadius: 'var(--radius-xl)',
          border: '1.5px solid var(--border-medium)',
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: '#D1FAE5',
            color: 'var(--success-color)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '18px'
          }}>
            <CheckCircle2 size={40} />
          </div>

          <h1 style={{ fontSize: '2.2rem', color: 'var(--cacao-950)', marginBottom: '8px' }}>
            {isCod && !isPaid ? 'Order Placed (Cash on Delivery)' : 'Order Successfully Placed!'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '16px' }}>
            Thank you, <strong>{order?.customer_name}</strong>! {isCod && !isPaid ? 'Your Cash on Delivery order has been received.' : 'Your artisanal chocolate batch is being prepared.'}
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--cream-100)',
            border: '1px solid var(--border-medium)',
            fontWeight: '700',
            fontSize: '1rem',
            color: 'var(--cacao-950)'
          }}>
            <span>Order Number:</span>
            <span style={{ color: 'var(--peanut-gold-700)' }}>{order?.order_number}</span>
          </div>

          <div style={{ marginTop: '20px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            A confirmation receipt has been sent to <strong>{order?.customer_email}</strong>.
          </div>
        </div>

        {/* Live Order Status Stepper */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '32px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '32px'
        }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--cacao-950)', marginBottom: '24px' }}>
            Live Order Tracking
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--success-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem' }}>✓</div>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', marginTop: '8px', color: 'var(--cacao-950)' }}>Order Placed</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Received</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: isPaid ? 'var(--success-color)' : 'var(--cream-200)', color: isPaid ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem' }}>
                {isPaid ? '✓' : (isCod ? 'COD' : '2')}
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', marginTop: '8px', color: 'var(--cacao-950)' }}>Payment</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{order?.payment_status}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order?.order_status) ? 'var(--success-color)' : 'var(--cream-200)', color: ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order?.order_status) ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem' }}>
                {['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order?.order_status) ? '✓' : '3'}
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', marginTop: '8px', color: 'var(--cacao-950)' }}>Packed</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cold-pack</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order?.order_status) ? 'var(--success-color)' : 'var(--cream-200)', color: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order?.order_status) ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem' }}>
                {['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order?.order_status) ? '✓' : '4'}
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', marginTop: '8px', color: 'var(--cacao-950)' }}>Shipped</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Express Dispatch</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: order?.order_status === 'DELIVERED' ? 'var(--success-color)' : 'var(--cream-200)', color: order?.order_status === 'DELIVERED' ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem' }}>
                {order?.order_status === 'DELIVERED' ? '✓' : '5'}
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', marginTop: '8px', color: 'var(--cacao-950)' }}>Delivered</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>At Doorstep</span>
            </div>
          </div>
        </div>

        {/* Order Items & Shipping Snapshot */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '32px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--cacao-950)', marginBottom: '18px' }}>
            Order Items Snapshot
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <h4 style={{ fontSize: '0.98rem', color: 'var(--cacao-950)' }}>{item.product_name_snapshot}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {item.weight_snapshot} • {item.pieces_per_pack_snapshot} pcs • Qty: {item.quantity}
                  </span>
                </div>
                <div style={{ fontWeight: '700', color: 'var(--cacao-950)' }}>
                  ₹{item.total_item_price}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>₹{order?.subtotal}</span>
            </div>
            {order?.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-color)' }}>
                <span>Coupon Discount ({order?.coupon_code}):</span>
                <span>-₹{order?.discount_amount}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Shipping:</span>
              <span>{order?.is_free_delivery ? 'FREE' : `₹${order?.delivery_charge}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.2rem', color: 'var(--cacao-950)', paddingTop: '8px', borderTop: '1px solid var(--border-medium)' }}>
              <span>{isPaid ? 'Total Paid Online:' : (isCod ? 'Pay on Delivery:' : 'Total Amount:')}</span>
              <span>₹{order?.total_amount}</span>
            </div>

            {Number(order?.balance_due_on_delivery) > 0 && (
              <div style={{
                backgroundColor: '#FFFBEB',
                border: '1.5px solid #FCD34D',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginTop: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#92400E'
              }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>✨ Pre-Booking Order Confirmed</div>
                  <div style={{ fontSize: '0.8rem', color: '#78350F' }}>Advance token paid. Remaining collected upon doorstep delivery.</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#78350F' }}>Balance on Delivery</div>
                  <strong style={{ fontSize: '1.25rem', color: '#B45309' }}>₹{order?.balance_due_on_delivery}</strong>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '16px', backgroundColor: 'var(--cream-100)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
            <div style={{ fontWeight: '700', color: 'var(--cacao-950)', marginBottom: '4px' }}>Delivery Address:</div>
            <div style={{ color: 'var(--text-secondary)' }}>{order?.delivery_address}</div>
          </div>

          <div style={{ marginTop: '28px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button onClick={() => handleNavigate('products')} className="btn btn-primary">
              Continue Shopping
            </button>
            <button onClick={() => handleNavigate('track_order')} className="btn btn-outline">
              Track Another Order
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
