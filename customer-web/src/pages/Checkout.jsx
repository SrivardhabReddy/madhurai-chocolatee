import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  CreditCard, 
  Banknote, 
  QrCode, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Truck,
  Tag
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import UPIQRModal from '../components/UPIQRModal.jsx';

export default function Checkout({ onNavigate }) {
  const { cartItems, clearCart, deliveryPincode, setDeliveryPincode, appliedCoupon, setAppliedCoupon, removeCoupon } = useCart();
  const { user } = useAuth();

  // Customer Form State
  const [formData, setFormData] = useState({
    customer_name: user?.full_name || '',
    customer_email: user?.email || '',
    customer_phone: user?.phone || '',
    house_building: '',
    street: '',
    area: '',
    landmark: '',
    city: '',
    district: '',
    state: 'Andhra Pradesh',
    pincode: deliveryPincode || '524101',
    customer_notes: ''
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('UPI_QR'); // 'UPI_QR', 'CARD', 'NET_BANKING', 'COD'
  
  // Serviceability State
  const [serviceability, setServiceability] = useState(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');

  // Cart Recalculation State
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // UPI QR Modal State
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  // Coupon Entry in Payment Section State
  const [couponInput, setCouponInput] = useState(appliedCoupon?.code || '');
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(appliedCoupon?.code ? `Coupon ${appliedCoupon.code} applied!` : '');

  // Keep couponInput in sync if appliedCoupon changes or loads from localStorage
  useEffect(() => {
    if (appliedCoupon?.code) {
      setCouponInput(appliedCoupon.code);
      setCouponSuccess(`Coupon ${appliedCoupon.code} applied!`);
    } else {
      setCouponInput('');
      setCouponSuccess('');
    }
  }, [appliedCoupon]);

  // Load saved addresses for authenticated users
  useEffect(() => {
    if (user) {
      api.getAddresses().then(res => {
        if (res.success && res.data.length > 0) {
          setSavedAddresses(res.data);
          const defaultAddr = res.data.find(a => a.is_default) || res.data[0];
          if (defaultAddr) {
            setFormData(prev => ({
              ...prev,
              house_building: defaultAddr.house_building,
              street: defaultAddr.street,
              area: defaultAddr.area,
              landmark: defaultAddr.landmark || '',
              city: defaultAddr.city,
              district: defaultAddr.district,
              state: defaultAddr.state,
              pincode: defaultAddr.pincode
            }));
          }
        }
      });
    }
  }, [user]);

  // Check delivery serviceability whenever pincode changes
  useEffect(() => {
    if (formData.pincode && formData.pincode.trim().length === 6) {
      setCheckingDelivery(true);
      setDeliveryError('');
      api.checkDelivery(formData.pincode.trim(), cartItems)
        .then(res => {
          if (res.success && res.data) {
            setServiceability(res.data);
            if (res.data.city && !formData.city) {
              setFormData(prev => ({
                ...prev,
                city: res.data.city,
                district: res.data.district || res.data.city,
                state: res.data.state || prev.state
              }));
            }
            if (!res.data.serviceable) {
              setDeliveryError(res.data.reason || 'Sorry, we currently do not deliver to this location.');
            }
          }
        })
        .catch(err => {
          setDeliveryError('Failed to verify delivery pincode.');
        })
        .finally(() => setCheckingDelivery(false));
    }
  }, [formData.pincode, cartItems]);

  // Recalculate official server pricing
  useEffect(() => {
    if (cartItems.length > 0) {
      setLoadingSummary(true);
      const mappedItems = cartItems.map(i => ({
        product_id: i.product_id || i.id,
        name: i.name,
        slug: i.slug,
        quantity: Math.max(1, parseInt(i.quantity, 10) || 1),
        selling_price: parseFloat(i.selling_price) || parseFloat(i.price) || 0,
        mrp: parseFloat(i.mrp) || 0
      }));
      api.validateCart(mappedItems, formData.pincode, appliedCoupon?.code || '')
        .then(res => {
          if (res.success && res.data) {
            setSummary(res.data);
            if (res.data.coupon && !appliedCoupon) {
              setAppliedCoupon(res.data.coupon);
            }
          }
        })
        .finally(() => setLoadingSummary(false));
    }
  }, [cartItems, formData.pincode, appliedCoupon]);

  const calculatedSubtotal = cartItems.reduce((acc, i) => {
    const price = parseFloat(i.selling_price) || parseFloat(i.price) || 0;
    const qty = Math.max(1, parseInt(i.quantity, 10) || 1);
    return acc + (price * qty);
  }, 0);
  const displaySubtotal = (summary && Number(summary.subtotal) > 0) ? Number(summary.subtotal) : calculatedSubtotal;

  const activeCoupon = appliedCoupon || summary?.coupon;
  const activeDiscount = Number(summary?.discountAmount || summary?.coupon?.discount || summary?.coupon?.discount_amount || appliedCoupon?.discount_amount || appliedCoupon?.discount || 0);

  const totalQuantity = cartItems.reduce((acc, i) => acc + (parseInt(i.quantity, 10) || 1), 0);
  const isFreeDelivery = summary?.delivery?.freeDelivery ?? (totalQuantity >= 5 || calculatedSubtotal >= 500);
  const deliveryFee = isFreeDelivery ? 0 : (summary?.deliveryCharge !== undefined ? Number(summary.deliveryCharge) : 40);

  // The final total is mathematically guaranteed to be displaySubtotal - activeDiscount + deliveryFee
  const calculatedFinalTotal = Math.max(0, displaySubtotal - activeDiscount + deliveryFee);
  const finalTotalDisplay = (summary && Number(summary.subtotal) > 0 && summary.finalTotal !== undefined && Math.abs(Number(summary.finalTotal) - calculatedFinalTotal) < 1)
    ? Number(summary.finalTotal)
    : calculatedFinalTotal;

  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError('');
    setCouponSuccess('');
    setCouponApplying(true);

    try {
      const mappedItems = cartItems.map(i => ({
        product_id: i.product_id || i.id,
        name: i.name,
        slug: i.slug,
        quantity: Math.max(1, parseInt(i.quantity, 10) || 1),
        selling_price: parseFloat(i.selling_price) || parseFloat(i.price) || 0,
        mrp: parseFloat(i.mrp) || 0
      }));

      const res = await api.validateCoupon(couponInput.trim(), displaySubtotal, mappedItems, formData.pincode);
      if (res.success && res.data) {
        setAppliedCoupon(res.data);
        const savedAmt = Number(res.data.discount_amount || res.data.discount || 0).toFixed(2);
        setCouponSuccess(`Coupon ${res.data.code} applied! Saved ₹${savedAmt}.`);
        setCouponError('');

        // Refresh cart summary with applied coupon
        api.validateCart(mappedItems, formData.pincode, res.data.code)
          .then(cRes => {
            if (cRes.success && cRes.data) {
              setSummary(cRes.data);
            }
          });
      } else {
        setCouponError(res.message || 'Invalid coupon.');
      }
    } catch (err) {
      setCouponError(err.message || 'Coupon could not be applied.');
    } finally {
      setCouponApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    if (removeCoupon) {
      removeCoupon();
    }
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponSuccess('');
    setCouponError('');

    const mappedItems = cartItems.map(i => ({
      product_id: i.product_id || i.id,
      name: i.name,
      slug: i.slug,
      quantity: Math.max(1, parseInt(i.quantity, 10) || 1),
      selling_price: parseFloat(i.selling_price) || parseFloat(i.price) || 0,
      mrp: parseFloat(i.mrp) || 0
    }));
    api.validateCart(mappedItems, formData.pincode, '')
      .then(res => {
        if (res.success && res.data) {
          setSummary(res.data);
        }
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressSelect = (addr) => {
    setFormData(prev => ({
      ...prev,
      house_building: addr.house_building,
      street: addr.street,
      area: addr.area,
      landmark: addr.landmark || '',
      city: addr.city,
      district: addr.district,
      state: addr.state,
      pincode: addr.pincode
    }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setFormError('');

    // Form validation
    if (!formData.customer_name || !formData.customer_email || !formData.customer_phone) {
      setFormError('Please enter your full name, email, and mobile number.');
      return;
    }
    if (!formData.house_building || !formData.street || !formData.area || !formData.city || !formData.pincode) {
      setFormError('Please complete your full delivery address.');
      return;
    }

    // Serviceability check
    if (!serviceability || !serviceability.serviceable) {
      setFormError('Cannot place order: Your delivery pincode is not serviceable.');
      return;
    }

    // COD check
    if (paymentMethod === 'COD' && !serviceability.codAvailable) {
      setFormError('Cash on Delivery is not available for this location.');
      return;
    }

    setOrderSubmitting(true);

    try {
      const activeCouponCode = activeCoupon?.code ? String(activeCoupon.code).trim().toUpperCase() : null;
      const orderPayload = {
        ...formData,
        items: cartItems.map(i => ({
          product_id: i.product_id || i.id,
          name: i.name,
          slug: i.slug,
          selling_price: parseFloat(i.selling_price) || parseFloat(i.price) || 0,
          quantity: Math.max(1, parseInt(i.quantity, 10) || 1)
        })),
        coupon_code: activeCouponCode,
        payment_method: paymentMethod
      };

      const orderRes = await api.createOrder(orderPayload);

      if (orderRes.success && orderRes.data) {
        const orderInfo = orderRes.data;

        // If Cash on Delivery or ₹0 order, order is confirmed immediately!
        if (paymentMethod === 'COD' || Number(orderInfo.totalAmount) <= 0) {
          clearCart();
          onNavigate('order_success', { orderId: orderInfo.orderId });
          return;
        }

        // For Online Payments (UPI QR / Cards), initialize payment intent
        const payRes = await api.createPayment(orderInfo.orderId, paymentMethod);
        if (payRes.success && payRes.data) {
          setCreatedOrder({
            id: orderInfo.orderId,
            order_number: orderInfo.orderNumber,
            total_amount: orderInfo.totalAmount
          });
          setPaymentData(payRes.data);
          setUpiModalOpen(true);
        } else {
          setFormError('Order created, but payment initialization failed. Please contact support.');
        }
      } else {
        setFormError(orderRes.message || 'Could not place order. Please review your details.');
      }
    } catch (err) {
      setFormError(err.message || 'Error communicating with server.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handlePaymentSuccess = (verifiedData) => {
    setUpiModalOpen(false);
    clearCart();
    const finalOrderId = verifiedData?.order_id || verifiedData?.id || createdOrder?.id;
    onNavigate('order_success', { orderId: finalOrderId });
  };

  if (cartItems.length === 0) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>No items in checkout</h2>
        <button onClick={() => onNavigate('products')} className="btn btn-primary" style={{ marginTop: '16px' }}>
          Browse Catalog
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0 80px', backgroundColor: 'var(--cream-50)' }}>
      <div className="container">
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <button onClick={() => onNavigate('cart')} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <ArrowLeft size={16} />
            <span>Back to Bag</span>
          </button>
        </div>

        <h1 style={{ fontSize: '2.4rem', color: 'var(--cacao-950)', marginBottom: '32px' }}>
          Secure Checkout
        </h1>

        <form onSubmit={handlePlaceOrder}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px', alignItems: 'flex-start' }}>
            
            {/* Left Column: Customer Info & Address */}
            <div>
              
              {/* Step 1: Customer Details */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-medium)', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--cacao-950)', marginBottom: '20px' }}>
                  1. Contact Information
                </h3>

                <div className="form-group">
                  <label className="form-label" htmlFor="customer_name">Full Name *</label>
                  <input
                    type="text"
                    id="customer_name"
                    name="customer_name"
                    autoComplete="name"
                    required
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="customer_phone">Mobile Number *</label>
                    <input
                      type="tel"
                      id="customer_phone"
                      name="customer_phone"
                      autoComplete="tel"
                      inputMode="numeric"
                      required
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      placeholder="10-digit mobile number"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="customer_email">Email Address *</label>
                    <input
                      type="email"
                      id="customer_email"
                      name="customer_email"
                      autoComplete="email"
                      required
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      placeholder="Order confirmation email"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Shipping Address */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-medium)', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--cacao-950)' }}>
                    2. Delivery Address
                  </h3>
                  {user && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--peanut-gold-700)', fontWeight: '600' }}>
                      Logged In as {user.full_name}
                    </span>
                  )}
                </div>

                {/* Saved Address Selector for Logged in Users */}
                {savedAddresses.length > 0 && (
                  <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: 'var(--cream-100)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--cacao-900)', display: 'block', marginBottom: '8px' }}>
                      Use a Saved Address:
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {savedAddresses.map((addr, idx) => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handleAddressSelect(addr)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.78rem' }}
                        >
                          {addr.house_building}, {addr.city} ({addr.pincode})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="pincode">Delivery Pincode *</label>
                  <input
                    type="text"
                    id="pincode"
                    name="pincode"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="6-digit Indian Pincode (e.g. 524001, 625001)"
                    className="form-input"
                  />
                  {checkingDelivery && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Verifying delivery zone and serviceability...
                    </span>
                  )}
                  {deliveryError && (
                    <div style={{ fontSize: '0.84rem', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                      <AlertCircle size={16} />
                      <span>{deliveryError}</span>
                    </div>
                  )}
                  {serviceability?.serviceable && (
                    <div style={{ marginTop: '6px' }}>
                      <div style={{ fontSize: '0.84rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle size={16} />
                        <span>Delivering to {serviceability.city}, {serviceability.state} ({serviceability.estimatedMinDays}-{serviceability.estimatedMaxDays} business days)</span>
                      </div>
                      {serviceability.areaLimitNotice && (
                        <div style={{ fontSize: '0.78rem', color: '#166534', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '4px', width: 'fit-content', marginTop: '4px', fontWeight: '600' }}>
                          📍 {serviceability.areaLimitNotice}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="house_building">House / Flat / Building / Floor *</label>
                  <input
                    type="text"
                    id="house_building"
                    name="house_building"
                    required
                    value={formData.house_building}
                    onChange={handleInputChange}
                    placeholder="Flat, House no., Building, Apartment"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="street">Street / Road / Colony *</label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    autoComplete="address-line1"
                    required
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder="Street address, Colony, Area"
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="area">Area / Locality *</label>
                    <input
                      type="text"
                      id="area"
                      name="area"
                      autoComplete="address-line2"
                      required
                      value={formData.area}
                      onChange={handleInputChange}
                      placeholder="Area / Locality / Sector"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="landmark">Landmark (Optional)</label>
                    <input
                      type="text"
                      id="landmark"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleInputChange}
                      placeholder="Nearby landmark (optional)"
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="city">City / District *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      autoComplete="address-level2"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="state">State *</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      autoComplete="address-level1"
                      required
                      value={formData.state}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Payment Method Selection */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-medium)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--cacao-950)', marginBottom: '16px' }}>
                  3. Select Payment Method
                </h3>

                {/* Direct Coupon Entry Inside Payment Section */}
                <div style={{
                  padding: '16px 20px',
                  backgroundColor: 'var(--cream-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-medium)',
                  marginBottom: '22px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag size={18} style={{ color: 'var(--peanut-gold-700)' }} />
                      <span style={{ fontWeight: '700', fontSize: '0.94rem', color: 'var(--cacao-950)' }}>
                        Apply Coupon Discount
                      </span>
                    </div>
                    {activeCoupon && (
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#047857', backgroundColor: '#D1FAE5', padding: '2px 8px', borderRadius: '4px' }}>
                        APPLIED
                      </span>
                    )}
                  </div>

                  {activeCoupon ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: '#ECFDF5',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #A7F3D0',
                      color: '#065F46',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🏷️ <strong>{activeCoupon.code}</strong> applied! Saved ₹{activeDiscount.toFixed(2)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger-color)',
                          fontSize: '0.84rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code (e.g. ILOVEMADHURAI)"
                        className="form-input"
                        style={{ flex: 1, textTransform: 'uppercase', fontSize: '0.9rem', padding: '10px 14px' }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponApplying || !couponInput.trim()}
                        className="btn btn-primary"
                        style={{ padding: '10px 20px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                      >
                        {couponApplying ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--danger-color)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={15} />
                      <span>{couponError}</span>
                    </div>
                  )}
                  {couponSuccess && !couponError && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--success-color)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={15} />
                      <span>{couponSuccess}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Dynamic UPI QR */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: paymentMethod === 'UPI_QR' ? '2px solid var(--peanut-gold-600)' : '1px solid var(--border-medium)',
                    backgroundColor: paymentMethod === 'UPI_QR' ? 'var(--peanut-gold-50)' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="UPI_QR"
                      checked={paymentMethod === 'UPI_QR'}
                      onChange={() => setPaymentMethod('UPI_QR')}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <QrCode size={20} style={{ color: 'var(--peanut-gold-700)' }} />
                        <strong style={{ color: 'var(--cacao-950)' }}>Dynamic UPI QR (Recommended)</strong>
                        <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>Fast & Zero Fee</span>
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                        Instant dynamic order QR code for Google Pay, PhonePe, Paytm, or BHIM.
                      </span>
                    </div>
                  </label>

                  {/* Cards & Net Banking */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: paymentMethod === 'CARD' ? '2px solid var(--peanut-gold-600)' : '1px solid var(--border-medium)',
                    backgroundColor: paymentMethod === 'CARD' ? 'var(--peanut-gold-50)' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="CARD"
                      checked={paymentMethod === 'CARD'}
                      onChange={() => setPaymentMethod('CARD')}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CreditCard size={20} style={{ color: 'var(--peanut-gold-700)' }} />
                        <strong style={{ color: 'var(--cacao-950)' }}>Debit / Credit Cards & Net Banking</strong>
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                        All major Indian banks, Visa, Mastercard, and RuPay supported.
                      </span>
                    </div>
                  </label>

                  {/* Cash on Delivery (COD) */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: paymentMethod === 'COD' ? '2px solid var(--peanut-gold-600)' : '1px solid var(--border-medium)',
                    backgroundColor: paymentMethod === 'COD' ? 'var(--peanut-gold-50)' : '#FFFFFF',
                    cursor: serviceability?.codAvailable ? 'pointer' : 'not-allowed',
                    opacity: serviceability?.codAvailable ? 1 : 0.6,
                    transition: 'var(--transition)'
                  }}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="COD"
                      disabled={!serviceability?.codAvailable}
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Banknote size={20} style={{ color: 'var(--peanut-gold-700)' }} />
                        <strong style={{ color: 'var(--cacao-950)' }}>Cash on Delivery (COD)</strong>
                        {!serviceability?.codAvailable && (
                          <span className="badge badge-red" style={{ fontSize: '0.68rem' }}>Unavailable</span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                        {serviceability?.codAvailable
                          ? 'Pay in cash when our delivery executive delivers your package.'
                          : (serviceability?.codReason || 'COD is not eligible for this pincode or order value.')}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

            </div>

            {/* Right Column: Order Summary & Placement */}
            <div style={{ position: 'sticky', top: '100px' }}>
              <div style={{ backgroundColor: '#FFFFFF', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border-medium)', boxShadow: 'var(--shadow-md)' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--cacao-950)', marginBottom: '18px' }}>
                  Review Order ({cartItems.length} items)
                </h3>

                {/* Items Mini List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
                  {cartItems.map(item => (
                    <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                      <span style={{ color: 'var(--cacao-950)' }}>
                        {item.name} <strong>× {item.quantity}</strong>
                      </span>
                      <span style={{ fontWeight: '700' }}>
                        ₹{item.selling_price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Direct Coupon Entry Inside Review Order Box */}
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--cream-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag size={16} style={{ color: 'var(--peanut-gold-700)' }} />
                      <span style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--cacao-950)' }}>
                        Have a Coupon Code?
                      </span>
                    </div>
                    {activeCoupon && (
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#047857', backgroundColor: '#D1FAE5', padding: '2px 6px', borderRadius: '4px' }}>
                        APPLIED
                      </span>
                    )}
                  </div>

                  {activeCoupon ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: '#ECFDF5',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #A7F3D0',
                      color: '#065F46',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🏷️ <strong>{activeCoupon.code}</strong> (-₹{activeDiscount.toFixed(0)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger-color)',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="form-input"
                        style={{ flex: 1, textTransform: 'uppercase', fontSize: '0.85rem', padding: '8px 10px' }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponApplying || !couponInput.trim()}
                        className="btn btn-primary"
                        style={{ padding: '8px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                      >
                        {couponApplying ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--danger-color)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={13} />
                      <span>{couponError}</span>
                    </div>
                  )}
                  {couponSuccess && !couponError && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--success-color)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={13} />
                      <span>{couponSuccess}</span>
                    </div>
                  )}
                </div>

                {/* Cost Breakdown */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.92rem', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Subtotal</span>
                    <span>₹{displaySubtotal.toFixed(0)}</span>
                  </div>

                  {activeDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-color)', fontWeight: '600' }}>
                      <span>Coupon Discount ({activeCoupon?.code || 'Applied'})</span>
                      <span>-₹{activeDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Shipping Fee</span>
                    <span>{isFreeDelivery ? <strong style={{ color: 'var(--success-color)' }}>FREE</strong> : `₹${deliveryFee}`}</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.35rem',
                    fontWeight: '800',
                    color: 'var(--cacao-950)',
                    borderTop: '2px solid var(--border-medium)',
                    paddingTop: '12px',
                    marginTop: '4px'
                  }}>
                    <span>Total Amount</span>
                    <span>
                      ₹{finalTotalDisplay.toFixed(2)}
                    </span>
                  </div>
                </div>

                {formError && (
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: '#FEE2E2', color: 'var(--danger-color)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '16px' }}>
                    {formError}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={orderSubmitting || checkingDelivery || !serviceability?.serviceable}
                  className="btn btn-gold btn-lg"
                  style={{ width: '100%', padding: '16px' }}
                >
                  {orderSubmitting ? 'Placing Order...' : paymentMethod === 'COD' ? 'Confirm Cash on Delivery Order' : 'Proceed to UPI / Card Payment'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '14px' }}>
                  <ShieldCheck size={16} style={{ color: 'var(--success-color)' }} />
                  <span>Authorized Merchant Checkout • Server Signature Enforced</span>
                </div>
              </div>
            </div>

          </div>
        </form>

        {/* Dynamic UPI QR Modal for Online Payments */}
        {upiModalOpen && createdOrder && paymentData && (
          <UPIQRModal
            order={createdOrder}
            paymentData={paymentData}
            onClose={() => setUpiModalOpen(false)}
            onSuccess={handlePaymentSuccess}
          />
        )}

      </div>
    </div>
  );
}
