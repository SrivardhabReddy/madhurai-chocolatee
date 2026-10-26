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
  Truck
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import UPIQRModal from '../components/UPIQRModal.jsx';

export default function Checkout({ onNavigate }) {
  const { cartItems, clearCart, deliveryPincode, setDeliveryPincode, appliedCoupon } = useCart();
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
      api.validateCart(cartItems, formData.pincode, appliedCoupon?.code || '')
        .then(res => {
          if (res.success && res.data) {
            setSummary(res.data);
          }
        })
        .finally(() => setLoadingSummary(false));
    }
  }, [cartItems, formData.pincode, appliedCoupon]);

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
      const activeCouponCode = appliedCoupon?.code ? String(appliedCoupon.code).trim().toUpperCase() : null;
      const orderPayload = {
        ...formData,
        items: cartItems.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        coupon_code: activeCouponCode,
        payment_method: paymentMethod
      };

      const orderRes = await api.createOrder(orderPayload);

      if (orderRes.success && orderRes.data) {
        const orderInfo = orderRes.data;

        // If Cash on Delivery, order is confirmed immediately!
        if (paymentMethod === 'COD') {
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

  const handlePaymentSuccess = () => {
    setUpiModalOpen(false);
    clearCart();
    onNavigate('order_success', { orderId: createdOrder.id });
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
                <h3 style={{ fontSize: '1.25rem', color: 'var(--cacao-950)', marginBottom: '20px' }}>
                  3. Select Payment Method
                </h3>

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

                {/* Cost Breakdown */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.92rem', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Subtotal</span>
                    <span>₹{summary?.subtotal || cartItems.reduce((acc, i) => acc + i.selling_price * i.quantity, 0)}</span>
                  </div>

                  {(summary?.discountAmount > 0 || (appliedCoupon && (appliedCoupon.discount_amount > 0 || appliedCoupon.discount > 0))) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-color)', fontWeight: '600' }}>
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span>-₹{(summary?.discountAmount || appliedCoupon?.discount_amount || appliedCoupon?.discount || 0).toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Shipping Fee</span>
                    <span>{summary?.delivery?.freeDelivery ? <strong style={{ color: 'var(--success-color)' }}>FREE</strong> : `₹${summary?.deliveryCharge || 40}`}</span>
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
                      ₹{summary?.finalTotal !== undefined 
                        ? Number(summary.finalTotal).toFixed(2)
                        : Math.max(0, (summary?.subtotal || cartItems.reduce((acc, i) => acc + i.selling_price * i.quantity, 0)) - (appliedCoupon?.discount_amount || appliedCoupon?.discount || 0) + (summary?.deliveryCharge || 40)).toFixed(2)}
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
