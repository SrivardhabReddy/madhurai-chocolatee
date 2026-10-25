import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, User, ArrowLeft, ArrowRight, Share2, Sparkles, ShoppingBag } from 'lucide-react';
import { api } from '../services/api.js';

export default function Articles({ slug, onNavigate }) {
  const [articles, setArticles] = useState([]);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [articleLoading, setArticleLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) {
      setArticleLoading(true);
      fetch(`/api/articles/${slug}`)
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            setCurrentArticle(res.data);
          } else {
            setCurrentArticle(null);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setArticleLoading(false));
    } else {
      setCurrentArticle(null);
    }
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/articles')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setArticles(res.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Single Article Reader View
  if (slug || currentArticle) {
    if (articleLoading) {
      return (
        <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading story...</p>
        </div>
      );
    }

    if (!currentArticle) {
      return (
        <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--cacao-950)', marginBottom: '16px' }}>Article Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>The story you are looking for may have been moved or unpublished.</p>
          <button onClick={() => onNavigate('articles')} className="btn btn-primary">
            Back to All Articles
          </button>
        </div>
      );
    }

    const paragraphs = currentArticle.content ? currentArticle.content.split('\n\n') : [];

    return (
      <div style={{ backgroundColor: '#FFFFFF', paddingBottom: '100px' }}>
        {/* Back Link */}
        <div style={{ backgroundColor: 'var(--cream-50)', borderBottom: '1px solid var(--border-subtle)', padding: '16px 0' }}>
          <div className="container" style={{ maxWidth: '840px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => onNavigate('articles')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}
            >
              <ArrowLeft size={16} />
              <span>Back to Articles</span>
            </button>

            <button
              onClick={handleShare}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--peanut-gold-700)', fontWeight: '600' }}
            >
              <Share2 size={14} />
              <span>{copied ? 'Link Copied!' : 'Share Story'}</span>
            </button>
          </div>
        </div>

        <article className="container" style={{ maxWidth: '800px', paddingTop: '40px' }}>
          {/* Tags & Read Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span className="badge badge-gold" style={{ fontSize: '0.78rem' }}>
              {currentArticle.tags ? currentArticle.tags.split(',')[0] : 'Craftsmanship'}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <Clock size={14} />
              <span>{currentArticle.read_time || '3 min read'}</span>
            </span>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '2.5rem', lineHeight: 1.25, color: 'var(--cacao-950)', marginBottom: '20px' }}>
            {currentArticle.title}
          </h1>

          {/* Author & Date Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-medium)', paddingBottom: '20px', marginBottom: '32px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'var(--cacao-900)',
              color: 'var(--peanut-gold-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800'
            }}>
              M
            </div>
            <div>
              <div style={{ fontWeight: '700', color: 'var(--cacao-950)', fontSize: '0.95rem' }}>
                {currentArticle.author_name || 'Madhurai Chocolatier'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={12} />
                <span>{new Date(currentArticle.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Hero Cover Image */}
          {currentArticle.cover_image && (
            <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '40px', boxShadow: 'var(--shadow-md)' }}>
              <img
                src={currentArticle.cover_image}
                alt={currentArticle.title}
                style={{ width: '100%', maxHeight: '440px', objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}

          {/* Excerpt Lead */}
          {currentArticle.excerpt && (
            <p style={{ fontSize: '1.2rem', lineHeight: 1.7, color: 'var(--cacao-950)', fontWeight: '600', marginBottom: '32px', fontStyle: 'italic', borderLeft: '3px solid var(--peanut-gold-500)', paddingLeft: '20px' }}>
              {currentArticle.excerpt}
            </p>
          )}

          {/* Article Body Content */}
          <div style={{ fontSize: '1.1rem', lineHeight: 1.85, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {paragraphs.map((p, idx) => (
              <p key={idx} style={{ margin: 0 }}>
                {p}
              </p>
            ))}
          </div>

          {/* Article Footer & Call to Action */}
          <div style={{
            marginTop: '60px',
            padding: '36px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--cream-50)',
            border: '1.5px solid var(--border-medium)',
            textAlign: 'center'
          }}>
            <Sparkles size={28} style={{ color: 'var(--peanut-gold-600)', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.4rem', color: 'var(--cacao-950)', marginBottom: '8px' }}>
              Experience the Craftsmanship
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 24px', fontSize: '0.94rem' }}>
              Handcrafted in Gudur, Andhra Pradesh with premium vegetable fat, stone-ground peanut centers, zero palm oil, and zero trans fat.
            </p>
            <button
              onClick={() => onNavigate('products')}
              className="btn btn-gold btn-lg"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <ShoppingBag size={18} />
              <span>Explore Chocolates</span>
            </button>
          </div>
        </article>
      </div>
    );
  }

  // Articles Catalog List View
  return (
    <div style={{ padding: '60px 0 100px', backgroundColor: 'var(--cream-50)' }}>
      <div className="container">
        
        {/* Header Banner */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 50px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--peanut-gold-700)' }}>
            The Chocolate Journal
          </span>
          <h1 style={{ fontSize: '2.8rem', color: 'var(--cacao-950)', margin: '10px 0 16px', lineHeight: 1.2 }}>
            Stories, Craftsmanship & News
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7 }}>
            Discover how we craft our signature peanut butter crunch chocolates in Gudur, Andhra Pradesh, from small-batch tempering to fresh doorstep dispatch.
          </p>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            Loading articles...
          </div>
        ) : articles.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '32px'
          }}>
            {articles.map(art => (
              <div
                key={art.id}
                onClick={() => onNavigate('article_detail', { slug: art.slug })}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                {/* Cover Image */}
                <div style={{ height: '220px', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--cacao-900)' }}>
                  {art.cover_image ? (
                    <img
                      src={art.cover_image}
                      alt={art.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cream-300)' }}>
                      <BookOpen size={40} />
                    </div>
                  )}
                  {art.tags && (
                    <span
                      className="badge badge-gold"
                      style={{ position: 'absolute', bottom: '12px', left: '12px', fontSize: '0.72rem' }}
                    >
                      {art.tags.split(',')[0]}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    <Calendar size={13} />
                    <span>{new Date(art.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>•</span>
                    <Clock size={13} />
                    <span>{art.read_time || '3 min read'}</span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', color: 'var(--cacao-950)', marginBottom: '10px', lineHeight: 1.35, fontWeight: '700' }}>
                    {art.title}
                  </h3>

                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px', flex: 1 }}>
                    {art.excerpt || 'Read the full story from the Madhurai Chocolaterie in Gudur...'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      By {art.author_name}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--peanut-gold-700)', fontWeight: '700' }}>
                      <span>Read Story</span>
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)' }}>
            <BookOpen size={42} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <h3 style={{ color: 'var(--cacao-950)', marginBottom: '6px' }}>No stories published yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Stay tuned for our latest confectionery journal stories.</p>
          </div>
        )}

      </div>
    </div>
  );
}
