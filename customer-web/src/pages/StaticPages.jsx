import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export function About() {
  return (
    <div style={{ padding: '60px 0 100px', backgroundColor: '#FFFFFF' }}>
      <div className="container" style={{ maxWidth: '840px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--peanut-gold-700)' }}>
          Our Story & Craft
        </span>
        <h1 style={{ fontSize: '2.8rem', color: 'var(--cacao-950)', margin: '10px 0 24px', lineHeight: '1.2' }}>
          Born in the Temple City, Handcrafted for the World.
        </h1>

        <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '36px', boxShadow: 'var(--shadow-md)' }}>
          <img src="/madhurai-hero-banner.jpg" alt="Artisanal chocolate craftsmanship" style={{ width: '100%', display: 'block' }} />
        </div>

        <div style={{ fontSize: '1.08rem', lineHeight: '1.85', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p>
            At <strong>Madhurai Chocolate</strong>, we believe that India’s relationship with chocolate should be defined by devotion, craftsmanship, and pure natural ingredients. Situated in <strong>Gudur, Andhra Pradesh</strong>, our chocolaterie honors traditional culinary secrets while pioneering modern confection techniques.
          </p>

          <h3 style={{ fontSize: '1.6rem', color: 'var(--cacao-950)', marginTop: '16px' }}>Our Wholesome Ingredients</h3>
          <p>
            Unlike commercial brands that use liquid palm oil and harmful trans fats, our chocolates are crafted with <strong>premium vegetable fat, zero palm oil (no liquid fat), and zero trans fat</strong>. Sourced with care and prepared in small batches, every piece delivers a clean, smooth, velvety melt.
          </p>

          <h3 style={{ fontSize: '1.6rem', color: 'var(--cacao-950)', marginTop: '16px' }}>The Legendary Peanut Butter Crunch</h3>
          <p>
            Our flagship innovation — <em>Chocolate Crunch Peanut Butter Inside</em> — was born from an obsession to create the ultimate textural contrast: a crisp, satisfying dark chocolate snap giving way to a velvety, stone-ground golden roasted peanut core laden with crunchy roasted nibs and mineral-rich local sea salt.
          </p>
          <p>
            At 40 pieces (500g) for ₹400, we proudly prove that artisanal luxury should be accessible to every chocolate enthusiast in India.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Contact() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div style={{ padding: '60px 0 100px', backgroundColor: 'var(--cream-50)' }}>
      <div className="container" style={{ maxWidth: '840px' }}>
        <h1 style={{ fontSize: '2.6rem', color: 'var(--cacao-950)', marginBottom: '12px', textAlign: 'center' }}>
          Contact Our Concierge
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '48px' }}>
          Have questions regarding corporate festive orders, customization, or delivery? We'd love to assist you.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px' }}>
          {/* Details */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '36px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-medium)' }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--cacao-950)', marginBottom: '24px' }}>Headquarters & Workshop</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <MapPin size={22} style={{ color: 'var(--peanut-gold-600)', flexShrink: 0, marginTop: '2px' }} />
                <span>Gudur, Andhra Pradesh 524101, India</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Phone size={22} style={{ color: 'var(--peanut-gold-600)', flexShrink: 0 }} />
                <a href="tel:+919676823113" style={{ color: 'inherit', textDecoration: 'none' }}>
                  +91 96768 23113 (Mon-Sat, 10 AM to 7 PM IST)
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Mail size={22} style={{ color: 'var(--peanut-gold-600)', flexShrink: 0 }} />
                <a href="mailto:madhuraicompany@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>
                  madhuraicompany@gmail.com
                </a>
              </div>
            </div>

            <div style={{ marginTop: '36px', padding: '16px', backgroundColor: 'var(--cream-100)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              <strong>Bulk / Wedding Gifting:</strong> We create customized bespoke sleeves and personalized foil stamping for events starting at 50 boxes.
            </div>
          </div>

          {/* Inquiry Form */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '36px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-medium)' }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircle2 size={48} style={{ color: 'var(--success-color)', marginBottom: '16px' }} />
                <h3 style={{ color: 'var(--cacao-950)', marginBottom: '8px' }}>Message Received</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Our client concierge will respond within 24 business hours.</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input type="text" required placeholder="Full name" className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" required placeholder="Email" className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Message / Inquiry</label>
                  <textarea rows="4" required placeholder="Tell us how we can help..." className="form-textarea" style={{ width: '100%', padding: '12px' }}></textarea>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                  <Send size={16} />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ShippingPolicy() {
  return (
    <div style={{ padding: '60px 0 100px', backgroundColor: '#FFFFFF' }}>
      <div className="container" style={{ maxWidth: '800px', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
        <h1 style={{ fontSize: '2.4rem', color: 'var(--cacao-950)', marginBottom: '24px' }}>Shipping & Delivery Policy</h1>
        <p style={{ marginBottom: '16px' }}>
          At Madhurai Chocolate, we take extreme pride in ensuring every batch of handcrafted chocolate reaches your hands in pristine condition, regardless of external ambient temperature.
        </p>
        <h3 style={{ fontSize: '1.3rem', color: 'var(--cacao-950)', margin: '20px 0 10px' }}>1. Zero-Melt Insulated Cold-Pack Packaging</h3>
        <p>Every order is dispatched in temperature-regulated insulated envelopes with reusable food-grade dry gel cooling packs. This maintains a cool micro-climate during transit.</p>
        <h3 style={{ fontSize: '1.3rem', color: 'var(--cacao-950)', margin: '20px 0 10px' }}>2. Delivery Timelines</h3>
        <p>Metro cities in South India (Madurai, Chennai, Bengaluru, Hyderabad): 2 to 3 business days.<br />Rest of India: 3 to 5 business days.</p>
        <h3 style={{ fontSize: '1.3rem', color: 'var(--cacao-950)', margin: '20px 0 10px' }}>3. Shipping Charges</h3>
        <p>Standard delivery is ₹40. <strong>FREE DELIVERY</strong> is automatically granted on any order of 5 or more packs, or order totals of ₹500 and above.</p>
      </div>
    </div>
  );
}

export function RefundPolicy() {
  return (
    <div style={{ padding: '60px 0 100px', backgroundColor: '#FFFFFF' }}>
      <div className="container" style={{ maxWidth: '800px', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
        <h1 style={{ fontSize: '2.4rem', color: 'var(--cacao-950)', marginBottom: '24px' }}>Cancellation & Refund Policy</h1>
        <p style={{ marginBottom: '16px' }}>
          Because our products are gourmet perishable food items handcrafted without artificial preservatives, cancellations must be requested prior to parcel dispatch.
        </p>
        <h3 style={{ fontSize: '1.3rem', color: 'var(--cacao-950)', margin: '20px 0 10px' }}>1. Cancellation Window</h3>
        <p>Orders can be cancelled before packing status (within 2 hours of placement). Once dispatched, food items cannot be recalled.</p>
        <h3 style={{ fontSize: '1.3rem', color: 'var(--cacao-950)', margin: '20px 0 10px' }}>2. Damaged or Melted Shipments</h3>
        <p>If your package arrives damaged or compromised, simply send photos to <strong>madhuraicompany@gmail.com</strong> within 24 hours of delivery. We will issue an immediate free replacement batch or a 100% gateway refund.</p>
        <h3 style={{ fontSize: '1.3rem', color: 'var(--cacao-950)', margin: '20px 0 10px' }}>3. Gateway Refund Processing</h3>
        <p>All refunds are processed strictly through the original payment gateway (UPI/Card/Net Banking). Refunds typically credit back to the customer account within 3 to 5 banking days.</p>
      </div>
    </div>
  );
}

export function PrivacyPolicy() {
  return (
    <div style={{ padding: '60px 0 100px', backgroundColor: '#FFFFFF' }}>
      <div className="container" style={{ maxWidth: '800px', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
        <h1 style={{ fontSize: '2.4rem', color: 'var(--cacao-950)', marginBottom: '24px' }}>Privacy Policy</h1>
        <p>Madhurai Chocolate values your privacy. We collect only necessary details (name, delivery address, mobile, email) to process and fulfill your orders. We never sell or distribute personal data to third-party marketing companies.</p>
        <p>All online payment credentials (UPI PIN, CVV, Card numbers) are processed directly by RBI-licensed payment gateways and are never stored on our servers.</p>
      </div>
    </div>
  );
}

export function Terms() {
  return (
    <div style={{ padding: '60px 0 100px', backgroundColor: '#FFFFFF' }}>
      <div className="container" style={{ maxWidth: '800px', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
        <h1 style={{ fontSize: '2.4rem', color: 'var(--cacao-950)', marginBottom: '24px' }}>Terms & Conditions</h1>
        <p>By accessing or placing an order on madhuraichocolate.com, you agree to be bound by our terms of service. Products are subject to small-batch availability. Prices are listed in Indian Rupees (INR).</p>
      </div>
    </div>
  );
}
