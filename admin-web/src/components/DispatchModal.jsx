import React, { useState, useEffect } from 'react';
import { X, Truck, Package, ExternalLink, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../services/adminApi.js';

const COURIER_PRESETS = [
  { name: 'DTDC', trkUrl: (no) => `https://www.dtdc.in/tracking/shipment-tracking.asp?trkType=AWB&strAvbNo=${encodeURIComponent(no)}` },
  { name: 'Delhivery', trkUrl: (no) => `https://www.delhivery.com/track/package/${encodeURIComponent(no)}` },
  { name: 'Blue Dart', trkUrl: (no) => `https://www.bluedart.com/tracking?trackNumber=${encodeURIComponent(no)}` },
  { name: 'Speed Post (India Post)', trkUrl: () => `https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx` },
  { name: 'Shadowfax', trkUrl: (no) => `https://tracker.shadowfax.in/#/track/${encodeURIComponent(no)}` },
  { name: 'Local Hub / Self Delivery', trkUrl: () => '' }
];

export default function DispatchModal({ order, onClose, onUpdated }) {
  const [orderStatus, setOrderStatus] = useState(order?.order_status || 'SHIPPED');
  const [courierName, setCourierName] = useState(order?.courier_name || 'DTDC');
  const [trackingNumber, setTrackingNumber] = useState(order?.tracking_number || '');
  const [trackingUrl, setTrackingUrl] = useState(order?.tracking_url || '');
  const [dispatchDate, setDispatchDate] = useState(
    order?.dispatch_date ? order.dispatch_date.slice(0, 16) : new Date().toISOString().slice(0, 16)
  );
  const [dispatchNotes, setDispatchNotes] = useState(order?.dispatch_notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-generate tracking URL when courier or tracking number changes
  const handleCourierSelect = (name) => {
    setCourierName(name);
    const preset = COURIER_PRESETS.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (preset && trackingNumber) {
      setTrackingUrl(preset.trkUrl(trackingNumber));
    }
  };

  const handleTrackingNumberChange = (num) => {
    setTrackingNumber(num);
    const preset = COURIER_PRESETS.find(c => c.name.toLowerCase() === courierName.toLowerCase());
    if (preset && num) {
      setTrackingUrl(preset.trkUrl(num));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!order?.id) return;

    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await adminApi.updateDispatch(order.id, {
        order_status: orderStatus,
        courier_name: courierName.trim(),
        tracking_number: trackingNumber.trim(),
        tracking_url: trackingUrl.trim(),
        dispatch_date: dispatchDate,
        dispatch_notes: dispatchNotes.trim()
      });

      if (res.success) {
        setSuccessMsg('Dispatch details updated successfully!');
        if (onUpdated) onUpdated(res.data);
        setTimeout(() => {
          if (onClose) onClose();
        }, 600);
      } else {
        setError(res.message || 'Failed to update dispatch details.');
      }
    } catch (err) {
      setError(err.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal-card" style={{ maxWidth: '640px', width: '94%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Truck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>
                Edit Dispatch & Shipping Logistics
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                Order <strong>{order?.order_number}</strong> • {order?.customer_name} ({order?.customer_phone})
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--admin-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Order Delivery Destination Snapshot */}
        <div style={{
          backgroundColor: '#F8FAFC',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          border: '1px solid var(--border-color)',
          fontSize: '0.82rem',
          color: 'var(--admin-text-main)',
          marginBottom: '20px'
        }}>
          <strong>Delivery Address: </strong>
          <span style={{ color: 'var(--admin-text-secondary)' }}>{order?.delivery_address} (Pincode: {order?.pincode})</span>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 1. Fulfillment Status */}
          <div style={{ marginBottom: '18px' }}>
            <label className="admin-label" style={{ fontWeight: '700' }}>Order Fulfillment Lifecycle Status *</label>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              className="admin-select"
              style={{ width: '100%', fontWeight: '600' }}
              required
            >
              <option value="PROCESSING">📦 PROCESSING (Preparing fresh batch in kitchen)</option>
              <option value="PACKED">🎁 PACKED (Sealed in temperature cold envelope)</option>
              <option value="SHIPPED">🚚 SHIPPED / DISPATCHED (Handed to courier partner)</option>
              <option value="OUT_FOR_DELIVERY">🛵 OUT FOR DELIVERY (With local delivery rider)</option>
              <option value="DELIVERED">✅ DELIVERED (Delivered to customer)</option>
              <option value="CANCELLED">❌ CANCELLED (Restock inventory)</option>
            </select>
          </div>

          {/* 2. Courier Selection with Quick Presets */}
          <div style={{ marginBottom: '18px' }}>
            <label className="admin-label" style={{ fontWeight: '700' }}>Courier Partner *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {COURIER_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleCourierSelect(preset.name)}
                  className={`btn-admin btn-admin-sm ${courierName === preset.name ? 'btn-admin-primary' : 'btn-admin-outline'}`}
                  style={{ fontSize: '0.78rem' }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              placeholder="e.g. DTDC, Blue Dart, Delhivery, Speed Post"
              className="admin-input"
              required
            />
          </div>

          {/* 3. Tracking Number / AWB */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
            <div>
              <label className="admin-label" style={{ fontWeight: '700' }}>Tracking / AWB Number</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => handleTrackingNumberChange(e.target.value)}
                placeholder="e.g. DT123456789IN"
                className="admin-input"
              />
            </div>

            <div>
              <label className="admin-label" style={{ fontWeight: '700' }}>Dispatch Date & Time</label>
              <input
                type="datetime-local"
                value={dispatchDate}
                onChange={(e) => setDispatchDate(e.target.value)}
                className="admin-input"
              />
            </div>
          </div>

          {/* 4. Tracking URL (Clickable) */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="admin-label" style={{ margin: 0, fontWeight: '700' }}>Direct Tracking URL</label>
              {trackingUrl && (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.75rem', color: 'var(--admin-accent)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>Test Link</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
            <input
              type="url"
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder="https://www.dtdc.in/tracking/shipment-tracking.asp?..."
              className="admin-input"
            />
          </div>

          {/* 5. Dispatch Notes */}
          <div style={{ marginBottom: '22px' }}>
            <label className="admin-label" style={{ fontWeight: '700' }}>Internal Dispatch Notes / Instructions</label>
            <textarea
              rows="2"
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              placeholder="e.g. Dispatched via Express Air in insulated cold pouch with fragile handling sticker"
              className="admin-textarea"
            />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: '#FEE2E2', color: '#B91C1C', fontSize: '0.84rem', fontWeight: '600', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '0.84rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-admin btn-admin-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-admin btn-admin-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Truck size={16} />
              <span>{saving ? 'Saving Dispatch...' : 'Save Dispatch Details'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
