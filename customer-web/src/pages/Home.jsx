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

  const fallbackProduct = {
    id: 'prod_main_pb_crunch',
    product_id: 'prod_main_pb_crunch',
    name: 'Chocolate Crunch Peanut Butter Inside',
    slug: 'chocolate-crunch-peanut-butter-inside',
    weight: '500g',
    pieces_per_pack: 40,
    mrp: 450,
    selling_price: 400,
    discount: 11.11,
    description: 'Freshly roasted stone-ground peanut butter core enveloped in 60% South Indian single-origin dark chocolate.',
    image_url: '/chocolate-crunch-pb.jpg',
    is_bestseller: 1,
    stock: 50
  };

  const mainProduct = (products && products.length > 0)
    ? (products.find(p => p.slug === 'chocolate-crunch-peanut-butter-inside') || products[0])
    : fallbackProduct;
  const bestsellers = (products && products.length > 0) ? products.filter(p => p.is_bestseller === 1) : [fallbackProduct];
  const newProducts = (products && products.length > 0) ? products.filter(p => p.is_new === 1) : [fallbackProduct];

  const faqs = [
    {
      q: "What makes Madhurai Chocolate's Peanut Butter Crunch so special?",
      a: "Unlike mass-market confectioneries that use palm oil and artificial flavorings, we use single-origin South Indian dark cacao combined with freshly stone-ground roasted peanuts and pure sea salt. The center stays decadently creamy with an audible, satisfying crunch in every single bite."
    },
    {
      q: "How many pieces are in the 500g box and what is the individual price?",
      a: "Our signature 500g box contains exactly 40 individually foil-wrapped pieces. At ₹400 per box, that works out to just ₹10 per luxury artisanal piece!"
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
      {/* 1. Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '620px',
        backgroundColor: 'var(--cacao-950)',
        backgroundImage: `linear-gradient(to right, rgba(18, 9, 5, 0.94) 35%, rgba(18, 9, 5, 0.6) 75%), url('/madhurai-hero-banner.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center right',
        display: 'flex',
        alignItems: 'center',
        padding: '80px 0',
        color: '#FFFFFF',
        borderBottom: '2px solid rgba(245, 158, 11, 0.3)'
      }}>
        <div className="container">
          <div style={{ maxWidth: '640px' }}>
            
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
              marginBottom: '20px'
            }}>
              <Sparkles size={16} />
              <span>South Indian Artisanal Craft</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontFamily: 'var(--font-heading)',
              fontWeight: '800',
              lineHeight: '1.1',
              color: '#FFFFFF',
              marginBottom: '20px'
            }}>
              Rich Dark Cacao. <br />
              <span style={{
                background: 'linear-gradient(90deg, #FDE68A 0%, #F59E0B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Roasted Crunchy Peanut Butter Inside.
              </span>
            </h1>

            <p style={{
              fontSize: '1.15rem',
              color: 'var(--cream-200)',
              lineHeight: '1.65',
              marginBottom: '32px'
            }}>
              Handcrafted in Madurai using single-origin cacao and slow-roasted chunky peanuts. Experience intense flavor harmony without palm oil or artificial preservatives.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
              <button
                onClick={() => onNavigate('product_detail', { slug: mainProduct.slug, id: mainProduct.id })}
                className="btn btn-gold btn-lg"
              >
                <span>Order {mainProduct.name} ({mainProduct.weight || '500g'})</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => onNavigate('products')}
                className="btn btn-outline btn-lg"
                style={{ color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.4)' }}
              >
                Explore Full Catalog
              </button>
            </div>

            {/* Micro Trust Points */}
            <div style={{ display: 'flex', gap: '24px', marginTop: '40px', fontSize: '0.85rem', color: 'var(--cream-300)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--peanut-gold-400)' }} />
                ₹{mainProduct.pieces_per_pack > 1 ? Math.round(mainProduct.selling_price / mainProduct.pieces_per_pack) : mainProduct.selling_price} per piece value
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--peanut-gold-400)' }} />
                Free delivery on 5+ packs
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--peanut-gold-400)' }} />
                Zero-melt guarantee
              </span>
            </div>

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
              <h3 style={{ fontSize: '1.15rem', color: 'var(--cacao-950)', marginBottom: '8px' }}>Direct UPI & Secure Payments</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Order-specific dynamic NPCI UPI QR code generation and instant verification across all major Indian banking and payment apps.
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
