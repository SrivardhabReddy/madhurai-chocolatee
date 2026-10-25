import React, { useState, useEffect } from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag, Truck, Check, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { api } from '../services/api.js';

export default function Cart({ onNavigate }) {
  const { cartItems, updateQuantity, removeItem, clearCart, deliveryPincode, setDeliveryPincode } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [serverSummary, setServerSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync and validate with backend recalculation
  useEffect(() => {
    if (cartItems.length === 0) {
      setServerSummary(null);
      return;
    }

    setLoading(true);
    api.validateCart(cartItems, deliveryPincode, appliedCoupon?.code || '')
      .then(res => {
        if (res.success && res.data) {
          setServerSummary(res.data);
        }
      })
      .catch(err => {
        console.error('Failed to validate cart with backend:', err);
      })
      .finally(() => setLoading(false));
  }, [cartItems, deliveryPincode, appliedCoupon]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponError('');
    setCouponSuccess('');

    try {
      const res = await api.validateCoupon(couponCode.trim(), serverSummary?.subtotal || 0, cartItems, deliveryPincode);
      if (res.success && res.data) {
        setAppliedCoupon(res.data);
        setCouponSuccess(`Coupon ${res.data.code} applied! Saved ₹${res.data.discount_amount.toFixed(2)}.`);
      } else {
        setCouponError(res.message || 'Invalid coupon.');
      }
    } catch (err) {
      setCouponError(err.message || 'Coupon could not be applied.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponSuccess('');
    setCouponError('');
  };

  if (cartItems.length === 0) {
    return (
      <div style={{ padding: '80px 0', backgroundColor: '#FFFFFF', minHeight: '60vh' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--cream-100)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cacao-800)', marginBottom: '20px' }}>
            <ShoppingBag size={36} />
          </div>
          <h2 style={{ fontSize: '2rem', color: 'var(--cacao-950)', marginBottom: '10px' }}>Your Bag is Empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>
            Fill it with our freshly roasted Chocolate Crunch Peanut Butter boxes and artisan slabs!
          </p>
          <button onClick={() => onNavigate('products')} className="btn btn-primary btn-lg">
            <span>Explore Chocolates</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  const subtotal = serverSummary?.subtotal || cartItems.reduce((acc, i) => acc + i.selling_price * i.quantity, 0);
  const totalMrp = serverSummary?.totalMrp || cartItems.reduce((acc, i) => acc + i.mrp * i.quantity, 0);
  const discountAmount = serverSummary?.discountAmount || 0;
  const deliveryCharge = serverSummary?.deliveryCharge !== undefined ? serverSummary.deliveryCharge : 40;
  const finalTotal = serverSummary?.finalTotal || (subtotal - discountAmount + deliveryCharge);
  const isFreeDelivery = serverSummary?.delivery?.freeDelivery || false;
  const totalQuantity = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div style={{ padding: '40px 0 80px', backgroundColor: 'var(--cream-50)' }}>
      <div className="container">
        
        <h1 style={{ fontSize: '2.4rem', color: 'var(--cacao-950)', marginBottom: '32px' }}>
          Shopping Bag ({totalQuantity} {totalQuantity === 1 ? 'pack' : 'packs'})
        </h1>

        {/* Free Delivery Milestone Progress Ribbon */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          border: '1.5px solid var(--border-medium)',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Truck size={22} style={{ color: isFreeDelivery ? 'var(--success-color)' : 'var(--peanut-gold-600)' }} />
          <div>
            {isFreeDelivery ? (
              <span style={{ fontWeight: '700', color: 'var(--success-color)', fontSize: '0.92rem' }}>
                🎉 You qualify for FREE Delivery! ({serverSummary?.delivery?.freeDeliveryReason || 'Order over threshold'})
              </span>
            ) : (
              <span style={{ fontSize: '0.92rem', color: 'var(--cacao-900)' }}>
                Add <strong>{Math.max(0, 5 - totalQuantity)} more pack(s)</strong> or reach <strong>₹500</strong> for FREE delivery!
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'flex-start' }}>
          
          {/* Cart Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cartItems.map(item => (
              <div
                key={item.product_id}
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Product Thumbnail */}
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  backgroundColor: 'var(--cream-100)',
                  flexShrink: 0
                }}>
                  <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.08rem', color: 'var(--cacao-950)', marginBottom: '4px' }}>
                        {item.name}
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {item.weight} • {item.pieces_per_pack} pieces ({item.selling_unit})
                      </span>
                    </div>

                    <button
                      onClick={() => removeItem(item.product_id)}
                      style={{ color: 'var(--text-muted)', padding: '4px' }}
                      title="Remove"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Pricing and Quantity Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--cacao-950)' }}>
                        ₹{item.selling_price * item.quantity}
                      </span>
                      {item.mrp > item.selling_price && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          ₹{item.mrp * item.quantity}
                        </span>
                      )}
                    </div>

                    {/* Quantity Stepper */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '1.5px solid var(--border-medium)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden'
                    }}>
                      <button
                        onClick={() => updateQuantity(item.product_id, -1)}
                        style={{ padding: '6px 12px', color: 'var(--cacao-900)' }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ padding: '0 10px', fontWeight: '700', fontSize: '0.9rem' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_id, 1)}
                        style={{ padding: '6px 12px', color: 'var(--cacao-900)' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Order Summary & Coupon Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '28px',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--border-medium)',
            boxShadow: 'var(--shadow-md)',
            position: 'sticky',
            top: '100px'
          }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--cacao-950)', marginBottom: '20px' }}>
              Order Breakdown
            </h3>

            {/* Coupon Box */}
            <div style={{ marginBottom: '24px' }}>
              {!appliedCoupon ? (
                <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Enter Promo Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="form-input"
                    style={{ textTransform: 'uppercase', fontSize: '0.88rem' }}
                  />
                  <button type="submit" className="btn btn-outline btn-sm" style={{ minWidth: '80px' }}>
                    APPLY
                  </button>
                </form>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: '#D1FAE5',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #A7F3D0',
                  color: '#065F46',
                  fontSize: '0.88rem',
                  fontWeight: '600'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag size={16} />
                    <span>{appliedCoupon.code} (-₹{discountAmount.toFixed(0)})</span>
                  </div>
                  <button onClick={handleRemoveCoupon} style={{ color: 'var(--danger-color)', fontSize: '0.8rem', fontWeight: '700' }}>
                    Remove
                  </button>
                </div>
              )}

              {couponError && (
                <span style={{ fontSize: '0.8rem', color: 'var(--danger-color)', marginTop: '4px', display: 'block' }}>
                  {couponError}
                </span>
              )}
              {couponSuccess && (
                <span style={{ fontSize: '0.8rem', color: 'var(--success-color)', marginTop: '4px', display: 'block' }}>
                  {couponSuccess}
                </span>
              )}
            </div>

            {/* Cost Breakdown Lines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.94rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Total MRP</span>
                <span>₹{totalMrp.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Selling Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-color)', fontWeight: '600' }}>
                  <span>Coupon Discount</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Delivery Charge</span>
                <span>{isFreeDelivery ? <strong style={{ color: 'var(--success-color)' }}>FREE</strong> : `₹${deliveryCharge.toFixed(2)}`}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Taxes & Packaging</span>
                <span style={{ color: 'var(--success-color)', fontWeight: '600' }}>Included</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.35rem',
                fontWeight: '800',
                color: 'var(--cacao-950)',
                borderTop: '2px solid var(--border-medium)',
                paddingTop: '14px',
                marginTop: '4px'
              }}>
                <span>Final Total</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => onNavigate('checkout')}
              className="btn btn-gold btn-lg"
              style={{ width: '100%', padding: '16px' }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>

            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', display: 'block', marginTop: '12px' }}>
              🔒 100% Safe & Encrypted Checkout • Server Re-verified
            </span>

          </div>

        </div>

      </div>
    </div>
  );
}
