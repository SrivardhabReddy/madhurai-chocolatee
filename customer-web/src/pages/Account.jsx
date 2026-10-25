import React, { useState, useEffect } from 'react';
import { User, Package, MapPin, Heart, Lock, LogOut, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { api } from '../services/api.js';
import ProductCard from '../components/ProductCard.jsx';

export default function Account({ onNavigate }) {
  const { user, logout, updateProfile } = useAuth();
  const { wishlist } = useCart();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'profile', 'addresses', 'wishlist'

  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || ''
  });
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password Form
  const [passForm, setPassForm] = useState({
    current_password: '',
    new_password: ''
  });
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // New Address Form Modal
  const [newAddrModal, setNewAddrModal] = useState(false);
  const [newAddr, setNewAddr] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    house_building: '',
    street: '',
    area: '',
    landmark: '',
    city: '',
    district: '',
    state: 'Andhra Pradesh',
    pincode: '',
    is_default: 1
  });

  useEffect(() => {
    if (!user) {
      onNavigate('login');
      return;
    }

    // Load orders
    api.getMyOrders()
      .then(res => {
        if (res.success) setOrders(res.data);
      })
      .finally(() => setLoadingOrders(false));

    // Load addresses
    api.getAddresses().then(res => {
      if (res.success) setAddresses(res.data);
    });
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    const res = await updateProfile(profileForm);
    if (res.success) {
      setProfileSuccess('Profile updated successfully.');
      setTimeout(() => setProfileSuccess(''), 3000);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    try {
      const res = await api.changePassword(passForm);
      if (res.success) {
        setPassSuccess('Password updated successfully.');
        setPassForm({ current_password: '', new_password: '' });
      } else {
        setPassError(res.message || 'Failed to change password.');
      }
    } catch (err) {
      setPassError(err.message || 'Current password incorrect.');
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await api.saveAddress(newAddr);
      if (res.success) {
        setNewAddrModal(false);
        const refetch = await api.getAddresses();
        if (refetch.success) setAddresses(refetch.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to save address.');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (window.confirm('Are you sure you want to remove this address?')) {
      await api.deleteAddress(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
    }
  };

  if (!user) return null;

  return (
    <div style={{ padding: '40px 0 80px', backgroundColor: 'var(--cream-50)', minHeight: '85vh' }}>
      <div className="container">
        
        {/* Account Header */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '32px',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--border-medium)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'var(--cacao-900)',
              color: 'var(--peanut-gold-300)',
              fontSize: '1.5rem',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--peanut-gold-500)'
            }}>
              {user.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.6rem', color: 'var(--cacao-950)', marginBottom: '2px' }}>{user.full_name}</h2>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{user.email} • {user.phone || 'No phone'}</span>
            </div>
          </div>

          <button
            onClick={() => { logout(); onNavigate('home'); }}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '28px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}>
          <button
            onClick={() => setActiveTab('orders')}
            className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          >
            <Package size={16} />
            <span>My Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          >
            <User size={16} />
            <span>Profile & Security</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`btn ${activeTab === 'addresses' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          >
            <MapPin size={16} />
            <span>Saved Addresses ({addresses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`btn ${activeTab === 'wishlist' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          >
            <Heart size={16} />
            <span>Wishlist ({wishlist.length})</span>
          </button>
        </div>

        {/* Tab Content 1: Orders */}
        {activeTab === 'orders' && (
          <div>
            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>Loading your orders...</div>
            ) : orders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orders.map(order => (
                  <div
                    key={order.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      padding: '24px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-medium)',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--cacao-950)' }}>{order.order_number}</strong>
                        <span className="badge badge-dark" style={{ fontSize: '0.75rem' }}>{order.order_status}</span>
                        <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>{order.payment_status}</span>
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Delivery to: {order.pincode} • {order.payment_method}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--cacao-950)' }}>
                        ₹{order.total_amount}
                      </div>
                      <button
                        onClick={() => onNavigate('order_detail', { orderId: order.id })}
                        className="btn btn-outline btn-sm"
                      >
                        <span>View Details</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ backgroundColor: '#FFFFFF', padding: '60px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <h3 style={{ color: 'var(--cacao-950)', marginBottom: '8px' }}>No orders placed yet</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Your chocolate cravings are waiting to be fulfilled!</p>
                <button onClick={() => onNavigate('products')} className="btn btn-primary">Start Shopping</button>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Profile & Password */}
        {activeTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
            {/* Edit Profile */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--cacao-950)', marginBottom: '20px' }}>Personal Profile</h3>
              
              {profileSuccess && (
                <div style={{ padding: '10px', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  {profileSuccess}
                </div>
              )}

              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address (Read Only)</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="form-input"
                    style={{ backgroundColor: 'var(--cream-100)', opacity: 0.7 }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                  Save Profile Changes
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--cacao-950)', marginBottom: '20px' }}>Security & Password</h3>

              {passError && (
                <div style={{ padding: '10px', backgroundColor: '#FEE2E2', color: 'var(--danger-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  {passError}
                </div>
              )}
              {passSuccess && (
                <div style={{ padding: '10px', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  {passSuccess}
                </div>
              )}

              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passForm.current_password}
                    onChange={(e) => setPassForm({ ...passForm, current_password: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password (min 6 characters)</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passForm.new_password}
                    onChange={(e) => setPassForm({ ...passForm, new_password: e.target.value })}
                    className="form-input"
                  />
                </div>

                <button type="submit" className="btn btn-gold" style={{ marginTop: '10px' }}>
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab Content 3: Saved Addresses */}
        {activeTab === 'addresses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--cacao-950)' }}>Delivery Addresses</h3>
              <button onClick={() => setNewAddrModal(true)} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} />
                <span>Add New Address</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {addresses.map(addr => (
                <div key={addr.id} style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', position: 'relative' }}>
                  {addr.is_default === 1 && (
                    <span className="badge badge-gold" style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '0.68rem' }}>Default</span>
                  )}
                  <h4 style={{ color: 'var(--cacao-950)', marginBottom: '6px' }}>{addr.full_name}</h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
                    {addr.house_building}, {addr.street}<br />
                    {addr.area}, {addr.city}, {addr.state} - <strong>{addr.pincode}</strong><br />
                    Phone: {addr.phone}
                  </p>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    style={{ color: 'var(--danger-color)', fontSize: '0.82rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={14} />
                    <span>Delete Address</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Modal for adding address */}
            {newAddrModal && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: 'var(--radius-lg)', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                  <h3 style={{ marginBottom: '18px', color: 'var(--cacao-950)' }}>Add Delivery Address</h3>
                  <form onSubmit={handleSaveAddress}>
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input type="text" required value={newAddr.full_name} onChange={(e) => setNewAddr({ ...newAddr, full_name: e.target.value })} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mobile Number *</label>
                      <input type="tel" required value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Pincode *</label>
                      <input type="text" maxLength={6} required value={newAddr.pincode} onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">House / Flat / Building *</label>
                      <input type="text" required value={newAddr.house_building} onChange={(e) => setNewAddr({ ...newAddr, house_building: e.target.value })} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Street / Colony *</label>
                      <input type="text" required value={newAddr.street} onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Area / Locality *</label>
                      <input type="text" required value={newAddr.area} onChange={(e) => setNewAddr({ ...newAddr, area: e.target.value })} className="form-input" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">City *</label>
                        <input type="text" required value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} className="form-input" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">State *</label>
                        <input type="text" required value={newAddr.state} onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })} className="form-input" />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Address</button>
                      <button type="button" onClick={() => setNewAddrModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 4: Wishlist */}
        {activeTab === 'wishlist' && (
          <div>
            {wishlist.length > 0 ? (
              <div className="product-grid">
                {wishlist.map(prod => (
                  <ProductCard key={prod.id} product={prod} onNavigate={onNavigate} />
                ))}
              </div>
            ) : (
              <div style={{ backgroundColor: '#FFFFFF', padding: '60px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <h3 style={{ color: 'var(--cacao-950)', marginBottom: '8px' }}>Your wishlist is empty</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Save your favorite peanut butter crunch boxes here!</p>
                <button onClick={() => onNavigate('products')} className="btn btn-primary">Browse Chocolates</button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
