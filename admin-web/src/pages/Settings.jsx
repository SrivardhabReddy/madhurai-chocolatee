import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

export default function Settings() {
  const [settings, setSettings] = useState({
    business_name: 'Madhurai Chocolate',
    tagline: 'Artisanal Peanut Butter Crunch & Rich Indian Cocoa',
    support_phone: '+91 96768 23113',
    support_email: 'madhuraicompany@gmail.com',
    headquarters_address: 'Gudur, Andhra Pradesh 524101, India',
    gstin: '',
    fssai_license: '2018 2629000442',
    payment_gateway_provider: 'CASHFREE',
    payment_mode: 'SANDBOX',
    payment_merchant_id: 'MADHURAI_01',
    payment_upi_vpa: '9676823113-2@ybl',
    upi_vpa: '9676823113-2@ybl',
    default_delivery_fee: '40',
    free_delivery_threshold: '500',
    cod_enabled: '1',
    cod_min_order: '100',
    cod_max_order: '3000',
    notify_order_confirmed: '1',
    notify_admin_email: 'madhuraicompany@gmail.com'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('business');

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getBusinessSettings();
      if (res.success && res.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data,
          upi_vpa: res.data.upi_vpa || res.data.payment_upi_vpa || prev.upi_vpa,
          payment_upi_vpa: res.data.upi_vpa || res.data.payment_upi_vpa || prev.payment_upi_vpa
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key, val) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await adminApi.updateBusinessSettings(settings);
      if (res.success) {
        setSuccess('Business settings updated successfully and persisted to database.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>
            Store Configuration & Settings
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Control brand identity, legal compliance (GST/FSSAI), payment gateway credentials, and delivery thresholds without code changes
          </p>
        </div>
      </div>

      {error && <div className="admin-alert admin-alert-danger">{error}</div>}
      {success && <div className="admin-alert admin-alert-success">{success}</div>}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        {[
          { id: 'business', label: '🏢 Business & Legal' },
          { id: 'payment', label: '💳 Payment & UPI Gateway' },
          { id: 'delivery', label: '🚚 Delivery & COD' },
          { id: 'notifications', label: '🔔 Notifications & Alerts' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`admin-btn ${activeTab === tab.id ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            style={{ fontSize: '13px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-card" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading configuration parameters...
        </div>
      ) : (
        <form onSubmit={handleSave}>
          {activeTab === 'business' && (
            <div className="admin-card">
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '20px' }}>
                Business Profile & Legal Accreditations
              </h2>

              <div className="admin-grid-2">
                <div className="admin-form-group">
                  <label className="admin-label">Business Name</label>
                  <input
                    type="text"
                    required
                    className="admin-input"
                    value={settings.business_name || ''}
                    onChange={(e) => handleChange('business_name', e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Brand Tagline</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={settings.tagline || ''}
                    onChange={(e) => handleChange('tagline', e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-grid-2">
                <div className="admin-form-group">
                  <label className="admin-label">Customer Support Phone</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={settings.support_phone || ''}
                    onChange={(e) => handleChange('support_phone', e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Customer Support Email</label>
                  <input
                    type="email"
                    className="admin-input"
                    value={settings.support_email || ''}
                    onChange={(e) => handleChange('support_email', e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Headquarters / Factory Address</label>
                <textarea
                  rows={2}
                  className="admin-input"
                  value={settings.headquarters_address || ''}
                  onChange={(e) => handleChange('headquarters_address', e.target.value)}
                />
              </div>

              <div className="admin-grid-2">
                <div className="admin-form-group">
                  <label className="admin-label">GST Identification Number (GSTIN)</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Not Applicable (No GST)"
                    value={settings.gstin || ''}
                    onChange={(e) => handleChange('gstin', e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">FSSAI Food License Number</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Enter 14-digit FSSAI License Number"
                    value={settings.fssai_license || ''}
                    onChange={(e) => handleChange('fssai_license', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="admin-card">
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '20px' }}>
                Payment Gateway & Dynamic NPCI UPI QR Configuration
              </h2>

              <div className="admin-grid-2">
                <div className="admin-form-group">
                  <label className="admin-label">Payment Gateway Adapter</label>
                  <select
                    className="admin-select"
                    value={settings.payment_gateway_provider || 'CASHFREE'}
                    onChange={(e) => handleChange('payment_gateway_provider', e.target.value)}
                  >
                    <option value="CASHFREE">Cashfree Payments (UPI QR / Intent)</option>
                    <option value="RAZORPAY">Razorpay</option>
                    <option value="PHONEPE">PhonePe PG</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Gateway Environment Mode</label>
                  <select
                    className="admin-select"
                    value={settings.payment_mode || 'SANDBOX'}
                    onChange={(e) => handleChange('payment_mode', e.target.value)}
                  >
                    <option value="SANDBOX">Sandbox / Testing (Simulated Webhooks)</option>
                    <option value="PRODUCTION">Production / Live</option>
                  </select>
                </div>
              </div>

              <div className="admin-grid-2">
                <div className="admin-form-group">
                  <label className="admin-label">Merchant ID / App ID</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={settings.payment_merchant_id || ''}
                    onChange={(e) => handleChange('payment_merchant_id', e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Business UPI VPA (for NPCI QR Intent)</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. 9676823113-2@ybl"
                    value={settings.upi_vpa || settings.payment_upi_vpa || ''}
                    onChange={(e) => {
                      handleChange('upi_vpa', e.target.value);
                      handleChange('payment_upi_vpa', e.target.value);
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Used for generating order-specific dynamic QR codes with exact transaction amount and reference.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="admin-card">
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '20px' }}>
                Global Delivery Standards & Cash on Delivery (COD) Safeguards
              </h2>

              <div className="admin-grid-2">
                <div className="admin-form-group">
                  <label className="admin-label">Default Delivery Fee (₹)</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={settings.default_delivery_fee || '40'}
                    onChange={(e) => handleChange('default_delivery_fee', e.target.value)}
                  />
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Applies when no higher-priority pincode, zone or quantity rules match.
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Free Delivery Threshold (₹)</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={settings.free_delivery_threshold || '500'}
                    onChange={(e) => handleChange('free_delivery_threshold', e.target.value)}
                  />
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Cart subtotal above which shipping becomes complimentary.
                  </div>
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Enable Cash on Delivery (COD)?</label>
                <select
                  className="admin-select"
                  value={settings.cod_enabled || '1'}
                  onChange={(e) => handleChange('cod_enabled', e.target.value)}
                >
                  <option value="1">Enabled across serviceable pincodes</option>
                  <option value="0">Disabled entirely (Prepaid Only)</option>
                </select>
              </div>

              <div className="admin-grid-2">
                <div className="admin-form-group">
                  <label className="admin-label">Minimum Order for COD (₹)</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={settings.cod_min_order || '100'}
                    onChange={(e) => handleChange('cod_min_order', e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Maximum Order for COD (₹)</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={settings.cod_max_order || '3000'}
                    onChange={(e) => handleChange('cod_max_order', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="admin-card">
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '20px' }}>
                Transactional Alerts & Dispatch Notifications
              </h2>

              <div className="admin-form-group">
                <label className="admin-label">Send Customer Email on Order Confirmation?</label>
                <select
                  className="admin-select"
                  value={settings.notify_order_confirmed || '1'}
                  onChange={(e) => handleChange('notify_order_confirmed', e.target.value)}
                >
                  <option value="1">Yes (Trigger automated email receipt)</option>
                  <option value="0">No (Disabled)</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Internal Ops Notification Email</label>
                <input
                  type="email"
                  className="admin-input"
                  value={settings.notify_admin_email || 'madhuraicompany@gmail.com'}
                  onChange={(e) => handleChange('notify_admin_email', e.target.value)}
                />
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Receives live notifications whenever a customer places an order.
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={saving}
              style={{ padding: '12px 28px', fontSize: '15px' }}
            >
              {saving ? 'Saving Changes...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
