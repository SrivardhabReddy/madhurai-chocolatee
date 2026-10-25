import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { api } from '../services/api.js';
import ProductCard from '../components/ProductCard.jsx';

export default function Catalog({ initialCategory, initialQuery, onNavigate }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState(initialQuery || '');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured'); // 'featured', 'bestseller', 'newest', 'price_asc', 'price_desc', 'discount'

  useEffect(() => {
    api.getCategories().then(res => {
      if (res.success) setCategories(res.data);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getProducts({
      q: search,
      category: selectedCategory,
      min_price: minPrice,
      max_price: maxPrice,
      in_stock: inStockOnly ? 'true' : undefined,
      sort: sortBy
    }).then(res => {
      if (res.success) setProducts(res.data);
    }).finally(() => setLoading(false));
  }, [search, selectedCategory, minPrice, maxPrice, inStockOnly, sortBy]);

  return (
    <div style={{ padding: '40px 0 80px', backgroundColor: '#FFFFFF' }}>
      <div className="container">
        
        {/* Header */}
        <div style={{ marginBottom: '36px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.6rem', color: 'var(--cacao-950)', marginBottom: '8px' }}>
            Handcrafted Chocolates
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Single-origin South Indian dark cocoa creations and crunchy roasted peanut butter specials
          </p>
        </div>

        {/* Toolbar & Filter Bar */}
        <div style={{
          backgroundColor: 'var(--cream-50)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-medium)',
          marginBottom: '36px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, chocolate, or ingredient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px', borderRadius: 'var(--radius-full)' }}
            />
          </div>

          {/* Category Filter Dropdown */}
          <div style={{ flex: '0 1 200px' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-select"
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div style={{ flex: '0 1 190px' }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select"
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              <option value="featured">Sort: Featured</option>
              <option value="bestseller">Sort: Best Sellers</option>
              <option value="newest">Sort: Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="discount">Highest Discount</option>
            </select>
          </div>

          {/* In Stock Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '600', color: 'var(--cacao-900)' }}>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <span>In-Stock Only</span>
          </label>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <h3>Loading fresh batches...</h3>
          </div>
        ) : products.length > 0 ? (
          <div className="product-grid">
            {products.map(product => (
              <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <h3 style={{ color: 'var(--cacao-950)', marginBottom: '8px' }}>No chocolates found matching your filters</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Try clearing your search or category filters</p>
            <button
              onClick={() => { setSearch(''); setSelectedCategory(''); setMinPrice(''); setMaxPrice(''); setInStockOnly(false); }}
              className="btn btn-outline"
            >
              Reset Filters
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
