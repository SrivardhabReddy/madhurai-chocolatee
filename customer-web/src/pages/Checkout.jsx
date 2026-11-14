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
  Tag,
  User,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import DeliveryLocationPicker from '../components/DeliveryLocationPicker.jsx';

export default function Checkout({ onNavigate }) {
  const { cartItems, clearCart, deliveryPincode, setDeliveryPincode, appliedCoupon, setAppliedCoupon, removeCoupon } = useCart();
  const { user, login, register } = useAuth();

  // Quick Inline Checkout Auth State
  const [authTab, setAuthTab] = useState('LOGIN'); // 'LOGIN' | 'REGISTER'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

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
  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY'); // 'RAZORPAY' | 'COD'
  
  // Serviceability State
  const [serviceability, setServiceability] = useState(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');

  // Cart Recalculation State
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

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

  // Sync customer contact details when user signs in or registers
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customer_name: user.full_name || prev.customer_name,
        customer_email: user.email || prev.customer_email,
        customer_phone: user.phone || prev.customer_phone
      }));
    }
  }, [user]);

  const handleCheckoutLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    if (!authEmail.trim() || !authPassword) {
      setAuthError('Please enter both email and password.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await login(authEmail.trim().toLowerCase(), authPassword);
      if (res && res.success) {
        setAuthSuccess('✓ Signed in successfully!');
        setFormError('');
      } else {
        setAuthError(res?.message || 'Invalid email or password.');
      }
    } catch (err) {
      setAuthError(err?.data?.message || err?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCheckoutRegister = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    if (!authName.trim() || !authPhone.trim() || !authEmail.trim() || !authPassword) {
      setAuthError('Please fill in your name, mobile number, email, and password.');
      return;
    }
    if (authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await register({
        full_name: authName.trim(),
        phone: authPhone.trim(),
        email: authEmail.trim().toLowerCase(),
        password: authPassword
      });
      if (res && res.success) {
        setAuthSuccess('✓ Account registered successfully!');
        setFormError('');
      } else {
        setAuthError(res?.message || 'Registration failed.');
      }
    } catch (err) {
      setAuthError(err?.data?.message || err?.message || 'Registration failed. This email may already be in use.');
    } finally {
      setAuthLoading(false);
    }
  };

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

    // Customer must be signed in to process order and payment
    if (!user) {
      setFormError('🔒 Please sign in or create an account at Step 1 to process your order and payment.');
      const contactSection = document.getElementById('step-contact-auth');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

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

        // For Online Payments: Launch official Razorpay Checkout SDK
        const payRes = await api.createPayment(orderInfo.orderId, 'RAZORPAY', orderInfo.totalAmount || finalTotalDisplay);
        if (payRes.success && payRes.data) {
          const pData = payRes.data;

          const launchRazorpayModal = () => {
            const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || pData.key_id || pData.keyId;
            const razorpayOrderId = pData.order_id || pData.razorpayOrderId;

            const options = {
              key: razorpayKey,
              amount: pData.amount, // amount in paise
              currency: pData.currency || 'INR',
              name: 'Madhurai Chocolate',
              description: `Artisanal Box Order #${pData.orderNumber || orderInfo.orderNumber}`,
              image: '/favicon.svg',
              order_id: razorpayOrderId,
              handler: async function (response) {
                try {
                  setOrderSubmitting(true);
                  const verifyRes = await api.verifyPayment({
                    order_id: response.razorpay_order_id,
                    payment_id: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                  });

                  if (verifyRes.success) {
                    clearCart();
                    onNavigate('order_success', { orderId: orderInfo.orderId });
                  } else {
                    setFormError(verifyRes.message || 'Payment verification failed. Please contact support.');
                  }
                } catch (vErr) {
                  setFormError(vErr.message || 'Payment signature verification failed.');
                } finally {
                  setOrderSubmitting(false);
                }
              },
              prefill: {
                name: formData.customer_name || pData.customerName || '',
                email: formData.customer_email || pData.customerEmail || '',
                contact: formData.customer_phone || pData.customerPhone || ''
              },
              notes: {
                order_id: String(orderInfo.orderId),
                order_number: String(orderInfo.orderNumber || ''),
                pincode: formData.pincode
              },
              theme: {
                color: '#2D150B' // Rich dark cacao brown
              },
              modal: {
                ondismiss: function () {
                  setOrderSubmitting(false);
                }
              }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (resp) {
              setFormError(`Payment failed: ${resp.error?.description || resp.error?.reason || 'Transaction could not be completed'}`);
              setOrderSubmitting(false);
            });
            rzp.open();
          };

          if (window.Razorpay) {
            launchRazorpayModal();
          } else {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = launchRazorpayModal;
            script.onerror = () => {
              setFormError('Unable to load Razorpay payment gateway. Please check your connection.');
              setOrderSubmitting(false);
            };
            document.body.appendChild(script);
          }
        } else {
          setFormError('Order created, but payment initialization failed. Please contact support.');
          setOrderSubmitting(false);
        }
      } else {
        setFormError(orderRes.message || 'Could not place order. Please review your details.');
        setOrderSubmitting(false);
      }
    } catch (err) {
      setFormError(err.message || 'Error communicating with server.');
      setOrderSubmitting(false);
    }
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
              
              {/* Step 1: Customer Account & Sign In Requirement */}
              <div id="step-contact-auth" style={{ backgroundColor: '#FFFFFF', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-medium)', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
                {!user ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309', flexShrink: 0 }}>
                        <Lock size={20} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', color: 'var(--cacao-950)', margin: '0 0 2px 0' }}>
                          1. Sign In to Complete Your Order
                        </h3>
                        <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                          Please sign in or register to complete checkout, save delivery address, and proceed to payment
                        </span>
                      </div>
                    </div>

                    {/* Tab Switcher */}
                    <div style={{ display: 'flex', gap: '8px', margin: '20px 0 16px 0', borderBottom: '1.5px solid var(--border-medium)', paddingBottom: '12px' }}>
                      <button
                        type="button"
                        onClick={() => { setAuthTab('LOGIN'); setAuthError(''); setAuthSuccess(''); }}
                        style={{
                          padding: '8px 18px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.86rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: authTab === 'LOGIN' ? 'var(--cacao-950)' : '#F1F5F9',
                          color: authTab === 'LOGIN' ? '#FFFFFF' : 'var(--text-secondary)',
                          transition: 'var(--transition)'
                        }}
                      >
                        Sign In (Existing Customer)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAuthTab('REGISTER'); setAuthError(''); setAuthSuccess(''); }}
                        style={{
                          padding: '8px 18px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.86rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: authTab === 'REGISTER' ? 'var(--cacao-950)' : '#F1F5F9',
                          color: authTab === 'REGISTER' ? '#FFFFFF' : 'var(--text-secondary)',
                          transition: 'var(--transition)'
                        }}
                      >
                        Create New Account
                      </button>
                    </div>

                    {authError && (
                      <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: '#FEE2E2', color: 'var(--danger-color)', fontSize: '0.84rem', fontWeight: '600', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={16} />
                        <span>{authError}</span>
                      </div>
                    )}

                    {authSuccess && (
                      <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: '#DCFCE7', color: '#15803D', fontSize: '0.84rem', fontWeight: '600', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={16} />
                        <span>{authSuccess}</span>
                      </div>
                    )}

                    {authTab === 'LOGIN' ? (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.82rem' }}>Email Address *</label>
                            <input
                              type="email"
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              placeholder="Enter your email"
                              className="form-input"
                            />
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: '4px' }}>Password *</label>
                              <button
                                type="button"
                                onClick={() => onNavigate('forgot_password')}
                                style={{ fontSize: '0.74rem', color: 'var(--peanut-gold-700)', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                              >
                                Forgot?
                              </button>
                            </div>
                            <div style={{ position: 'relative' }}>
                              <input
                                type={showAuthPassword ? 'text' : 'password'}
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                placeholder="••••••••"
                                className="form-input"
                                style={{ paddingRight: '40px' }}
                              />
                              <button
                                type="button"
                                onClick={() => setShowAuthPassword(!showAuthPassword)}
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                              >
                                {showAuthPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleCheckoutLogin}
                          disabled={authLoading}
                          className="btn btn-primary"
                          style={{ width: '100%', padding: '12px', fontWeight: '700' }}
                        >
                          {authLoading ? 'Signing In...' : 'Sign In to Proceed with Checkout'}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '12px' }}>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.82rem' }}>Full Name *</label>
                            <input
                              type="text"
                              value={authName}
                              onChange={(e) => setAuthName(e.target.value)}
                              placeholder="e.g. Sri Vardhan"
                              className="form-input"
                            />
                          </div>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.82rem' }}>Mobile Number *</label>
                            <input
                              type="tel"
                              maxLength={10}
                              value={authPhone}
                              onChange={(e) => setAuthPhone(e.target.value)}
                              placeholder="10-digit mobile number"
                              className="form-input"
                            />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.82rem' }}>Email Address *</label>
                            <input
                              type="email"
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              placeholder="For order tracking & receipt"
                              className="form-input"
                            />
                          </div>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.82rem' }}>Create Password *</label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type={showAuthPassword ? 'text' : 'password'}
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                className="form-input"
                                style={{ paddingRight: '40px' }}
                              />
                              <button
                                type="button"
                                onClick={() => setShowAuthPassword(!showAuthPassword)}
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                              >
                                {showAuthPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleCheckoutRegister}
                          disabled={authLoading}
                          className="btn btn-primary"
                          style={{ width: '100%', padding: '12px', fontWeight: '700' }}
                        >
                          {authLoading ? 'Creating Account...' : 'Register Account & Continue'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D' }}>
                          <CheckCircle size={18} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.25rem', color: 'var(--cacao-950)', margin: 0 }}>
                            1. Contact Information
                          </h3>
                          <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '600' }}>
                            ✓ Signed in as {user.full_name || 'Customer'} ({user.email})
                          </span>
                        </div>
                      </div>
                    </div>

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
                )}
              </div>

              {/* Step 2: Shipping Address & Interactive GPS Location Mapping */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-medium)', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--cacao-950)', margin: 0 }}>
                    2. Delivery Address
                  </h3>
                  {user && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--peanut-gold-700)', fontWeight: '600' }}>
                      Logged in as {user.full_name}
                    </span>
                  )}
                </div>

                {/* Live GPS Detection and Manual Pin on Interactive Map */}
                <DeliveryLocationPicker
                  currentPincode={formData.pincode}
                  initialCity={formData.city}
                  onLocationSelect={(loc) => {
                    setFormData(prev => ({
                      ...prev,
                      pincode: loc.pincode || prev.pincode,
                      city: loc.city || prev.city,
                      district: loc.district || prev.district || loc.city,
                      state: loc.state || prev.state,
                      area: loc.area ? `${loc.area}` : prev.area,
                      street: loc.street ? `${loc.street}` : prev.street,
                      house_building: loc.house_building || prev.house_building
                    }));
                    if (loc.pincode) {
                      setDeliveryPincode(loc.pincode);
                    }
                  }}
                />

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
                  {/* Razorpay Secure Checkout */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '18px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: paymentMethod === 'RAZORPAY' ? '2px solid var(--peanut-gold-600)' : '1px solid var(--border-medium)',
                    backgroundColor: paymentMethod === 'RAZORPAY' ? 'var(--peanut-gold-50)' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="RAZORPAY"
                      checked={paymentMethod === 'RAZORPAY'}
                      onChange={() => setPaymentMethod('RAZORPAY')}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <CreditCard size={20} style={{ color: 'var(--peanut-gold-700)' }} />
                        <strong style={{ color: 'var(--cacao-950)' }}>Razorpay Secure Payment (UPI, Cards, NetBanking, Wallets)</strong>
                        <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>Instant & 100% Safe</span>
                      </div>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                        Pay using Google Pay, PhonePe, Paytm, CRED, BHIM UPI, Visa, Mastercard, RuPay, or Net Banking.
                      </span>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', padding: '3px 8px', background: '#F1F5F9', borderRadius: '4px', color: '#334155', fontWeight: '700' }}>⚡ UPI / QR</span>
                        <span style={{ fontSize: '0.72rem', padding: '3px 8px', background: '#F1F5F9', borderRadius: '4px', color: '#334155', fontWeight: '700' }}>Google Pay</span>
                        <span style={{ fontSize: '0.72rem', padding: '3px 8px', background: '#F1F5F9', borderRadius: '4px', color: '#334155', fontWeight: '700' }}>PhonePe</span>
                        <span style={{ fontSize: '0.72rem', padding: '3px 8px', background: '#F1F5F9', borderRadius: '4px', color: '#334155', fontWeight: '700' }}>Paytm</span>
                        <span style={{ fontSize: '0.72rem', padding: '3px 8px', background: '#F1F5F9', borderRadius: '4px', color: '#334155', fontWeight: '700' }}>Credit / Debit Cards</span>
                        <span style={{ fontSize: '0.72rem', padding: '3px 8px', background: '#F1F5F9', borderRadius: '4px', color: '#334155', fontWeight: '700' }}>Net Banking</span>
                      </div>
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

                {!user && (
                  <div style={{
                    padding: '12px 14px',
                    backgroundColor: '#FFFBEB',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #FDE68A',
                    color: '#92400E',
                    fontSize: '0.84rem',
                    fontWeight: '600',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Lock size={16} color="#D97706" />
                    <span>Please sign in or create an account at Step 1 to process your order and payment.</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={orderSubmitting || (user && (checkingDelivery || !serviceability?.serviceable))}
                  className="btn btn-gold btn-lg"
                  style={{ width: '100%', padding: '16px' }}
                >
                  {orderSubmitting 
                    ? 'Processing...' 
                    : !user
                      ? '🔒 Sign In to Complete Order & Payment'
                      : paymentMethod === 'COD' 
                        ? 'Confirm Cash on Delivery Order' 
                        : `Pay ₹${finalTotalDisplay.toFixed(2)} with Razorpay`}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '14px' }}>
                  <ShieldCheck size={16} style={{ color: 'var(--success-color)' }} />
                  <span>Razorpay PCI-DSS Level 1 Encrypted • 256-Bit SSL Secured</span>
                </div>
              </div>
            </div>

          </div>
        </form>

      </div>
    </div>
  );
}
