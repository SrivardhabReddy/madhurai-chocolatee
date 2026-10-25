import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials or unauthorized staff account.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #31102b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '460px',
        padding: '36px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            background: 'linear-gradient(135deg, #451a03 0%, #78350f 100%)',
            borderRadius: '14px',
            fontSize: '28px',
            marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(120, 53, 15, 0.3)'
          }}>
            🍫
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
            Madhurai Chocolate
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Internal Enterprise Management Portal
          </p>
        </div>

        {error && (
          <div className="admin-alert admin-alert-danger" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-label">Staff Work Email</label>
            <input
              type="email"
              required
              className="admin-input"
              placeholder="madhuraicompany@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Access Password</label>
            <input
              type="password"
              required
              className="admin-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '15px', marginTop: '8px' }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating Staff...' : 'Secure Staff Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>
          <span>🔒 256-bit Encrypted Session • Authorized Staff Only</span>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
            All sign-in attempts and administrative API transactions are logged in immutable audit records.
          </div>
        </div>
      </div>
    </div>
  );
}
