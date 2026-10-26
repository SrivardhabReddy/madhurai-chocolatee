import React, { useState, useEffect } from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag, Truck, Check, AlertCircle, X } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { api } from '../services/api.js';

export default function Cart({ onNavigate }) {
  const { 
    cartItems, 
    updateQuantity, 
    removeItem, 
    clearCart, 
    deliveryPincode, 
    setDeliveryPincode,
    appliedCoupon,
    setAppliedCoupon,
    removeCoupon
  } = useCart();

  const [serverSummary, setServerSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponMsg, setCouponMsg] = useState({ text: '', type: '' });
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Sync coupon code input if already applied
  useEffect(() => {
    if (appliedCoupon?.code) {
      setCouponCodeInput(appliedCoupon.code);
    } else {
      setCouponCodeInput('');
    }
  }, [appliedCoupon]);

  // Sync and validate with backend recalculation
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      setServerSummary(null);
      return;
    }

    setLoading(true);
    const mappedItems = cartItems.map(i => {
      const pId = i.product_id || i.id;
      return {
        product_id: pId,
        id: pId,
        name: i.name,
        slug: i.slug,
        quantity: Math.max(1, parseInt(i.quantity, 10) || 1),
        selling_price: parseFloat(i.selling_price) || parseFloat(i.price) || 0,
        mrp: parseFloat(i.mrp) || (parseFloat(i.selling_price) || parseFloat(i.price) || 0)
      };
    });

    api.validateCart(mappedItems, deliveryPincode, appliedCoupon?.code || '')
      .then(res => {
        if (res.success && res.data) {
          setServerSummary(res.data);
          if (res.data.coupon && !appliedCoupon) {
            setAppliedCoupon(res.data.coupon);
          }
        }
      })
      .catch(err => {
        console.warn('Backend cart validation failed, relying on local calculations:', err);
      })
      .finally(() => setLoading(false));
  }, [cartItems, deliveryPincode, appliedCoupon]);

  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) {
      setCouponMsg({ text: 'Please enter a coupon code.', type: 'error' });
      return;
    }

    setApplyingCoupon(true);
    setCouponMsg({ text: '', type: '' });

    try {
      const mappedItems = cartItems.map(i => ({
        product_id: i.product_id || i.id,
        id: i.product_id || i.id,
        name: i.name,
        slug: i.slug,
        quantity: Math.max(1, parseInt(i.quantity, 10) || 1),
        selling_price: parseFloat(i.selling_price) || parseFloat(i.price) || 0,
        mrp: parseFloat(i.mrp) || 0
      }));

      const res = await api.validateCoupon(code, subtotal, mappedItems, deliveryPincode);
      if (res.success && res.data) {
        setAppliedCoupon(res.data);
        const saved = Number(res.data.discount_amount || res.data.discount || 0).toFixed(2);
        setCouponMsg({ text: `🎉 Coupon ${res.data.code} applied! Saved ₹${saved}.`, type: 'success' });
      } else {
        setCouponMsg({ text: res.message || 'Invalid or expired coupon.', type: 'error' });
      }
    } catch (err) {
      setCouponMsg({ text: err.message || 'Could not validate coupon.', type: 'error' });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCodeInput('');
    setCouponMsg({ text: 'Coupon removed.', type: 'info' });
    setTimeout(() => setCouponMsg({ text: '', type: '' }), 3000);
  };

  // If cart is empty, show empty bag UI
  if (!cartItems || cartItems.length === 0) {
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

  // Instant reactive client-side totals ensuring 100% responsiveness on any item change
  const subtotal = cartItems.reduce((acc, i) => {
    const price = parseFloat(i.selling_price) || parseFloat(i.price) || 0;
    const qty = Math.max(1, parseInt(i.quantity, 10) || 1);
    return acc + (price * qty);
  }, 0);

  const totalMrp = cartItems.reduce((acc, i) => {
    const price = parseFloat(i.selling_price) || parseFloat(i.price) || 0;
    const mrp = parseFloat(i.mrp) || price;
    const qty = Math.max(1, parseInt(i.quantity, 10) || 1);
    return acc + (mrp * qty);
  }, 0);

  const totalQuantity = cartItems.reduce((acc, i) => acc + (parseInt(i.quantity, 10) || 1), 0);

  // Delivery calculation: Free if 5+ packs or order subtotal >= ₹500, or explicitly free by server
  const isFreeDelivery = serverSummary?.delivery?.freeDelivery ?? (totalQuantity >= 5 || subtotal >= 500);
  const deliveryCharge = isFreeDelivery ? 0 : (serverSummary?.deliveryCharge !== undefined ? Number(serverSummary.deliveryCharge) : 40);

  // Active coupon discount calculation
  const activeCoupon = appliedCoupon || serverSummary?.coupon;
  let discountAmount = 0;
  if (activeCoupon) {
    if (serverSummary?.discountAmount !== undefined && Number(serverSummary.discountAmount) > 0) {
      discountAmount = Number(serverSummary.discountAmount);
    } else if (activeCoupon.discount_amount) {
      discountAmount = Number(activeCoupon.discount_amount);
    } else if (activeCoupon.discount) {
      discountAmount = Number(activeCoupon.discount);
    }
  }

  // Final Total is subtotal - discountAmount + deliveryCharge
  const finalTotal = Math.max(0, subtotal - discountAmount + deliveryCharge);

  return (
    <div style={{ padding: '40px 0 80px', backgroundColor: 'var(--cream-50)' }}>
      <div className="container">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <h1 style={{ fontSize: '2.4rem', color: 'var(--cacao-950)', margin: 0 }}>
            Shopping Bag ({totalQuantity} {totalQuantity === 1 ? 'pack' : 'packs'})
          </h1>
          <button 
            onClick={clearCart} 
            className="btn btn-outline btn-sm"
            style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
          >
            <Trash2 size={14} />
            <span>Clear Bag</span>
          </button>
        </div>

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
                🎉 You qualify for FREE Delivery! ({serverSummary?.delivery?.freeDeliveryReason || (totalQuantity >= 5 ? '5+ packs offer' : 'Order over ₹500')})
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
            {cartItems.map((item, index) => {
              const itemId = item.product_id || item.id || `cart_item_${index}`;
              const itemSellingPrice = parseFloat(item.selling_price) || parseFloat(item.price) || 0;
              const itemMrp = parseFloat(item.mrp) || itemSellingPrice;
              const itemQty = Math.max(1, parseInt(item.quantity, 10) || 1);
              const itemImg = item.image_url || '/uploads/chocolate-crunch-pb.jpg';

              return (
                <div
                  key={itemId}
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
                    <img 
                      src={itemImg} 
                      alt={item.name} 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/uploads/chocolate-crunch-pb.jpg';
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '1.08rem', color: 'var(--cacao-950)', marginBottom: '4px' }}>
                          {item.name}
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {item.weight || '500g'} • {item.pieces_per_pack || 40} pieces ({item.selling_unit || 'BOX'})
                        </span>
                      </div>

                      <button
                        onClick={() => removeItem(itemId)}
                        style={{ color: 'var(--text-muted)', padding: '4px', cursor: 'pointer', background: 'none', border: 'none' }}
                        title="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Pricing and Quantity Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--cacao-950)' }}>
                          ₹{(itemSellingPrice * itemQty).toFixed(0)}
                        </span>
                        {itemMrp > itemSellingPrice && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            ₹{(itemMrp * itemQty).toFixed(0)}
                          </span>
                        )}
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          (₹{itemSellingPrice.toFixed(0)} / pack)
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1.5px solid var(--border-medium)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                        backgroundColor: 'var(--cream-50)'
                      }}>
                        <button
                          onClick={() => updateQuantity(itemId, -1)}
                          style={{ padding: '6px 12px', color: 'var(--cacao-900)', background: 'none', border: 'none', cursor: 'pointer' }}
                          title="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ padding: '0 10px', fontWeight: '700', fontSize: '0.9rem', minWidth: '24px', textAlign: 'center' }}>
                          {itemQty}
                        </span>
                        <button
                          onClick={() => updateQuantity(itemId, 1)}
                          style={{ padding: '6px 12px', color: 'var(--cacao-900)', background: 'none', border: 'none', cursor: 'pointer' }}
                          title="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
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

            {/* Interactive Coupon Box */}
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--cream-100)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Tag size={16} style={{ color: 'var(--peanut-gold-700)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--cacao-950)' }}>
                  Promo Coupon
                </span>
              </div>

              {activeCoupon ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#FFFFFF',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--success-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={16} style={{ color: 'var(--success-color)' }} />
                    <span style={{ fontWeight: '700', color: 'var(--cacao-950)', fontSize: '0.88rem' }}>
                      {activeCoupon.code}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--success-color)', fontWeight: '600' }}>
                      (-₹{discountAmount.toFixed(0)})
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                    title="Remove coupon"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="e.g. CRUNCH50 or WELCOME10"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1.5px solid var(--border-medium)',
                      fontSize: '0.88rem',
                      textTransform: 'uppercase',
                      backgroundColor: '#FFFFFF'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={applyingCoupon || !couponCodeInput.trim()}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '8px 14px', minWidth: '70px' }}
                  >
                    {applyingCoupon ? '...' : 'Apply'}
                  </button>
                </form>
              )}

              {couponMsg.text && (
                <div style={{
                  fontSize: '0.8rem',
                  marginTop: '8px',
                  color: couponMsg.type === 'error' ? 'var(--danger-color)' : 'var(--success-color)',
                  fontWeight: '600'
                }}>
                  {couponMsg.text}
                </div>
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
                  <span>Coupon Discount ({activeCoupon?.code})</span>
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

              {totalMrp > subtotal && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-color)', fontSize: '0.85rem' }}>
                  <span>Product Savings</span>
                  <span>₹{(totalMrp - subtotal).toFixed(2)}</span>
                </div>
              )}

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
