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

export default function ProductDetail({ slug, onNavigate }) {
  const { addItem, toggleWishlist, isWishlisted } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('description'); // 'description', 'ingredients', 'nutrition'
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getProductBySlug(slug)
      .then(res => {
        if (res.success && res.data) {
          setProduct(res.data);
          const primary = res.data.primary_image?.image_url || res.data.images?.[0]?.image_url || '/chocolate-crunch-pb.jpg';
          setSelectedImage(primary);
        } else {
          setError('Product not found.');
        }
      })
      .catch(err => {
        setError(err.message || 'Error loading product.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

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
  const perPiecePrice = product.pieces_per_pack > 1 ? (product.selling_price / product.pieces_per_pack).toFixed(1) : null;
  const inStock = product.stock > 0;

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
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '48px',
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
              paddingTop: '90%'
            }}>
              <img
                src={selectedImage}
                alt={product.name}
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
            {product.images && product.images.length > 1 && (
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img.image_url)}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      border: selectedImage === img.image_url ? '2px solid var(--peanut-gold-600)' : '1px solid var(--border-medium)',
                      padding: 0,
                      flexShrink: 0,
                      opacity: selectedImage === img.image_url ? 1 : 0.7
                    }}
                  >
                    <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info & Commerce Engine */}
          <div>
            
            <span style={{ fontSize: '0.84rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--peanut-gold-700)' }}>
              {product.category_name || 'Artisanal Selection'}
            </span>

            <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', color: 'var(--cacao-950)', margin: '8px 0 16px', lineHeight: '1.2' }}>
              {product.name}
            </h1>

            {/* Quality & Craftsmanship Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '2px', color: 'var(--peanut-gold-500)' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="var(--peanut-gold-500)" />)}
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--cacao-900)' }}>Artisanal Selection</span>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>• Handcrafted Quality</span>
            </div>

            {/* Specs Pills */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <span className="badge badge-dark" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
                Weight: {product.weight}
              </span>
              <span className="badge badge-gold" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
                Pack: {product.pieces_per_pack} Pieces ({product.selling_unit})
              </span>
              {perPiecePrice && (
                <span className="badge badge-green" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
                  ₹{perPiecePrice} per piece
                </span>
              )}
            </div>

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
                  ₹{product.selling_price}
                </span>
                {product.mrp > product.selling_price && (
                  <span style={{ fontSize: '1.4rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    ₹{product.mrp}
                  </span>
                )}
                {product.discount > 0 && (
                  <span style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--success-color)' }}>
                    Save ₹{(product.mrp - product.selling_price).toFixed(0)} ({Math.round(product.discount)}% OFF)
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Inclusive of all taxes. Free express cold-pack shipping on 5+ packs or orders ₹500+
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
                    <span>Add to Cart</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    className="btn btn-gold btn-lg"
                    style={{ flex: 1, minWidth: '180px' }}
                  >
                    <span>Buy Now</span>
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
                <h4 style={{ color: 'var(--cacao-950)', marginBottom: '8px' }}>Complete Ingredients:</h4>
                <p style={{ marginBottom: '16px' }}>{product.ingredients || 'Dark Cocoa Solids, Roasted Peanuts, Sugar, Vegetable Fat, Natural Vanilla Extract. (0% Palm Oil & Zero Trans Fat)'}</p>
                <div style={{ color: 'var(--danger-color)', fontWeight: '600', fontSize: '0.9rem' }}>
                  ⚠️ Allergen Advice: Contains Peanuts and Dairy. Handcrafted in a dedicated nut facility in Gudur, Andhra Pradesh.
                </div>
              </div>
            </div>
          )}

          {/* Nutrition Tab Content */}
          {activeTab === 'nutrition' && (
            <div style={{ maxWidth: '600px' }}>
              <div style={{ backgroundColor: 'var(--cream-50)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}>
                <h4 style={{ color: 'var(--cacao-950)', marginBottom: '4px' }}>Nutritional Information</h4>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'block', marginBottom: '16px' }}>
                  Serving Size: {product.nutrition_data?.serving_size || '1 piece (12.5g)'}
                </span>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-medium)', padding: '8px 0' }}>
                      <td style={{ padding: '8px 0', fontWeight: '600' }}>Energy / Calories</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700' }}>{product.nutrition_data?.calories || '68 kcal'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-medium)' }}>
                      <td style={{ padding: '8px 0', fontWeight: '600' }}>Protein</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>{product.nutrition_data?.protein || '2.2g'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-medium)' }}>
                      <td style={{ padding: '8px 0', fontWeight: '600' }}>Total Fat</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>{product.nutrition_data?.total_fat || '4.6g'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-medium)' }}>
                      <td style={{ padding: '8px 0', fontWeight: '600' }}>Carbohydrates</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>{product.nutrition_data?.carbohydrates || '5.1g'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-medium)' }}>
                      <td style={{ padding: '8px 0', fontWeight: '600' }}>Dietary Fiber</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>{product.nutrition_data?.dietary_fiber || '0.8g'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 0', fontWeight: '600' }}>Sodium</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>{product.nutrition_data?.sodium || '18mg'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
