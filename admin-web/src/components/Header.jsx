import React from 'react';
import { Bell, ShieldCheck, Globe } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

export default function Header({ title }) {
  const { adminUser } = useAdminAuth();

  return (
    <header className="admin-header">
      <div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--admin-text-main)', letterSpacing: '-0.01em' }}>
          {title}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* System Health / Mode Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block' }}></span>
          <span>API Connected (Port 4000)</span>
        </div>

        {/* View Customer Website Link */}
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          className="btn-admin btn-admin-outline btn-admin-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Globe size={14} />
          <span>Customer Store</span>
        </a>

        {/* Staff User Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--admin-primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '0.88rem'
          }}>
            {adminUser?.full_name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
