import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton({ currentPage, hasBottomBar }) {
  // Hide on checkout and order success to avoid obstructing payment or order confirmation details
  if (currentPage === 'checkout' || currentPage === 'order_success') {
    return null;
  }

  // If a sticky bottom bar is present on mobile (e.g. on product detail page), offset higher
  const bottomPosition = hasBottomBar ? '84px' : '22px';

  const whatsappUrl = 'https://wa.me/919676823113?text=' + encodeURIComponent("Hi Madhurai Chocolates, I would like to know more about ordering chocolates!");

  return (
    <aside
      aria-label="Direct customer assistance"
      style={{
        position: 'fixed',
        bottom: bottomPosition,
        right: '20px',
        zIndex: 990,
        transition: 'bottom 0.3s ease'
      }}
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Madhurai Chocolates on WhatsApp"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#25D366',
          color: '#FFFFFF',
          padding: '12px 18px',
          borderRadius: '9999px',
          boxShadow: '0 6px 20px rgba(37, 211, 102, 0.45)',
          fontWeight: 700,
          fontSize: '0.92rem',
          textDecoration: 'none',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          border: '1.5px solid rgba(255, 255, 255, 0.4)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(37, 211, 102, 0.6)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.45)';
        }}
      >
        <MessageCircle size={22} fill="#FFFFFF" color="#25D366" />
        <span className="wa-btn-text">WhatsApp Us</span>
      </a>
    </aside>
  );
}
