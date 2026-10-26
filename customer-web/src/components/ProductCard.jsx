import React from 'react';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';

export default function ProductCard({ product, onNavigate }) {
  const { addItem, toggleWishlist, isWishlisted } = useCart();
  const wishlisted = isWishlisted(product.id);

  const primaryImage = product.primary_image?.image_url || product.image_url || product.images?.[0]?.image_url || '/chocolate-crunch-pb.jpg';
  const perPiecePrice = product.pieces_per_pack > 1 ? (product.selling_price / product.pieces_per_pack).toFixed(1) : null;
  const inStock = product.stock > 0;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      {/* Product Image Container */}
      <div 
        onClick={() => onNavigate('product_detail', { slug: product.slug || product.id, id: product.id })}
        style={{
          position: 'relative',
          paddingTop: '85%',
          overflow: 'hidden',
          backgroundColor: '#F7F2EB',
          cursor: 'pointer'
        }}
      >
        <img
          src={primaryImage}
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
            objectFit: 'cover',
            transition: 'transform 0.4s ease'
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />

        {/* Badges Overlays */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {product.discount > 0 && (
            <span className="badge badge-gold">
              {Math.round(product.discount)}% OFF
            </span>
          )}
          {product.is_bestseller === 1 && (
            <span className="badge badge-dark">
              Bestseller
            </span>
          )}
          {product.is_new === 1 && (
            <span className="badge badge-green">
              New Batch
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            color: wishlisted ? 'var(--danger-color)' : 'var(--cacao-800)',
            transition: 'transform 0.2s ease'
          }}
          title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart size={18} fill={wishlisted ? 'var(--danger-color)' : 'none'} />
        </button>

        {/* Out of stock overlay */}
        {!inStock && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(28, 15, 8, 0.65)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: '700',
            fontSize: '1rem',
            letterSpacing: '0.05em'
          }}>
            OUT OF STOCK
          </div>
        )}
      </div>

      {/* Product Content */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          {/* Unit & Pieces Info */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: '600', color: 'var(--peanut-gold-700)' }}>
              {product.weight} • {product.selling_unit}
            </span>
            {product.pieces_per_pack > 1 && (
              <span>{product.pieces_per_pack} pieces</span>
            )}
          </div>

          {/* Title */}
          <h3 
            onClick={() => onNavigate('product_detail', { slug: product.slug || product.id, id: product.id })}
            style={{
              fontSize: '1.08rem',
              fontWeight: '700',
              lineHeight: '1.35',
              marginBottom: '10px',
              color: 'var(--cacao-950)',
              cursor: 'pointer'
            }}
          >
            {product.name}
          </h3>

          {/* Price Breakdown */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--cacao-950)' }}>
              ₹{product.selling_price}
            </span>
            {product.mrp > product.selling_price && (
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                ₹{product.mrp}
              </span>
            )}
          </div>

          {/* Individual piece price */}
          {perPiecePrice && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Individual price: <strong style={{ color: 'var(--peanut-gold-700)' }}>₹{perPiecePrice} per piece</strong>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div>
          {inStock ? (
            <button
              onClick={() => addItem(product, 1)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px 16px', fontSize: '0.9rem' }}
            >
              <ShoppingBag size={16} />
              <span>Add to Cart</span>
            </button>
          ) : (
            <button
              disabled
              style={{
                width: '100%',
                padding: '10px 16px',
                fontSize: '0.88rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--cream-200)',
                color: 'var(--text-muted)',
                cursor: 'not-allowed'
              }}
            >
              Sold Out
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
