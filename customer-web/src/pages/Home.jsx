import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  Heart, 
  Star, 
  ChevronRight, 
  CheckCircle2, 
  Truck, 
  Award,
  ChevronDown,
  Gift
} from 'lucide-react';
import { api } from '../services/api.js';
import { useCart } from '../context/CartContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import DeliveryChecker from '../components/DeliveryChecker.jsx';

export default function Home({ onNavigate }) {
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let retryTimeout = null;

    const loadCatalog = (attempt = 1) => {
      Promise.all([
        api.getProducts(),
        api.getCategories()
      ]).then(([prodRes, catRes]) => {
        if (!isMounted) return;
        if (prodRes?.success && Array.isArray(prodRes.data) && prodRes.data.length > 0) {
          setProducts(prodRes.data);
        }
        if (catRes?.success && Array.isArray(catRes.data)) {
          setCategories(catRes.data);
        }
      }).catch(err => {
        console.warn(`[Catalog] Fetch attempt ${attempt} waiting for backend...`, err.message);
        // If server is waking up (cold start), auto-retry up to 4 times (3s, 5s, 8s, 10s)
        if (attempt <= 4 && isMounted) {
          const delay = attempt * 2500;
          retryTimeout = setTimeout(() => loadCatalog(attempt + 1), delay);
        }
      }).finally(() => {
        if (isMounted) setLoading(false);
      });
    };

    loadCatalog();

    return () => {
      isMounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  const mainProduct = (products && products.length > 0)
    ? (products.find(p => p.is_featured === 1) || products[0])
    : null;
  const bestsellers = (products && products.length > 0) 
    ? (products.filter(p => p.is_bestseller === 1).length > 0 ? products.filter(p => p.is_bestseller === 1) : products)
    : [];
  const newProducts = (products && products.length > 0) 
    ? (products.filter(p => p.is_new === 1).length > 0 ? products.filter(p => p.is_new === 1) : products)
    : [];

  const kunafaProducts = (products && products.length > 0)
    ? products.filter(p => p.id?.includes('kunafa') || p.slug?.includes('kunafa'))
    : [];

  const singleKunafa = kunafaProducts.find(p => p.id === 'prod_kunafa_heart_single' || p.pieces_per_pack === 1) || {
    id: 'prod_kunafa_heart_single',
    product_id: 'prod_kunafa_heart_single',
    name: 'Kunafa Single Heart Shaped Chocolate',
    slug: 'kunafa-single-heart-chocolate',
    selling_price: 25,
    mrp: 35,
    discount: 28,
    weight: '10g',
    pieces_per_pack: 1,
    selling_unit: 'PIECE',
    stock: 500,
    is_prebooking: 1,
    prebooking_deposit: 15,
    balance_on_delivery: 10,
    prebooking_end_date: '2026-12-01 23:59:59',
    post_prebooking_price: 30,
    image_url: '/kunafa-heart-single.svg'
  };

  const pack5Kunafa = kunafaProducts.find(p => p.id === 'prod_kunafa_heart_pack5' || p.pieces_per_pack === 5) || {
    id: 'prod_kunafa_heart_pack5',
    product_id: 'prod_kunafa_heart_pack5',
    name: 'Pack of 5 Heart Shaped Kunafa Chocolates',
    slug: 'pack-of-5-heart-shaped-kunafa-chocolates',
    selling_price: 125,
    mrp: 175,
    discount: 28,
    weight: '50g',
    pieces_per_pack: 5,
    selling_unit: 'PACK',
    stock: 250,
    is_prebooking: 1,
    prebooking_deposit: 50,
    balance_on_delivery: 75,
    prebooking_end_date: '2026-12-01 23:59:59',
    post_prebooking_price: 150,
    image_url: '/kunafa-heart-pack5.svg'
  };

  const isPrebookingActive = new Date() <= new Date('2026-12-01T23:59:59+05:30');

  const faqs = [
    {
      q: "What makes Madhurai Chocolates' Peanut Butter Crunch so special?",
      a: "We combine rich dark chocolate with freshly stone-ground roasted peanuts and crunchy peanut butter filling. The center creates a delicious crunchy peanut butter lava sensation in your mouth, handcrafted in small batches with zero trans fat."
    },
    {
      q: "How many pieces are in the box and what is the individual price?",
      a: "Our signature 320g box contains 40 individually wrapped pieces. At ₹190 per box (MRP ₹220, 14% OFF), that works out to only ~₹4.75 per luxury artisanal piece!"
    },
    {
      q: "How do you ensure the chocolates do not melt during summer delivery?",
      a: "Every shipment is packed in customized thermal insulating air-bubble envelopes with reusable food-grade dry gel ice-packs. We guarantee zero-melt arrival at your doorstep."
    },
    {
      q: "What are your delivery charges and how do I get Free Delivery?",
      a: "Standard delivery is ₹40. However, delivery is 100% FREE whenever you order 5 or more packs/items, OR when your total cart value reaches ₹500 across India!"
    },
    {
      q: "Can I pay using Cash on Delivery (COD) or UPI QR?",
      a: "Yes! We support dynamic order-specific UPI QR scanning (Google Pay, PhonePe, Paytm, BHIM, etc.), Debit/Credit Cards, Net Banking, and Cash on Delivery in all serviceable pincodes."
    }
  ];

  return (
    <div>
      {/* 0. Kunafa Chocolate Coming Soon Announcement Ribbon */}
      <div style={{
        backgroundColor: '#78350F',
        backgroundImage: 'linear-gradient(90deg, #78350F 0%, #92400E 30%, #B45309 50%, #92400E 70%, #78350F 100%)',
        color: '#FEF3C7',
        padding: '12px 16px',
        textAlign: 'center',
        fontSize: '0.9rem',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        flexWrap: 'wrap',
        borderBottom: '2px solid rgba(245, 158, 11, 0.45)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: '#FDE68A' }} />
          <span>✨ <strong>KUNAFA CHOCOLATE COMING SOON!</strong> Pre-Booking Open Until <strong>December 1</strong> Only!</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            backgroundColor: '#1C0A04',
            color: '#34D399',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            fontWeight: '800',
            border: '1px solid rgba(52, 211, 153, 0.4)'
          }}>
            Pay ₹15 (Single) / ₹50 (Pack of 5) Now
          </span>
          <a 
            href="#kunafa-offer" 
            style={{ 
              color: '#FDE68A', 
              textDecoration: 'underline', 
              fontWeight: '800',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Pre-Book Now →
          </a>
        </div>
      </div>

      {/* 1. Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '620px',
        backgroundColor: 'var(--cacao-950)',
        backgroundImage: `linear-gradient(to right, rgba(18, 9, 5, 0.94) 35%, rgba(18, 9, 5, 0.65) 80%), url('/madhurai-hero-banner.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center right',
        display: 'flex',
        alignItems: 'center',
        padding: '70px 0',
        color: '#FFFFFF',
        borderBottom: '2px solid rgba(245, 158, 11, 0.3)'
      }}>
        <div className="container" style={{ width: '100%' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
            alignItems: 'center'
          }}>
            {/* Left Content Column */}
            <div style={{ maxWidth: '600px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: 'var(--peanut-gold-400)',
                fontSize: '0.84rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '18px'
              }}>
                <Sparkles size={16} />
                <span>Handcrafted Artisanal Chocolates</span>
              </div>

              <h1 style={{
                fontSize: 'clamp(2.3rem, 4.8vw, 3.8rem)',
                fontFamily: 'var(--font-heading)',
                fontWeight: '800',
                lineHeight: '1.15',
                color: '#FFFFFF',
                marginBottom: '18px'
              }}>
                Chocolate Moments, <br />
                <span style={{
                  background: 'linear-gradient(90deg, #FDE68A 0%, #F59E0B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Made More Delicious.
                </span>
              </h1>

              <p style={{
                fontSize: 'clamp(1rem, 2vw, 1.18rem)',
                color: 'var(--cream-200)',
                lineHeight: '1.65',
                marginBottom: '30px'
              }}>
                Discover rich chocolate with delicious crunchy peanut butter filling. A little indulgence made to brighten your day.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                <button
                  onClick={() => mainProduct ? onNavigate('product_detail', { slug: mainProduct.slug, id: mainProduct.id }) : onNavigate('products')}
                  className="btn btn-gold btn-lg"
                  style={{ minWidth: '180px' }}
                >
                  <ShoppingBag size={18} />
                  <span>Shop Chocolates</span>
                  <ArrowRight size={18} />
                </button>

                <button
                  onClick={() => onNavigate('products')}
                  className="btn btn-outline btn-lg"
                  style={{ color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.5)', minWidth: '180px' }}
                >
                  Explore Our Chocolates
                </button>
              </div>

              {/* Micro Trust Badges */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '18px',
                marginTop: '32px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                fontSize: '0.84rem',
                color: 'var(--cream-300)'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--peanut-gold-400)' }} />
                  40 Pieces Box (~₹4.75/bite)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--peanut-gold-400)' }} />
                  Free Delivery on ₹500+ or 5+ packs
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--peanut-gold-400)' }} />
                  Zero-Melt Cold-Pack Guarantee
                </span>
              </div>
            </div>

            {/* Right Visual Hero Showcase */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div 
                onClick={() => mainProduct ? onNavigate('product_detail', { slug: mainProduct.slug, id: mainProduct.id }) : onNavigate('products')}
                style={{
                  cursor: 'pointer',
                  maxWidth: '420px',
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '16px',
                  border: '1.5px solid rgba(245, 158, 11, 0.35)',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  transition: 'transform 0.3s ease'
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div style={{
                  position: 'relative',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  backgroundColor: 'var(--cacao-900)'
                }}>
                  <img
                    src="/chocolate-crunch-pb.jpg"
                    alt="Rich chocolate with crunchy peanut butter filling inside"
                    style={{ width: '100%', height: '260px', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(18, 9, 5, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: 'var(--peanut-gold-300)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}>
                    Crunchy Peanut Butter Filling
                  </div>
                </div>

                {/* Sub-card with Box Preview and Price */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  marginTop: '14px',
                  padding: '12px',
                  backgroundColor: 'rgba(18, 9, 5, 0.7)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <img
                    src="/madhurai-pack-box.jpg"
                    alt="Madhurai Chocolates 40 pieces pack box"
                    style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.4)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: '#FFFFFF', fontSize: '1rem', margin: 0, fontWeight: 700 }}>
                      MADHURAI mini bites
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--peanut-gold-400)', display: 'block' }}>
                      320g Box • 40 Pieces (~₹4.75/pc)
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                      <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1.15rem' }}>₹190</span>
                      <span style={{ color: 'var(--cream-300)', textDecoration: 'line-through', fontSize: '0.85rem' }}>₹220</span>
                      <span style={{ color: '#10B981', fontWeight: 700, fontSize: '0.78rem' }}>14% OFF</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 1.5. Kunafa Chocolate Coming Soon & Pre-Booking Spotlight Section */}
      <section id="kunafa-offer" style={{
        padding: '75px 0',
        backgroundColor: '#160803',
        backgroundImage: 'radial-gradient(circle at 50% 25%, rgba(245, 158, 11, 0.15) 0%, rgba(16, 185, 129, 0.08) 45%, rgba(22, 8, 3, 1) 100%)',
        color: '#FFFFFF',
        borderBottom: '2px solid rgba(245, 158, 11, 0.3)',
        position: 'relative'
      }}>
        <div className="container">
          
          {/* Section Heading Header */}
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 40px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(245, 158, 11, 0.18)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              color: 'var(--peanut-gold-300)',
              fontSize: '0.85rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '16px'
            }}>
              <Sparkles size={16} />
              <span>Coming Soon • Exclusive Pre-Booking</span>
            </div>

            <h2 style={{
              fontSize: 'clamp(2.1rem, 4vw, 3.2rem)',
              fontFamily: 'var(--font-heading)',
              fontWeight: '800',
              color: '#FFFFFF',
              marginBottom: '14px',
              lineHeight: '1.2'
            }}>
              Heart-Shaped <span style={{
                background: 'linear-gradient(90deg, #FDE68A 0%, #F59E0B 50%, #34D399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Kunafa Chocolates</span>
            </h2>

            <p style={{
              fontSize: '1.05rem',
              color: 'var(--cream-200)',
              lineHeight: '1.6',
              marginBottom: '20px'
            }}>
              Crispy roasted golden Kataifi kunafa pastry shredded noodles blended with stone-ground pistachio lava cream, enrobed in a handcrafted heart-shaped dark chocolate shell.
            </p>

            {/* Pre-Booking Deadline Rule Alert Box */}
            <div style={{
              display: 'inline-block',
              backgroundColor: 'rgba(28, 10, 4, 0.85)',
              border: '1.5px solid #F59E0B',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 24px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#FDE68A', marginBottom: '4px' }}>
                ⚡ Pre-Booking Open Only Until <span style={{ textDecoration: 'underline', color: '#FFFFFF' }}>December 1, 2026</span>
              </div>
              <div style={{ fontSize: '0.84rem', color: '#E2E8F0' }}>
                Pay small advance token online to lock your early-bird price • Remaining collected on doorstep delivery!
              </div>
              <div style={{ fontSize: '0.78rem', color: '#F87171', marginTop: '4px', fontWeight: '600' }}>
                * After December 1, pre-bookings close and prices increase to ₹30 (Single) and ₹150 (Pack of 5).
              </div>
            </div>
          </div>

          {/* Two Kunafa Products Showcase Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '32px',
            maxWidth: '920px',
            margin: '0 auto'
          }}>
            
            {/* Card 1: Single Heart Shaped Kunafa (10g) */}
            <div style={{
              backgroundColor: 'rgba(32, 14, 7, 0.85)',
              borderRadius: 'var(--radius-xl)',
              border: '1.5px solid rgba(245, 158, 11, 0.35)',
              overflow: 'hidden',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.3s ease, border-color 0.3s ease'
            }}>
              {/* Product Visual */}
              <div 
                onClick={() => onNavigate('product_detail', { slug: singleKunafa.slug, id: singleKunafa.id })}
                style={{
                  position: 'relative',
                  paddingTop: '80%',
                  cursor: 'pointer',
                  backgroundColor: '#1E0D06'
                }}
              >
                <img
                  src={singleKunafa.image_url || '/kunafa-heart-single.svg'}
                  alt={singleKunafa.name}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <span style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  backgroundColor: '#F59E0B',
                  color: '#1A0A04',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                  {isPrebookingActive ? 'Pre-Booking Active' : 'Coming Soon'}
                </span>
                <span style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: '#FEF3C7',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(245, 158, 11, 0.4)'
                }}>
                  10g Single Piece
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <h3 
                    onClick={() => onNavigate('product_detail', { slug: singleKunafa.slug, id: singleKunafa.id })}
                    style={{ fontSize: '1.25rem', color: '#FFFFFF', fontWeight: '800', marginBottom: '8px', cursor: 'pointer' }}
                  >
                    {singleKunafa.name}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--cream-300)', lineHeight: '1.5', marginBottom: '16px' }}>
                    Artisanal single heart-shaped dark chocolate filled with crunchy golden kataifi pastry and stone-ground pistachio lava. 10g weight.
                  </p>

                  {/* Pricing Breakdown */}
                  <div style={{
                    backgroundColor: 'rgba(18, 9, 5, 0.75)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    marginBottom: '18px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#FDE68A' }}>
                        ₹{singleKunafa.selling_price}
                      </span>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        ₹{singleKunafa.mrp}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#34D399', fontWeight: '700' }}>
                        Save ₹{singleKunafa.mrp - singleKunafa.selling_price}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Pay Now Token:</span>
                        <strong style={{ color: '#34D399', fontSize: '0.95rem' }}>₹{singleKunafa.prebooking_deposit}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>On Delivery:</span>
                        <strong style={{ color: '#F59E0B', fontSize: '0.95rem' }}>₹{singleKunafa.balance_on_delivery}</strong>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: '#F87171', marginTop: '6px' }}>
                      Post-Dec 1 price increases to ₹{singleKunafa.post_prebooking_price}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    onClick={() => {
                      addItem(singleKunafa, 1);
                      onNavigate('cart');
                    }}
                    className="btn btn-primary"
                    style={{ padding: '12px 10px', fontSize: '0.88rem' }}
                  >
                    <ShoppingBag size={16} />
                    <span>Pre-Book</span>
                  </button>
                  <button
                    onClick={() => {
                      addItem(singleKunafa, 1);
                      onNavigate('checkout');
                    }}
                    className="btn btn-gold"
                    style={{ padding: '12px 10px', fontSize: '0.88rem' }}
                  >
                    <span>Pay ₹{singleKunafa.prebooking_deposit}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Pack of 5 Heart Shaped Kunafa (50g Box) */}
            <div style={{
              backgroundColor: 'rgba(32, 14, 7, 0.85)',
              borderRadius: 'var(--radius-xl)',
              border: '2px solid rgba(245, 158, 11, 0.55)',
              overflow: 'hidden',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: 'transform 0.3s ease, border-color 0.3s ease'
            }}>
              {/* Best Value Badge */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: '#D97706',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: '800',
                padding: '6px 14px',
                borderBottomLeftRadius: '12px',
                zIndex: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                ⭐ POPULAR PACK OF 5
              </div>

              {/* Product Visual */}
              <div 
                onClick={() => onNavigate('product_detail', { slug: pack5Kunafa.slug, id: pack5Kunafa.id })}
                style={{
                  position: 'relative',
                  paddingTop: '80%',
                  cursor: 'pointer',
                  backgroundColor: '#1E0D06'
                }}
              >
                <img
                  src={pack5Kunafa.image_url || '/kunafa-heart-pack5.svg'}
                  alt={pack5Kunafa.name}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <span style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  backgroundColor: '#F59E0B',
                  color: '#1A0A04',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                  {isPrebookingActive ? 'Pre-Booking Active' : 'Coming Soon'}
                </span>
                <span style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '14px',
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  color: '#FEF3C7',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(245, 158, 11, 0.4)'
                }}>
                  50g Box (5 Hearts)
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <h3 
                    onClick={() => onNavigate('product_detail', { slug: pack5Kunafa.slug, id: pack5Kunafa.id })}
                    style={{ fontSize: '1.25rem', color: '#FFFFFF', fontWeight: '800', marginBottom: '8px', cursor: 'pointer' }}
                  >
                    {pack5Kunafa.name}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--cream-300)', lineHeight: '1.5', marginBottom: '16px' }}>
                    Luxury gift box of 5 handcrafted heart-shaped Kunafa chocolates packed with crispy pistachio kataifi and Belgian chocolate. 50g total weight.
                  </p>

                  {/* Pricing Breakdown */}
                  <div style={{
                    backgroundColor: 'rgba(18, 9, 5, 0.75)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    marginBottom: '18px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#FDE68A' }}>
                        ₹{pack5Kunafa.selling_price}
                      </span>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        ₹{pack5Kunafa.mrp}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#34D399', fontWeight: '700' }}>
                        Save ₹{pack5Kunafa.mrp - pack5Kunafa.selling_price}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Pay Now Token:</span>
                        <strong style={{ color: '#34D399', fontSize: '0.95rem' }}>₹{pack5Kunafa.prebooking_deposit}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>On Delivery:</span>
                        <strong style={{ color: '#F59E0B', fontSize: '0.95rem' }}>₹{pack5Kunafa.balance_on_delivery}</strong>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: '#F87171', marginTop: '6px' }}>
                      Post-Dec 1 price increases to ₹{pack5Kunafa.post_prebooking_price}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    onClick={() => {
                      addItem(pack5Kunafa, 1);
                      onNavigate('cart');
                    }}
                    className="btn btn-primary"
                    style={{ padding: '12px 10px', fontSize: '0.88rem' }}
                  >
                    <ShoppingBag size={16} />
                    <span>Pre-Book</span>
                  </button>
                  <button
                    onClick={() => {
                      addItem(pack5Kunafa, 1);
                      onNavigate('checkout');
                    }}
                    className="btn btn-gold"
                    style={{ padding: '12px 10px', fontSize: '0.88rem' }}
                  >
                    <span>Pay ₹{pack5Kunafa.prebooking_deposit}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Value props ribbon */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '30px',
            flexWrap: 'wrap',
            marginTop: '40px',
            paddingTop: '28px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'var(--cream-200)',
            fontSize: '0.88rem'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--peanut-gold-400)' }} />
              Crispy Kataifi Pastry Crunch
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--peanut-gold-400)' }} />
              Stone-Ground Pistachio Lava
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--peanut-gold-400)' }} />
              Pay Advance Now, Rest on Delivery
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--peanut-gold-400)' }} />
              Zero-Melt Cold-Pack Guarantee
            </span>
          </div>

        </div>
      </section>

      {/* 2. Main Product Spotlight */}
      {mainProduct && (
        <section style={{ padding: '80px 0', backgroundColor: '#FFFFFF' }}>
          <div className="container">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '50px',
              alignItems: 'center',
              backgroundColor: 'var(--cream-50)',
              borderRadius: 'var(--radius-xl)',
              padding: '48px',
              border: '1.5px solid var(--border-medium)',
              boxShadow: 'var(--shadow-xl)'
            }}>
              
              {/* Product Visual Showcase */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-lg)',
                  position: 'relative'
                }}>
                  <img
                    src={mainProduct.primary_image?.image_url || mainProduct.image_url || '/chocolate-crunch-pb.jpg'}
                    alt={mainProduct.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/chocolate-crunch-pb.jpg';
                    }}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                  <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px' }}>
                    <span className="badge badge-dark">Flagship Specialty</span>
                    {mainProduct.discount > 0 && (
                      <span className="badge badge-gold">{Math.round(mainProduct.discount)}% OFF</span>
                    )}
                  </div>
                </div>

                {/* Second pack box preview */}
                <div style={{
                  position: 'absolute',
                  bottom: '-25px',
                  right: '-20px',
                  width: '160px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '3px solid #FFFFFF',
                  boxShadow: 'var(--shadow-xl)'
                }}>
                  <img src="/madhurai-pack-box.jpg" alt="500g 40 pieces luxury box" style={{ width: '100%', display: 'block' }} />
                </div>
              </div>

              {/* Product Details & Actions */}
              <div>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: 'var(--peanut-gold-700)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Signature Recipe
                </span>

                <h2 style={{ fontSize: '2.4rem', lineHeight: '1.2', marginBottom: '14px', color: 'var(--cacao-950)' }}>
                  {mainProduct.name}
                </h2>

                {/* Key Spec Badges */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <span className="badge badge-gold" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                    Pack: {mainProduct.weight}
                  </span>
                  <span className="badge badge-dark" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                    {mainProduct.pieces_per_pack} Pieces per Box
                  </span>
                  <span className="badge badge-green" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                    Individual: ₹{mainProduct.pieces_per_pack > 1 ? (mainProduct.selling_price / mainProduct.pieces_per_pack).toFixed(1) : mainProduct.selling_price} / piece
                  </span>
                </div>

                <p style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', lineHeight: '1.65', marginBottom: '24px' }}>
                  {mainProduct.description}
                </p>

                {/* Price Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--cacao-950)' }}>
                    ₹{mainProduct.selling_price}
                  </span>
                  {mainProduct.mrp > mainProduct.selling_price && (
                    <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                      ₹{mainProduct.mrp}
                    </span>
                  )}
                  {mainProduct.mrp > mainProduct.selling_price && (
                    <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--success-color)' }}>
                      Save ₹{(mainProduct.mrp - mainProduct.selling_price).toFixed(0)} ({Math.round(mainProduct.discount || (((mainProduct.mrp - mainProduct.selling_price) / mainProduct.mrp) * 100))}% OFF)
                    </span>
                  )}
                </div>

                {/* Quick Add and Buy Now */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
                  <button
                    onClick={() => addItem(mainProduct, 1)}
                    className="btn btn-primary btn-lg"
                    style={{ flex: 1 }}
                  >
                    <ShoppingBag size={20} />
                    <span>Add to Cart</span>
                  </button>
                  <button
                    onClick={() => {
                      addItem(mainProduct, 1);
                      onNavigate('checkout');
                    }}
                    className="btn btn-gold btn-lg"
                    style={{ flex: 1 }}
                  >
                    <span>Buy Now</span>
                  </button>
                </div>

                {/* Inline Delivery Checker */}
                <DeliveryChecker product={mainProduct} />

              </div>

            </div>
          </div>
        </section>
      )}

      {/* 3. Categories Bar */}
      <section style={{ padding: '40px 0 60px', backgroundColor: 'var(--cream-50)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Curated Collections</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Explore handcrafted chocolate creations from our Madurai chocolaterie</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px'
          }}>
            {categories.map(cat => (
              <div
                key={cat.id}
                onClick={() => onNavigate('products', { category: cat.slug })}
                className="card"
                style={{
                  cursor: 'pointer',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  <img src={cat.image_url || '/chocolate-crunch-pb.jpg'} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', color: 'var(--cacao-950)', marginBottom: '4px' }}>{cat.name}</h4>
                  <span style={{ fontSize: '0.82rem', color: 'var(--peanut-gold-700)', fontWeight: '600' }}>
                    {cat.product_count || 1} Products →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Best Sellers & Catalog Grid */}
      <section style={{ padding: '60px 0', backgroundColor: '#FFFFFF' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px' }}>
            <div>
              <h2 style={{ fontSize: '2.2rem', marginBottom: '6px' }}>Best Sellers</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Our most cherished handcrafted peanut butter & chocolate creations</p>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>View All</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="product-grid">
            {products.map(prod => (
              <ProductCard key={prod.id} product={prod} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Why Choose Madhurai Chocolate */}
      <section style={{
        padding: '80px 0',
        backgroundColor: 'var(--cacao-950)',
        color: '#FFFFFF',
        backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.12) 0%, transparent 60%)'
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 54px' }}>
            <span style={{ color: 'var(--peanut-gold-400)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem' }}>
              The Madhurai Distinction
            </span>
            <h2 style={{ fontSize: '2.6rem', color: '#FFFFFF', marginTop: '8px', marginBottom: '16px' }}>
              Why Chocolate Lovers Trust Us
            </h2>
            <p style={{ color: 'var(--cream-300)', fontSize: '1.05rem' }}>
              We believe Indian chocolate deserves the same respect and uncompromising standards as the finest European chocolatiers.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '30px'
          }}>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--peanut-gold-400)', marginBottom: '20px' }}>
                <Award size={26} />
              </div>
              <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', marginBottom: '12px' }}>Pure Vegetable Fat</h3>
              <p style={{ color: 'var(--cream-300)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                Crafted with quality vegetable fat. Zero palm oil (no liquid fat) and zero trans fat for a wholesome, silky melt.
              </p>
            </div>

            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--peanut-gold-400)', marginBottom: '20px' }}>
                <Sparkles size={26} />
              </div>
              <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', marginBottom: '12px' }}>Slow-Roasted Peanut Core</h3>
              <p style={{ color: 'var(--cream-300)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                Slow-roasted Indian peanuts ground into luscious creamy butter with crunchy nibs, kissed with a touch of sea salt.
              </p>
            </div>

            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--peanut-gold-400)', marginBottom: '20px' }}>
                <Truck size={26} />
              </div>
              <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', marginBottom: '12px' }}>Cold-Pack Thermal Transit</h3>
              <p style={{ color: 'var(--cream-300)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                Shipped directly from Gudur, Andhra Pradesh in insulated temperature-regulated packages to prevent melting.
              </p>
            </div>

            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--peanut-gold-400)', marginBottom: '20px' }}>
                <ShieldCheck size={26} />
              </div>
              <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', marginBottom: '12px' }}>Zero Palm Oil & Trans-Fat Free</h3>
              <p style={{ color: 'var(--cream-300)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                Strictly 0% liquid palm oil and zero trans fat. Wholesome confections handcrafted fresh at our Gudur workshop.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Artisanal Commitment & Guarantees */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--cream-50)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ color: 'var(--peanut-gold-700)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem' }}>
              Uncompromising Standards
            </span>
            <h2 style={{ fontSize: '2.4rem', marginBottom: '10px', color: 'var(--cacao-950)' }}>The Madhurai Artisanal Commitment</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto' }}>
              Every single batch is crafted in small quantities with pure natural ingredients and delivered directly from our chocolaterie in Gudur to your home.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            <div className="card" style={{ padding: '28px', backgroundColor: '#FFFFFF' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--peanut-gold-100)', color: 'var(--peanut-gold-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Award size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--cacao-950)', marginBottom: '8px' }}>Zero Palm Oil & Zero Trans Fat</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                We use premium vegetable fat and dark chocolate solids. We never use liquid palm oil or harmful trans fats.
              </p>
            </div>

            <div className="card" style={{ padding: '28px', backgroundColor: '#FFFFFF' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--peanut-gold-100)', color: 'var(--peanut-gold-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Truck size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--cacao-950)', marginBottom: '8px' }}>Temperature-Safe Dispatch</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Shipped in insulated protective bubble enclosures with food-grade dry gel coolants to preserve shape, texture, and aroma during transit.
              </p>
            </div>

            <div className="card" style={{ padding: '28px', backgroundColor: '#FFFFFF' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--peanut-gold-100)', color: 'var(--peanut-gold-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <ShieldCheck size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--cacao-950)', marginBottom: '8px' }}>Razorpay Secure Payments</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Instant checkout with UPI (Google Pay, PhonePe, Paytm, CRED), Debit/Credit Cards, NetBanking, and Wallets via RBI-authorized Razorpay.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ Accordion */}
      <section style={{ padding: '80px 0', backgroundColor: '#FFFFFF' }}>
        <div className="container" style={{ maxWidth: '840px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '2.4rem', marginBottom: '10px' }}>Frequently Asked Questions</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Everything you need to know about our handcrafted chocolates, shipping & payments</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  backgroundColor: openFaq === idx ? 'var(--cream-50)' : '#FFFFFF',
                  transition: 'var(--transition)'
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    fontWeight: '700',
                    fontSize: '1.05rem',
                    color: 'var(--cacao-950)'
                  }}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={20}
                    style={{
                      transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                      color: 'var(--peanut-gold-700)',
                      flexShrink: 0
                    }}
                  />
                </button>
                {openFaq === idx && (
                  <div style={{ padding: '0 24px 20px', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.7' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
