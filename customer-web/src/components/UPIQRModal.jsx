import React, { useState, useEffect } from 'react';
import { X, Copy, Check, QrCode, ShieldCheck, ArrowRight, Smartphone, Sparkles } from 'lucide-react';
import { api } from '../services/api.js';

export default function UPIQRModal({ order, paymentData, onClose, onSuccess }) {
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState('');

  const copyVpa = () => {
    const vpa = paymentData?.upiVpa || '9676823113-2@ybl';
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(vpa);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = vpa;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
  };

  // Automatic background status polling to detect completed payment
  useEffect(() => {
    let interval;
    if (order?.id) {
      interval = setInterval(async () => {
        try {
          const res = await api.getOrderById(order.id);
          if (res?.success && res?.data?.payment_status === 'PAID') {
            clearInterval(interval);
            setSimulationStatus('Payment confirmed! Closing window...');
            setTimeout(() => {
              if (onClose) onClose();
              if (onSuccess) onSuccess(res.data);
            }, 600);
          }
        } catch (e) {
          // ignore polling errors
        }
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [order?.id, onClose, onSuccess]);

  const handleSimulatePayment = async () => {
    if (!order?.id) return;
    setVerifying(true);
    setSimulationStatus('Verifying payment on server...');
    try {
      const res = await api.simulatePaymentSuccess(order.id, paymentData?.paymentId);
      if (res.success) {
        setSimulationStatus('Payment captured and verified! Closing window...');
        setTimeout(() => {
          if (onClose) onClose();
          if (onSuccess) onSuccess(res.data || res);
        }, 700);
      } else {
        setSimulationStatus(res.message || 'Payment verification failed.');
        setVerifying(false);
      }
    } catch (err) {
      setSimulationStatus(err.message || 'Verification error.');
      setVerifying(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(18, 9, 5, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-xl)',
        maxWidth: '460px',
        width: '100%',
        padding: '32px',
        position: 'relative',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
        border: '1.5px solid var(--border-medium)',
        textAlign: 'center'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            color: 'var(--text-muted)',
            padding: '4px'
          }}
        >
          <X size={22} />
        </button>

        {/* Header */}
        <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '50%', backgroundColor: 'var(--peanut-gold-100)', color: 'var(--peanut-gold-700)', marginBottom: '12px' }}>
          <QrCode size={30} />
        </div>
        <h3 style={{ fontSize: '1.4rem', color: 'var(--cacao-950)', marginBottom: '6px' }}>
          Scan to Pay with UPI
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Order <strong>{order?.order_number || 'Order'}</strong> • Amount: <strong style={{ color: 'var(--cacao-950)', fontSize: '1.1rem' }}>₹{paymentData?.amount || order?.total_amount || 0}</strong>
        </p>

        {/* Dynamic QR Code */}
        <div style={{
          display: 'inline-block',
          padding: '16px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 30px rgba(44, 23, 14, 0.12)',
          border: '2px solid var(--peanut-gold-400)',
          marginBottom: '20px'
        }}>
          {paymentData?.qrDataUrl ? (
            <img
              src={paymentData.qrDataUrl}
              alt="Dynamic UPI Payment QR"
              style={{ width: '220px', height: '220px', display: 'block', borderRadius: '8px' }}
            />
          ) : (
            <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Generating QR...
            </div>
          )}
        </div>

        {/* Supported Apps Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>Google Pay</span>
          <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>PhonePe</span>
          <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>Paytm</span>
          <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>BHIM UPI</span>
          <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>Any Banking App</span>
        </div>

        {/* Mobile Direct Pay Action if on phone */}
        {paymentData?.upiQrString && (
          <div style={{ marginBottom: '14px' }}>
            <a
              href={paymentData.upiQrString}
              className="btn btn-gold"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px 16px',
                fontSize: '0.88rem',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none'
              }}
            >
              <Smartphone size={16} />
              <span>Tap to Open UPI App Directly (Mobile)</span>
            </a>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              ℹ️ When scanning from another phone, open your <strong>Google Pay / PhonePe</strong> app scanner directly.
            </p>
          </div>
        )}

        {/* VPA Copy Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--cream-100)',
          padding: '10px 16px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
          marginBottom: '20px',
          border: '1px solid var(--border-medium)'
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>UPI ID: <strong>{paymentData?.upiVpa || '9676823113-2@ybl'}</strong></span>
          <button
            onClick={copyVpa}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--peanut-gold-700)', fontWeight: '700' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Verification Status */}
        {simulationStatus && (
          <div style={{
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: verifying ? '#FEF3C7' : '#D1FAE5',
            color: verifying ? '#92400E' : '#065F46',
            fontSize: '0.85rem',
            fontWeight: '600',
            marginBottom: '16px'
          }}>
            {simulationStatus}
          </div>
        )}

        {/* Interactive Payment Simulation Action for Development / Testing */}
        <button
          onClick={handleSimulatePayment}
          disabled={verifying}
          className="btn btn-gold"
          style={{ width: '100%', padding: '14px', fontSize: '0.98rem' }}
        >
          <Sparkles size={18} />
          <span>{verifying ? 'Verifying on Server...' : 'Simulate App Payment Success (Test Mode)'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '16px' }}>
          <ShieldCheck size={14} style={{ color: 'var(--success-color)' }} />
          <span>256-bit Encrypted Server-side Verification • RBI Compliant</span>
        </div>
      </div>
    </div>
  );
}
