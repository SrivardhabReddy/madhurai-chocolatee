import React from 'react';
import { Mail, Phone, MapPin, ShieldCheck, Award, Heart, CheckCircle2 } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer style={{ backgroundColor: 'var(--cacao-950)', color: 'var(--cream-100)', paddingTop: '64px', paddingBottom: '32px', borderTop: '2px solid rgba(245, 158, 11, 0.3)' }}>
      <div className="container">
        
        {/* Trust Badges Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          paddingBottom: '48px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '48px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--peanut-gold-400)' }}>
              <Award size={24} />
            </div>
            <div>
              <h4 style={{ color: '#FFFFFF', fontSize: '0.98rem', marginBottom: '2px' }}>Pure South Indian Cocoa</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--cream-300)' }}>Single-origin, artisanal small batches</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--peanut-gold-400)' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 style={{ color: '#FFFFFF', fontSize: '0.98rem', marginBottom: '2px' }}>FSSAI Certified</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--cream-300)' }}>Lic No. 12423008000451</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--peanut-gold-400)' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 style={{ color: '#FFFFFF', fontSize: '0.98rem', marginBottom: '2px' }}>Insulated Cold-Pack</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--cream-300)' }}>Zero-melt guaranteed shipping</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--peanut-gold-400)' }}>
              <Heart size={24} />
            </div>
            <div>
              <h4 style={{ color: '#FFFFFF', fontSize: '0.98rem', marginBottom: '2px' }}>0% Palm Oil / Trans-Fat</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--cream-300)' }}>Crafted with quality vegetable fat</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links Columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '40px',
          marginBottom: '48px'
        }}>
          {/* Brand Info */}
          <div>
            <h3 style={{ color: 'var(--peanut-gold-400)', fontFamily: 'var(--font-heading)', fontSize: '1.45rem', marginBottom: '16px' }}>
              Madhurai Chocolate
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--cream-300)', lineHeight: '1.7', marginBottom: '20px' }}>
              Handcrafted in Gudur, Andhra Pradesh. We fuse rich dark chocolate with slow-roasted crunchy peanut butter centers to deliver an extraordinary Indian chocolate experience.
            </p>
            <div style={{ fontSize: '0.82rem', color: 'var(--cream-300)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span><strong>FSSAI Lic:</strong> 2018 2629000442</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '1.05rem', marginBottom: '18px', fontWeight: '700' }}>Explore</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <li>
                <button onClick={() => onNavigate('products')} style={{ color: 'var(--cream-200)', transition: 'var(--transition)' }}>
                  All Handcrafted Chocolates
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('product_detail', { slug: 'chocolate-crunch-peanut-butter-inside' })} style={{ color: 'var(--peanut-gold-400)', fontWeight: '600' }}>
                  Peanut Butter Crunch 500g
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('articles')} style={{ color: 'var(--cream-200)' }}>
                  Articles & Stories
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('track_order')} style={{ color: 'var(--cream-200)' }}>
                  Track Your Order
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} style={{ color: 'var(--cream-200)' }}>
                  Our Heritage & Craft
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} style={{ color: 'var(--cream-200)' }}>
                  Frequently Asked Questions
                </button>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '1.05rem', marginBottom: '18px', fontWeight: '700' }}>Customer Care & Policies</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <li>
                <button onClick={() => onNavigate('shipping_policy')} style={{ color: 'var(--cream-200)' }}>
                  Shipping & Delivery Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('refund_policy')} style={{ color: 'var(--cream-200)' }}>
                  Cancellation & Refund Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy_policy')} style={{ color: 'var(--cream-200)' }}>
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} style={{ color: 'var(--cream-200)' }}>
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} style={{ color: 'var(--cream-200)' }}>
                  Contact Support
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '1.05rem', marginBottom: '18px', fontWeight: '700' }}>Factory & HQ</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem', color: 'var(--cream-200)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <MapPin size={18} style={{ color: 'var(--peanut-gold-400)', flexShrink: 0, marginTop: '3px' }} />
                <span>Gudur, Andhra Pradesh 524101, India</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={18} style={{ color: 'var(--peanut-gold-400)', flexShrink: 0 }} />
                <a href="tel:+919676823113" style={{ color: 'inherit', textDecoration: 'none' }}>
                  +91 96768 23113 (10 AM - 7 PM IST)
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={18} style={{ color: 'var(--peanut-gold-400)', flexShrink: 0 }} />
                <a href="mailto:madhuraicompany@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>
                  madhuraicompany@gmail.com
                </a>
              </div>
            </div>

            {/* Indian Payment Badges */}
            <div style={{ marginTop: '24px' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cream-300)', display: 'block', marginBottom: '8px' }}>
                Supported Payment Methods
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <span className="badge badge-dark" style={{ border: '1px solid rgba(245, 158, 11, 0.3)' }}>Dynamic UPI QR</span>
                <span className="badge badge-dark">GPay</span>
                <span className="badge badge-dark">PhonePe</span>
                <span className="badge badge-dark">Paytm</span>
                <span className="badge badge-dark">Cards</span>
                <span className="badge badge-dark">COD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div style={{
          paddingTop: '24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          fontSize: '0.82rem',
          color: 'var(--cream-300)'
        }}>
          <div>
            © {new Date().getFullYear()} Madhurai Chocolate Private Limited. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Handcrafted with pure devotion in Madurai, India</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
