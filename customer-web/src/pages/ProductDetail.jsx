import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Heart, 
  Truck, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Minus, 
  Plus, 
  Star, 
  ArrowLeft,
  Share2
} from 'lucide-react';
import { api } from '../services/api.js';
import { useCart } from '../context/CartContext.jsx';
import DeliveryChecker from '../components/DeliveryChecker.jsx';

export default function ProductDetail({ slug, id, onNavigate }) {
  const { addItem, toggleWishlist, isWishlisted } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('description'); // 'description', 'ingredients', 'nutrition'
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let retryTimeout = null;
    setLoading(true);
    setError('');

    const resolveProduct = async (attempt = 1) => {
      try {
        const targetIdentifier = slug || id;
        if (targetIdentifier) {
          const res = await api.getProductBySlug(targetIdentifier).catch(() => null);
          if (res?.success && res?.data && isMounted) {
            setProduct(res.data);
            const primary = res.data.primary_image?.image_url || res.data.images?.[0]?.image_url || '/chocolate-crunch-pb.jpg';
            setSelectedImage(primary);
            setLoading(false);
            return;
          }
        }

        // Try getting catalog to find product by id or slug
        const catRes = await api.getProducts().catch(() => null);
        if (catRes?.success && Array.isArray(catRes.data) && catRes.data.length > 0 && isMounted) {
          const matched = catRes.data.find(p => 
            p.slug === targetIdentifier || 
            String(p.id) === String(targetIdentifier) || 
            String(p.id) === String(id)
          ) || catRes.data[0];
          setProduct(matched);
          const primary = matched.primary_image?.image_url || matched.image_url || matched.images?.[0]?.image_url || '/chocolate-crunch-pb.jpg';
          setSelectedImage(primary);
          setLoading(false);
          return;
        }

        // If backend failed and attempt <= 4, retry with backoff
        if (attempt <= 4 && isMounted) {
          retryTimeout = setTimeout(() => resolveProduct(attempt + 1), attempt * 2500);
          return;
        }

        if (isMounted) {
          setError('Product not found or currently unavailable.');
          setLoading(false);
        }
      } catch (err) {
        if (attempt <= 4 && isMounted) {
          retryTimeout = setTimeout(() => resolveProduct(attempt + 1), attempt * 2500);
          return;
        }
        if (isMounted) {
          setError('Failed to load product details.');
          setLoading(false);
        }
      }
    };

    resolveProduct();

    return () => {
      isMounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [slug, id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--cacao-900)' }}>Handcrafting product details...</h3>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--cacao-950)', marginBottom: '16px' }}>{error || 'Product Not Found'}</h2>
        <button onClick={() => onNavigate('products')} className="btn btn-primary">
          Back to All Chocolates
        </button>
      </div>
    );
  }

  const wishlisted = isWishlisted(product.id);
  const now = new Date();
  const endDate = product.prebooking_end_date ? new Date(product.prebooking_end_date) : null;
  const isPrebookingActive = Number(product.is_prebooking) === 1 && (!endDate || now <= endDate);
  const isPrebookingClosed = Number(product.is_prebooking) === 1 && !isPrebookingActive;
  const effectivePrice = isPrebookingClosed && product.post_prebooking_price > 0 ? product.post_prebooking_price : product.selling_price;

  const perPiecePrice = product.pieces_per_pack > 1 ? (effectivePrice / product.pieces_per_pack).toFixed(1) : null;
  const inStock = product.stock > 0;

  // Authentic Image Gallery: Chocolate bite & crunchy PB filling, 40-piece box, and product packaging
  const defaultGallery = [
    { image_url: '/chocolate-crunch-pb.jpg', label: 'Crunchy PB Center' },
    { image_url: '/madhurai-pack-box.jpg', label: '320g Pack Box' },
    { image_url: product.image_url || '/uploads/img_1792819113635_kijy.png', label: 'Artisanal Box' }
  ];
  const galleryImages = (product.images && product.images.length > 1) ? product.images : defaultGallery;
  const activeImage = selectedImage || galleryImages[0].image_url;

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    onNavigate('checkout');
  };

  return (
    <div style={{ padding: '40px 0 80px', backgroundColor: '#FFFFFF' }}>
      <div className="container">
        
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
          <button onClick={() => onNavigate('home')} style={{ color: 'var(--text-muted)' }}>Home</button>
          <span>/</span>
          <button onClick={() => onNavigate('products')} style={{ color: 'var(--text-muted)' }}>Chocolates</button>
          <span>/</span>
          <span style={{ color: 'var(--cacao-950)', fontWeight: '600' }}>{product.name}</span>
        </div>

        {/* Product Showcase Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          alignItems: 'flex-start',
          marginBottom: '60px'
        }}>
          
          {/* Left: Gallery Column */}
          <div>
            {/* Main Active Image View */}
            <div style={{
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              backgroundColor: 'var(--cream-100)',
              border: '1.5px solid var(--border-medium)',
              boxShadow: 'var(--shadow-md)',
              position: 'relative',
              marginBottom: '16px',
              paddingTop: '85%'
            }}>
              <img
                src={activeImage}
                alt={product.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/chocolate-crunch-pb.jpg';
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              {product.discount > 0 && (
                <span className="badge badge-gold" style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '0.85rem' }}>
                  {Math.round(product.discount)}% OFF
                </span>
              )}
            </div>

            {/* Thumbnail Row */}
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img.image_url)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: activeImage === img.image_url ? '2px solid var(--peanut-gold-600)' : '1px solid var(--border-medium)',
                    padding: '4px',
                    backgroundColor: '#FFFFFF',
                    flexShrink: 0,
                    cursor: 'pointer',
                    opacity: activeImage === img.image_url ? 1 : 0.7,
                    transition: 'var(--transition)'
                  }}
                  title={img.label || 'View image'}
                >
                  <img
                    src={img.image_url}
                    alt={img.label || product.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/chocolate-crunch-pb.jpg';
                    }}
                    style={{ width: '74px', height: '74px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                  {img.label && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--cacao-900)', fontWeight: 600 }}>
                      {img.label}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Product Info & Commerce Engine */}
          <div>
            
            <span style={{ fontSize: '0.84rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--peanut-gold-700)' }}>
              {product.category_name || 'Signature Creation'}
            </span>

            <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', color: 'var(--cacao-950)', margin: '8px 0 16px', lineHeight: '1.2' }}>
              {product.name}
            </h1>

            {/* Genuine Trust & Origin Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
              <span className="badge badge-dark" style={{ fontSize: '0.78rem', padding: '5px 10px' }}>
                Handcrafted in Gudur, AP
              </span>
              <span className="badge badge-green" style={{ fontSize: '0.78rem', padding: '5px 10px' }}>
                FSSAI Lic: 2018 2629000442
              </span>
              <span className="badge badge-gold" style={{ fontSize: '0.78rem', padding: '5px 10px' }}>
                Zero-Melt Cold-Pack Transit
              </span>
            </div>

            {/* Specs Pills */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <span className="badge badge-dark" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
                Weight: {product.weight}
              </span>
              <span className="badge badge-gold" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
                Pack: {product.pieces_per_pack} Pieces ({product.selling_unit})
              </span>
              {perPiecePrice && (
                <span className="badge badge-green" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
                  Just ₹{perPiecePrice} per bite!
                </span>
              )}
            </div>

            {/* Pre-Booking Highlight Box */}
            {isPrebookingActive && (
              <div style={{
                backgroundColor: '#FFFBEB',
                border: '2px solid #F59E0B',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                marginBottom: '24px',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={18} style={{ color: '#D97706' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Kunafa Chocolate Launch Offer • Pre-Booking Open
                  </span>
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#78350F', marginBottom: '10px' }}>
                  Pre-booking only until <span style={{ textDecoration: 'underline' }}>December 1, 2026</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid #FCD34D' }}>
                    <span style={{ fontSize: '0.75rem', color: '#78350F', display: 'block', fontWeight: '600' }}>Pay Now Online (Advance)</span>
                    <strong style={{ fontSize: '1.3rem', color: '#047857' }}>₹{product.prebooking_deposit * quantity}</strong>
                    <span style={{ fontSize: '0.72rem', color: '#047857', display: 'block' }}>₹{product.prebooking_deposit} / unit</span>
                  </div>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid #FCD34D' }}>
                    <span style={{ fontSize: '0.75rem', color: '#78350F', display: 'block', fontWeight: '600' }}>Balance on Delivery</span>
                    <strong style={{ fontSize: '1.3rem', color: '#B45309' }}>₹{product.balance_on_delivery * quantity}</strong>
                    <span style={{ fontSize: '0.72rem', color: '#B45309', display: 'block' }}>₹{product.balance_on_delivery} / unit</span>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#92400E', lineHeight: '1.4' }}>
                  ⚡ Pre-bookings close after Dec 1. After Dec 1, regular price increases to <strong>₹{product.post_prebooking_price}</strong> with full payment.
                </p>
              </div>
            )}

            {isPrebookingClosed && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #F87171',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                marginBottom: '20px',
                color: '#991B1B',
                fontSize: '0.88rem',
                fontWeight: '600'
              }}>
                Pre-bookings closed on Dec 1. Available at standard post-launch price: ₹{effectivePrice}.
              </div>
            )}

            {/* Price Box */}
            <div style={{
              backgroundColor: 'var(--cream-50)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '6px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--cacao-950)' }}>
                  ₹{effectivePrice}
                </span>
                {product.mrp > effectivePrice && (
                  <span style={{ fontSize: '1.4rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    ₹{product.mrp}
                  </span>
                )}
                {product.mrp > effectivePrice && (
                  <span style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--success-color)' }}>
                    Save ₹{(product.mrp - effectivePrice).toFixed(0)} ({Math.round(((product.mrp - effectivePrice) / product.mrp) * 100)}% OFF)
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {isPrebookingActive ? 'Total pre-booking price. Pay advance now, balance on doorstep delivery.' : 'Inclusive of all taxes. Free express cold-pack shipping on 5+ packs or orders ₹500+'}
              </span>
            </div>

            {/* Quantity Selector & Purchase Actions */}
            {inStock ? (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: '600', color: 'var(--cacao-900)' }}>Quantity:</span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1.5px solid var(--border-medium)',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: '#FFFFFF',
                    overflow: 'hidden'
                  }}>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      style={{ padding: '8px 16px', color: 'var(--cacao-900)' }}
                      title="Decrease Quantity"
                    >
                      <Minus size={16} />
                    </button>
                    <span style={{ padding: '0 12px', fontWeight: '700', minWidth: '36px', textAlign: 'center' }}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      style={{ padding: '8px 16px', color: 'var(--cacao-900)' }}
                      title="Increase Quantity"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {quantity >= 5 && (
                    <span className="badge badge-green">
                      🎉 Free Delivery Applied!
                    </span>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleAddToCart}
                    className="btn btn-primary btn-lg"
                    style={{ flex: 1, minWidth: '180px' }}
                  >
                    <ShoppingBag size={20} />
                    <span>{isPrebookingActive ? 'Pre-Book (Add to Bag)' : 'Add to Cart'}</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    className="btn btn-gold btn-lg"
                    style={{ flex: 1, minWidth: '180px' }}
                  >
                    <span>{isPrebookingActive ? `Pre-Book (Pay ₹${product.prebooking_deposit * quantity} Now)` : 'Buy Now'}</span>
                  </button>

                  <button
                    onClick={() => toggleWishlist(product)}
                    className="btn btn-outline"
                    style={{ padding: '12px 18px' }}
                    title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart size={20} fill={wishlisted ? 'var(--danger-color)' : 'none'} color={wishlisted ? 'var(--danger-color)' : 'var(--cacao-900)'} />
                  </button>
                </div>

                {addedToast && (
                  <div style={{
                    marginTop: '14px',
                    padding: '12px 18px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#D1FAE5',
                    color: '#065F46',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Check size={18} />
                    <span>Added {quantity} box(es) of {product.name} to cart!</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#FEE2E2',
                color: 'var(--danger-color)',
                fontWeight: '700',
                marginBottom: '24px'
              }}>
                This handcrafted batch is currently sold out. New small batch roasting in progress!
              </div>
            )}

            {/* Live Pincode Delivery Availability Checker */}
            <DeliveryChecker product={product} />

          </div>
        </div>

        {/* Tabbed In-Depth Information: Description, Ingredients & Nutrition */}
        <div style={{ marginTop: '48px', borderTop: '1px solid var(--border-medium)', paddingTop: '40px' }}>
          
          <div style={{ display: 'flex', gap: '24px', borderBottom: '2px solid var(--border-subtle)', marginBottom: '32px' }}>
            <button
              onClick={() => setActiveTab('description')}
              style={{
                padding: '12px 0',
                fontWeight: '700',
                fontSize: '1.05rem',
                color: activeTab === 'description' ? 'var(--peanut-gold-700)' : 'var(--text-muted)',
                borderBottom: activeTab === 'description' ? '3px solid var(--peanut-gold-600)' : '3px solid transparent',
                marginBottom: '-2px'
              }}
            >
              Description & Craft
            </button>

            <button
              onClick={() => setActiveTab('ingredients')}
              style={{
                padding: '12px 0',
                fontWeight: '700',
                fontSize: '1.05rem',
                color: activeTab === 'ingredients' ? 'var(--peanut-gold-700)' : 'var(--text-muted)',
                borderBottom: activeTab === 'ingredients' ? '3px solid var(--peanut-gold-600)' : '3px solid transparent',
                marginBottom: '-2px'
              }}
            >
              Ingredients & Allergens
            </button>

            <button
              onClick={() => setActiveTab('nutrition')}
              style={{
                padding: '12px 0',
                fontWeight: '700',
                fontSize: '1.05rem',
                color: activeTab === 'nutrition' ? 'var(--peanut-gold-700)' : 'var(--text-muted)',
                borderBottom: activeTab === 'nutrition' ? '3px solid var(--peanut-gold-600)' : '3px solid transparent',
                marginBottom: '-2px'
              }}
            >
              Nutrition Facts
            </button>
          </div>

          {/* Description Tab Content */}
          {activeTab === 'description' && (
            <div style={{ maxWidth: '800px', fontSize: '1.02rem', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: '16px' }}>{product.description}</p>
              <h4 style={{ color: 'var(--cacao-950)', fontSize: '1.2rem', margin: '20px 0 10px' }}>Craftsmanship Behind Every Piece:</h4>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Small-batch tempering ensures a crisp shell that breaks with a distinct snap.</li>
                <li>Stone-ground peanut butter filling contains whole crunchy nibs for an authentic mouthfeel.</li>
                <li>Seasoned with delicate mineral-rich sea salt to balance dark chocolate intensity.</li>
                <li>Each piece is sealed in gold protective foil to preserve aroma and crispness for up to 6 months.</li>
              </ul>
            </div>
          )}

          {/* Ingredients Tab Content */}
          {activeTab === 'ingredients' && (
            <div style={{ maxWidth: '800px', fontSize: '1rem', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
              <div style={{ backgroundColor: 'var(--cream-50)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}>
                <h4 style={{ color: 'var(--cacao-950)', marginBottom: '12px' }}>Verified Ingredients List:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
                  {['Cocoa Powder', 'Roasted Peanuts', 'Peanut Butter', 'Vegetable Fat (0% Palm Oil)', 'Milk Powders', 'Sugar', 'Sugar Syrup', 'Vanilla Essence', 'Sea Salt'].map((item, idx) => (
                    <span key={idx} style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--border-medium)',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      color: 'var(--cacao-950)'
                    }}>
                      ✓ {item}
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Handcrafted using quality vegetable fat. Strictly zero liquid palm oil and zero trans fat for a pure, silky melt.
                </p>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  color: '#92400E',
                  fontWeight: 600,
                  fontSize: '0.86rem'
                }}>
                  ⚠️ Allergen Information: Contains Peanuts and Dairy. Handcrafted in our dedicated facility in Gudur, Andhra Pradesh.
                </div>
              </div>
            </div>
          )}

          {/* Nutrition Tab Content */}
          {activeTab === 'nutrition' && (
            <div style={{ maxWidth: '640px' }}>
              <div style={{ backgroundColor: 'var(--cream-50)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ color: 'var(--cacao-950)', margin: 0 }}>Nutritional Information</h4>
                  <span className="badge badge-dark" style={{ fontSize: '0.74rem' }}>FSSAI Tested</span>
                </div>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'block', marginBottom: '16px' }}>
                  Values per 100g & per piece (~8g bite)
                </span>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-medium)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <th style={{ padding: '8px 0' }}>Nutrient</th>
                      <th style={{ padding: '8px 0', textAlign: 'right' }}>Per 100g</th>
                      <th style={{ padding: '8px 0', textAlign: 'right' }}>Per Piece (~8g)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-medium)' }}>
                      <td style={{ padding: '10px 0', fontWeight: '600' }}>Energy / Calories</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '700' }}>526 kcal</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--peanut-gold-700)', fontWeight: '700' }}>~42 kcal</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-medium)' }}>
                      <td style={{ padding: '8px 0', fontWeight: '600' }}>Protein</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>9.2g</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>~0.74g</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-medium)' }}>
                      <td style={{ padding: '8px 0', fontWeight: '600' }}>Carbohydrates</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>58g</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>~4.64g</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-medium)' }}>
                      <td style={{ padding: '8px 0', paddingLeft: '12px', color: 'var(--text-secondary)' }}>• Total Sugars</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>48.5g</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>~3.88g</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-medium)' }}>
                      <td style={{ padding: '8px 0', paddingLeft: '12px', color: 'var(--text-secondary)' }}>• Added Sugars</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>44.5g</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>~3.56g</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-medium)' }}>
                      <td style={{ padding: '8px 0', fontWeight: '600' }}>Total Fats</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>29.5g</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>~2.36g</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-medium)' }}>
                      <td style={{ padding: '8px 0', paddingLeft: '12px', color: 'var(--text-secondary)' }}>• Saturated Fat</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>19.6g</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>~1.57g</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-medium)' }}>
                      <td style={{ padding: '8px 0', paddingLeft: '12px', color: 'var(--text-secondary)' }}>• Trans Fat</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', color: 'var(--success-color)', fontWeight: 600 }}>0.1g</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', color: 'var(--success-color)' }}>&lt; 0.01g</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 0', fontWeight: '600' }}>Sodium</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>110mg</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>~8.8mg</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Mobile Sticky Buy Bar for 1-Tap Purchase */}
      {inStock && (
        <div className="mobile-sticky-bar" style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          padding: '12px 18px',
          boxShadow: '0 -4px 20px rgba(18, 9, 5, 0.15)',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 980,
          borderTop: '1px solid var(--border-medium)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--cacao-950)' }}>
                ₹{product.selling_price}
              </span>
              {product.mrp > product.selling_price && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  ₹{product.mrp}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--peanut-gold-700)', fontWeight: 700 }}>
              {product.weight} • {product.pieces_per_pack} pieces
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAddToCart}
              className="btn btn-primary"
              style={{ padding: '10px 14px', fontSize: '0.85rem' }}
              aria-label="Add product to cart"
            >
              <ShoppingBag size={16} />
              <span>Add</span>
            </button>
            <button
              onClick={handleBuyNow}
              className="btn btn-gold"
              style={{ padding: '10px 18px', fontSize: '0.85rem' }}
              aria-label="Buy product now"
            >
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
