import React, { useState } from 'react';
import { MapPin, CheckCircle, XCircle, Truck, Clock } from 'lucide-react';
import { api } from '../services/api.js';
import { useCart } from '../context/CartContext.jsx';

export default function DeliveryChecker({ product, onServiceableChange }) {
  const { deliveryPincode, setDeliveryPincode } = useCart();
  const [pincode, setPincode] = useState(deliveryPincode || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [areaLimit, setAreaLimit] = useState(null);

  React.useEffect(() => {
    api.getDeliveryAreaLimit()
      .then(res => {
        if (res.success && res.data) setAreaLimit(res.data);
      })
      .catch(() => {});
  }, []);

  const handleCheck = async (e) => {
    if (e) e.preventDefault();
    if (!pincode || pincode.trim().length !== 6) {
      setError('Please enter a valid 6-digit Indian pincode.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const items = product ? [{ product_id: product.id, quantity: 1, selling_price: product.selling_price }] : [];
      const res = await api.checkDelivery(pincode.trim(), items, product?.selling_price || 0);

      if (res.success && res.data) {
        setResult(res.data);
        setDeliveryPincode(pincode.trim());
        if (onServiceableChange) {
          onServiceableChange(res.data);
        }
      } else {
        setError(res.message || 'Unable to check delivery at this moment.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to delivery service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--cream-100)', padding: '18px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', fontWeight: '700', color: 'var(--cacao-950)' }}>
          <MapPin size={18} style={{ color: 'var(--peanut-gold-600)' }} />
          <span>Check Delivery Availability & Estimated Time</span>
        </div>
        {areaLimit?.active && (
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--cacao-900)', backgroundColor: 'var(--peanut-gold-200)', padding: '2px 8px', borderRadius: '12px' }}>
            📍 Delivering Upto: {areaLimit.limitCity}
          </span>
        )}
      </div>

      <form onSubmit={handleCheck} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
        <input
          type="text"
          placeholder="Enter 6-digit delivery pincode"
          value={pincode}
          maxLength={6}
          onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--border-medium)',
            fontSize: '0.92rem',
            outline: 'none',
            backgroundColor: '#FFFFFF'
          }}
        />
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-sm"
          style={{ minWidth: '90px' }}
        >
          {loading ? 'Checking...' : 'CHECK'}
        </button>
      </form>

      {/* Quick pincode chips */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Quick try:</span>
        <button
          type="button"
          onClick={() => { setPincode('524101'); }}
          style={{ fontSize: '0.72rem', background: '#FFFFFF', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', color: 'var(--cacao-850)', fontWeight: '600' }}
        >
          📍 Gudur (524101)
        </button>
        <button
          type="button"
          onClick={() => { setPincode('524001'); }}
          style={{ fontSize: '0.72rem', background: '#FFFFFF', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', color: 'var(--cacao-850)' }}
        >
          Nellore (524001)
        </button>
        <button
          type="button"
          onClick={() => { setPincode('517501'); }}
          style={{ fontSize: '0.72rem', background: '#FFFFFF', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', color: 'var(--cacao-850)' }}
        >
          Tirupati (517501)
        </button>
        <button
          type="button"
          onClick={() => { setPincode('600001'); }}
          style={{ fontSize: '0.72rem', background: '#FFFFFF', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', color: 'var(--cacao-850)' }}
        >
          Chennai (600001)
        </button>
      </div>

      {error && (
        <div style={{ fontSize: '0.84rem', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
          <XCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '12px', fontSize: '0.88rem' }}>
          {result.serviceable ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--cacao-900)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-color)', fontWeight: '700' }}>
                <CheckCircle size={18} />
                <span>Delivery Available to {result.city}, {result.state} ({result.pincode})</span>
              </div>
              {result.areaLimitNotice && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#166534', backgroundColor: '#DCFCE7', padding: '4px 10px', borderRadius: '6px', width: 'fit-content' }}>
                  <span>📍 {result.areaLimitNotice}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <Clock size={16} style={{ color: 'var(--peanut-gold-700)' }} />
                <span>Estimated Delivery: <strong>{result.estimatedMinDays}–{result.estimatedMaxDays} business days</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <Truck size={16} style={{ color: 'var(--peanut-gold-700)' }} />
                <span>Delivery Charge: <strong>{result.freeDelivery ? 'FREE' : `₹${result.deliveryCharge}`}</strong></span>
              </div>
              {result.codAvailable ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-color)' }}>
                  <CheckCircle size={16} />
                  <span>Cash on Delivery (COD) Available</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning-color)' }}>
                  <XCircle size={16} />
                  <span>Online Payment Only (COD unavailable)</span>
                </div>
              )}
              {result.freeDeliveryReason && (
                <div style={{ backgroundColor: 'var(--peanut-gold-100)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--peanut-gold-700)', fontWeight: '600', fontSize: '0.8rem', marginTop: '4px' }}>
                  🎉 {result.freeDeliveryReason}
                </div>
              )}
            </div>
          ) : (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', padding: '10px 14px', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger-color)', fontWeight: '700' }}>
                <XCircle size={18} />
                <span>{result.reason || 'Sorry, we currently do not deliver to this location.'}</span>
              </div>
              {result.areaLimitNotice && (
                <div style={{ fontSize: '0.78rem', color: '#991B1B', marginTop: '4px' }}>
                  {result.areaLimitNotice}. Deliveries to other regions will open soon!
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
