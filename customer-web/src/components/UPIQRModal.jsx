import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  QrCode, 
  ShieldCheck, 
  ArrowRight, 
  Smartphone, 
  Sparkles, 
  Download, 
  AlertCircle, 
  CheckCircle2,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api.js';

export default function UPIQRModal({ order, paymentData, onClose, onSuccess }) {
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [showUtrField, setShowUtrField] = useState(false);

  const vpa = paymentData?.upiVpa || '9676823113-2@ybl';
  const payeeName = paymentData?.upiPayeeName || 'SAMBAYA PALEM PADMA';
  const phoneNumber = '9676823113';
  const amount = paymentData?.amount || order?.total_amount || 0;

  const copyToClipboard = (text, type) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      if (type === 'vpa') {
        setCopiedVpa(true);
        setTimeout(() => setCopiedVpa(false), 2500);
      } else {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2500);
      }
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
  };

  const downloadQR = () => {
    if (!paymentData?.qrDataUrl) return;
    try {
      const link = document.createElement('a');
      link.href = paymentData.qrDataUrl;
      link.download = `Madhurai_UPI_QR_${order?.order_number || 'order'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (e) {
      console.warn('Download error:', e);
    }
  };

  // Background status polling to auto-detect verified payment
  useEffect(() => {
    let interval;
    if (order?.id && !isSuccess) {
      interval = setInterval(async () => {
        try {
          const res = await api.getOrderById(order.id);
          if (res?.success && res?.data?.payment_status === 'PAID') {
            clearInterval(interval);
            setIsSuccess(true);
            setStatusMessage('✓ Payment confirmed! Redirecting to your order receipt...');
            setTimeout(() => {
              if (onClose) onClose();
              if (onSuccess) onSuccess(res.data);
            }, 800);
          }
        } catch (e) {
          // ignore polling errors
        }
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [order?.id, isSuccess, onClose, onSuccess]);

  // Customer submits payment confirmation / UTR
  const handleConfirmUpiPayment = async () => {
    if (!order?.id) return;
    setVerifying(true);
    setStatusMessage('Verifying payment on server...');
    try {
      const res = await api.confirmUpiPayment(order.id, {
        utr_number: utrNumber.trim(),
        payment_id: paymentData?.paymentId
      });
      if (res.success) {
        setIsSuccess(true);
        setStatusMessage('✓ Payment verified successfully! Finalizing order...');
        setTimeout(() => {
          if (onClose) onClose();
          if (onSuccess) onSuccess(res.data || res);
        }, 900);
      } else {
        setStatusMessage(res.message || 'Payment confirmation could not be verified.');
        setVerifying(false);
      }
    } catch (err) {
      setStatusMessage(err.message || 'Verification error. Please retry.');
      setVerifying(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(18, 9, 5, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-xl)',
        maxWidth: '500px',
        width: '100%',
        padding: '28px 24px',
        position: 'relative',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
        border: '1.5px solid var(--border-medium)',
        textAlign: 'center',
        maxHeight: '94vh',
        overflowY: 'auto'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            color: 'var(--text-muted)',
            padding: '6px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.05)',
            border: 'none',
            cursor: 'pointer'
          }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '50%', backgroundColor: 'var(--peanut-gold-100)', color: 'var(--peanut-gold-700)', marginBottom: '8px' }}>
          <QrCode size={26} />
        </div>
        <h3 style={{ fontSize: '1.4rem', color: 'var(--cacao-950)', marginBottom: '4px', fontWeight: '800' }}>
          Complete Your UPI Payment
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Order <strong>{order?.order_number || 'Order'}</strong> • Pay Exactly: <strong style={{ color: 'var(--peanut-gold-700)', fontSize: '1.2rem' }}>₹{amount}</strong>
        </p>

        {/* Success Alert */}
        {isSuccess ? (
          <div style={{
            padding: '24px 16px',
            backgroundColor: '#ECFDF5',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid #A7F3D0',
            color: '#065F46',
            marginBottom: '16px'
          }}>
            <CheckCircle2 size={40} style={{ margin: '0 auto 10px', color: '#059669' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: '800' }}>Payment Confirmed!</h4>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>{statusMessage}</p>
          </div>
        ) : (
          <>
            {/* Quick 1-Tap Payee Cards (Direct UPI ID & Phone) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              {/* Option A: UPI ID */}
              <div style={{
                backgroundColor: '#FFFBEB',
                border: '1.5px solid #FDE68A',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.84rem'
              }}>
                <div>
                  <div style={{ color: '#92400E', fontWeight: '700', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Pay to UPI ID (Recommended)
                  </div>
                  <div style={{ color: '#1E293B', fontWeight: '800', fontSize: '0.96rem', marginTop: '1px' }}>
                    {vpa}
                  </div>
                  <div style={{ color: '#78350F', fontSize: '0.74rem' }}>
                    Payee: <strong>{payeeName}</strong>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(vpa, 'vpa')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 12px',
                    backgroundColor: copiedVpa ? '#059669' : '#D97706',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  {copiedVpa ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedVpa ? 'Copied!' : 'Copy UPI ID'}</span>
                </button>
              </div>

              {/* Option B: Mobile Number */}
              <div style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 'var(--radius-md)',
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem'
              }}>
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.74rem', display: 'block' }}>Or Pay via PhonePe / GPay Mobile No:</span>
                  <strong style={{ color: '#1E293B', fontSize: '0.9rem' }}>+91 {phoneNumber}</strong>
                </div>
                <button
                  onClick={() => copyToClipboard(phoneNumber, 'phone')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    backgroundColor: copiedPhone ? '#059669' : '#475569',
                    color: '#FFFFFF',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '0.76rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {copiedPhone ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedPhone ? 'Copied' : 'Copy Mobile'}</span>
                </button>
              </div>
            </div>

            {/* Dynamic QR Code Card */}
            <div style={{
              display: 'inline-block',
              padding: '12px',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 6px 20px rgba(44, 23, 14, 0.08)',
              border: '2px solid var(--peanut-gold-400)',
              marginBottom: '12px'
            }}>
              {paymentData?.qrDataUrl ? (
                <img
                  src={paymentData.qrDataUrl}
                  alt="Dynamic UPI Payment QR"
                  style={{ width: '185px', height: '185px', display: 'block', borderRadius: '8px' }}
                />
              ) : (
                <div style={{ width: '185px', height: '185px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Generating QR...
                </div>
              )}
            </div>

            {/* Quick Actions for Same Phone / Scanner */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={downloadQR}
                className="btn btn-outline"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 10px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  borderColor: 'var(--peanut-gold-500)',
                  color: 'var(--cacao-950)'
                }}
              >
                <Download size={15} style={{ color: 'var(--peanut-gold-600)' }} />
                <span>{downloadSuccess ? '✓ QR Saved!' : 'Save QR to Photos'}</span>
              </button>

              {paymentData?.upiQrString && (
                <a
                  href={paymentData.upiQrString}
                  className="btn btn-gold"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '9px 10px',
                    fontSize: '0.8rem',
                    textDecoration: 'none'
                  }}
                >
                  <Smartphone size={15} />
                  <span>Open UPI App</span>
                </a>
              )}
            </div>

            {/* PhonePe Security Advisory Banner */}
            <div style={{
              backgroundColor: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              textAlign: 'left',
              fontSize: '0.78rem',
              color: '#92400E',
              lineHeight: '1.4',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', marginBottom: '3px' }}>
                <AlertCircle size={14} style={{ color: '#B45309', flexShrink: 0 }} />
                <span>Seeing "Declined for security reasons" on PhonePe?</span>
              </div>
              <div>
                Banks restrict browser links for safety. Simply:
                <ol style={{ margin: '3px 0 0 16px', padding: 0 }}>
                  <li>Tap <strong>"Copy UPI ID"</strong> above & paste in PhonePe / GPay <em>"To UPI ID"</em>.</li>
                  <li>Or tap <strong>"Save QR to Photos"</strong> and scan the photo in PhonePe.</li>
                </ol>
              </div>
            </div>

            {/* Confirmation & UTR Section */}
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--border-medium)',
              padding: '14px',
              marginBottom: '14px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '800', fontSize: '0.86rem', color: 'var(--cacao-950)' }}>
                  Done Paying? Confirm Your Order
                </span>
                <button
                  type="button"
                  onClick={() => setShowUtrField(!showUtrField)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--peanut-gold-700)',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {showUtrField ? 'Hide Ref field' : '+ Add UPI Ref / UTR'}
                </button>
              </div>

              {showUtrField && (
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="Enter 12-digit UTR / UPI Ref number (optional)"
                    className="form-input"
                    style={{ fontSize: '0.82rem', padding: '8px 12px', width: '100%' }}
                  />
                </div>
              )}

              <button
                onClick={handleConfirmUpiPayment}
                disabled={verifying}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '11px',
                  fontSize: '0.92rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle2 size={18} />
                <span>{verifying ? 'Confirming on Server...' : 'I Have Completed Payment (Confirm Order)'}</span>
              </button>
            </div>

            {/* Status message */}
            {statusMessage && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: verifying ? '#FEF3C7' : '#EFF6FF',
                color: verifying ? '#92400E' : '#1E40AF',
                fontSize: '0.82rem',
                fontWeight: '600',
                marginBottom: '12px'
              }}>
                {statusMessage}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} style={{ color: 'var(--success-color)' }} />
              <span>Direct Bank Payment • 100% Secure • Auto Confirmed</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
