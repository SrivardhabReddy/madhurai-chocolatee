import React, { useState, useEffect } from 'react';
import { ShoppingBag, Heart, User, Search, Menu, X, MapPin, Truck, ChevronDown, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

export default function Navbar({ onNavigate, currentPage }) {
  const { totalItems, wishlist } = useCart();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdown, setUserDropdown] = useState(false);
  const [areaLimit, setAreaLimit] = useState(null);

  useEffect(() => {
    api.getDeliveryAreaLimit()
      .then(res => {
        if (res.success && res.data) setAreaLimit(res.data);
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('products', { q: searchQuery.trim() });
      setSearchOpen(false);
    }
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(253, 251, 247, 0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border-subtle)' }}>
      {/* Top Promotional Ribbon */}
      <div className="promo-ribbon" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', flexWrap: 'wrap', padding: '6px 16px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Truck size={14} style={{ color: 'var(--peanut-gold-400)' }} />
          <span>
            {areaLimit?.bannerText || '🚚 Handcrafted Fresh Cacao: Express Delivery available up to Nellore & South Hubs!'}
          </span>
        </span>
        <span style={{ opacity: 0.9, fontSize: '0.78rem', backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
          {areaLimit?.active ? `📍 Service Area Limit: Upto ${areaLimit.limitCity}` : '🇮🇳 Pan-India Shipping'}
        </span>
      </div>

      {/* Main Header Container */}
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '76px' }}>
        
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate('home')} 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--cacao-850) 0%, var(--cacao-950) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--peanut-gold-400)',
            fontWeight: '800',
            fontSize: '1.4rem',
            border: '1.5px solid rgba(245, 158, 11, 0.4)',
            boxShadow: '0 4px 12px rgba(38, 20, 11, 0.15)'
          }}>
            M
          </div>
          <div>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.55rem',
              fontWeight: '800',
              letterSpacing: '-0.02em',
              color: 'var(--cacao-950)',
              display: 'block',
              lineHeight: 1.1
            }}>
              Madhurai
            </span>
            <span style={{
              fontSize: '0.68rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--peanut-gold-700)',
              fontWeight: '700',
              display: 'block'
            }}>
              Artisanal Chocolate
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="desktop-nav">
          <button 
            onClick={() => onNavigate('home')}
            style={{ 
              fontWeight: currentPage === 'home' ? '700' : '500', 
              color: currentPage === 'home' ? 'var(--peanut-gold-700)' : 'var(--cacao-900)',
              fontSize: '0.94rem'
            }}
          >
            Home
          </button>
          <button 
            onClick={() => onNavigate('products')}
            style={{ 
              fontWeight: currentPage === 'products' ? '700' : '500', 
              color: currentPage === 'products' ? 'var(--peanut-gold-700)' : 'var(--cacao-900)',
              fontSize: '0.94rem'
            }}
          >
            All Chocolates
          </button>
          <button 
            onClick={() => onNavigate('product_detail', { slug: 'chocolate-crunch-peanut-butter-inside' })}
            style={{ 
              fontWeight: '700', 
              color: 'var(--cacao-900)',
              fontSize: '0.94rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Peanut Butter Crunch</span>
            <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>Must Try</span>
          </button>
          <button 
            onClick={() => onNavigate('track_order')}
            style={{ 
              fontWeight: currentPage === 'track_order' ? '700' : '500', 
              color: currentPage === 'track_order' ? 'var(--peanut-gold-700)' : 'var(--cacao-900)',
              fontSize: '0.94rem'
            }}
          >
            Track Order
          </button>
          <button 
            onClick={() => onNavigate('articles')}
            style={{ 
              fontWeight: (currentPage === 'articles' || currentPage === 'article_detail') ? '700' : '500', 
              color: (currentPage === 'articles' || currentPage === 'article_detail') ? 'var(--peanut-gold-700)' : 'var(--cacao-900)',
              fontSize: '0.94rem'
            }}
          >
            Articles & Stories
          </button>
          <button 
            onClick={() => onNavigate('about')}
            style={{ 
              fontWeight: currentPage === 'about' ? '700' : '500', 
              color: currentPage === 'about' ? 'var(--peanut-gold-700)' : 'var(--cacao-900)',
              fontSize: '0.94rem'
            }}
          >
            Our Heritage
          </button>
        </nav>

        {/* Right Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          {/* Search Toggle */}
          <button 
            onClick={() => setSearchOpen(!searchOpen)}
            style={{ padding: '8px', color: 'var(--cacao-900)', display: 'flex', alignItems: 'center' }}
            title="Search"
          >
            <Search size={21} />
          </button>

          {/* Wishlist */}
          <button 
            onClick={() => onNavigate('wishlist')}
            style={{ position: 'relative', padding: '8px', color: 'var(--cacao-900)', display: 'flex', alignItems: 'center' }}
            title="Wishlist"
          >
            <Heart size={21} />
            {wishlist.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                background: 'var(--peanut-gold-600)',
                color: '#fff',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '0.7rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart with Counter Badge */}
          <button 
            onClick={() => onNavigate('cart')}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, var(--cacao-900) 0%, var(--cacao-950) 100%)',
              color: 'var(--peanut-gold-200)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              boxShadow: '0 4px 12px rgba(38, 20, 11, 0.2)'
            }}
          >
            <ShoppingBag size={18} style={{ color: 'var(--peanut-gold-400)' }} />
            <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Cart</span>
            {totalItems > 0 && (
              <span style={{
                background: 'var(--peanut-gold-500)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-full)',
                padding: '2px 8px',
                fontSize: '0.76rem',
                fontWeight: '800'
              }}>
                {totalItems}
              </span>
            )}
          </button>

          {/* User Account / Profile */}
          <div style={{ position: 'relative' }}>
            {user ? (
              <div>
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--cream-100)',
                    color: 'var(--cacao-900)',
                    fontSize: '0.88rem',
                    fontWeight: '600'
                  }}
                >
                  <User size={16} />
                  <span>{user.full_name?.split(' ')[0]}</span>
                  <ChevronDown size={14} />
                </button>

                {userDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '110%',
                    right: 0,
                    width: '200px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--border-subtle)',
                    padding: '8px 0',
                    zIndex: 200
                  }}>
                    <button
                      onClick={() => { onNavigate('account'); setUserDropdown(false); }}
                      style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '0.88rem', color: 'var(--cacao-900)' }}
                    >
                      My Account & Orders
                    </button>
                    <button
                      onClick={() => { onNavigate('wishlist'); setUserDropdown(false); }}
                      style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '0.88rem', color: 'var(--cacao-900)' }}
                    >
                      My Wishlist
                    </button>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
                    <button
                      onClick={() => { logout(); setUserDropdown(false); }}
                      style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '0.88rem', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <LogOut size={14} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1.5px solid var(--border-medium)',
                  color: 'var(--cacao-900)',
                  fontSize: '0.88rem',
                  fontWeight: '600'
                }}
              >
                <User size={16} />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="mobile-menu-btn"
            style={{ display: 'none', padding: '8px' }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {searchOpen && (
        <div style={{ backgroundColor: 'var(--cream-100)', padding: '14px 0', borderTop: '1px solid var(--border-subtle)' }}>
          <div className="container">
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', maxWidth: '600px', margin: '0 auto' }}>
              <input
                type="text"
                placeholder="Search handcrafted chocolates, peanut butter crunch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="form-input"
                style={{ borderRadius: 'var(--radius-full)' }}
              />
              <button type="submit" className="btn btn-primary btn-sm">Search</button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }} style={{ textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Home</button>
            <button onClick={() => { onNavigate('products'); setMobileMenuOpen(false); }} style={{ textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>All Chocolates</button>
            <button onClick={() => { onNavigate('product_detail', { slug: 'chocolate-crunch-peanut-butter-inside' }); setMobileMenuOpen(false); }} style={{ textAlign: 'left', fontWeight: '700', color: 'var(--peanut-gold-700)', fontSize: '1rem' }}>Peanut Butter Crunch</button>
            <button onClick={() => { onNavigate('track_order'); setMobileMenuOpen(false); }} style={{ textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Track Order</button>
            <button onClick={() => { onNavigate('articles'); setMobileMenuOpen(false); }} style={{ textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Articles & Stories</button>
            <button onClick={() => { onNavigate('about'); setMobileMenuOpen(false); }} style={{ textAlign: 'left', fontWeight: '600', fontSize: '1rem' }}>Our Heritage</button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
