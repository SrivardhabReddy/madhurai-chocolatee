import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import WhatsAppButton from './components/WhatsAppButton.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderSuccess from './pages/OrderSuccess.jsx';
import TrackOrder from './pages/TrackOrder.jsx';
import { Login, Register, ForgotPassword } from './pages/AuthPages.jsx';
import Account from './pages/Account.jsx';
import Articles from './pages/Articles.jsx';
import { About, Contact, ShippingPolicy, RefundPolicy, PrivacyPolicy, Terms } from './pages/StaticPages.jsx';
import { trackPageView } from './utils/visitorTracker.js';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageParams, setPageParams] = useState({});

  // Sync with browser URL / history
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/' || path === '') {
        setCurrentPage('home');
      } else if (path.startsWith('/order-success/')) {
        const orderId = path.replace('/order-success/', '').split('/')[0].split('?')[0];
        setCurrentPage('order_success');
        setPageParams({ orderId });
      } else if (path === '/order-success') {
        const queryParams = new URLSearchParams(window.location.search);
        const orderId = queryParams.get('orderId') || queryParams.get('order_id');
        setCurrentPage('order_success');
        setPageParams({ orderId: orderId || '' });
      } else if (path.startsWith('/account/orders/')) {
        const orderId = path.replace('/account/orders/', '').split('/')[0].split('?')[0];
        setCurrentPage('order_detail');
        setPageParams({ orderId });
      } else if (path.startsWith('/products/')) {
        const slug = path.replace('/products/', '');
        setCurrentPage('product_detail');
        setPageParams({ slug });
      } else if (path.startsWith('/articles/')) {
        const slug = path.replace('/articles/', '');
        setCurrentPage('article_detail');
        setPageParams({ slug });
      } else if (path === '/articles') {
        setCurrentPage('articles');
        setPageParams({});
      } else if (path === '/products') {
        setCurrentPage('products');
      } else if (path === '/cart') {
        setCurrentPage('cart');
      } else if (path === '/checkout') {
        setCurrentPage('checkout');
      } else if (path === '/track-order') {
        setCurrentPage('track_order');
      } else if (path === '/login') {
        setCurrentPage('login');
      } else if (path === '/register') {
        setCurrentPage('register');
      } else if (path === '/forgot-password') {
        setCurrentPage('forgot_password');
      } else if (path.startsWith('/account')) {
        setCurrentPage('account');
      } else if (path === '/wishlist') {
        setCurrentPage('wishlist');
      } else if (path === '/about') {
        setCurrentPage('about');
      } else if (path === '/contact') {
        setCurrentPage('contact');
      } else if (path === '/faq') {
        setCurrentPage('faq');
      } else if (path === '/shipping-policy') {
        setCurrentPage('shipping_policy');
      } else if (path === '/cancellation-refund-policy') {
        setCurrentPage('refund_policy');
      } else if (path === '/privacy-policy') {
        setCurrentPage('privacy_policy');
      } else if (path === '/terms') {
        setCurrentPage('terms');
      }
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState();
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const resolvePagePath = (page, params = {}) => {
    if (page === 'products') return params.category ? `/categories/${params.category}` : '/products';
    if (page === 'product_detail') return `/products/${params.slug || 'madhurai-mini-bites'}`;
    if (page === 'articles') return '/articles';
    if (page === 'article_detail') return `/articles/${params.slug || ''}`;
    if (page === 'cart') return '/cart';
    if (page === 'checkout') return '/checkout';
    if (page === 'order_success') return `/order-success/${params.orderId || ''}`;
    if (page === 'track_order') return '/track-order';
    if (page === 'login') return '/login';
    if (page === 'register') return '/register';
    if (page === 'forgot_password') return '/forgot-password';
    if (page === 'account') return '/account';
    if (page === 'order_detail') return `/account/orders/${params.orderId || ''}`;
    if (page === 'wishlist') return '/wishlist';
    if (page === 'about') return '/about';
    if (page === 'contact') return '/contact';
    if (page === 'shipping_policy') return '/shipping-policy';
    if (page === 'refund_policy') return '/cancellation-refund-policy';
    if (page === 'privacy_policy') return '/privacy-policy';
    if (page === 'terms') return '/terms';
    return '/';
  };

  // Track customer storefront visits for live admin analytics with explicit page path
  useEffect(() => {
    const activePath = resolvePagePath(currentPage, pageParams);
    trackPageView(activePath);
  }, [currentPage, pageParams]);

  const navigate = (page, params = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const url = resolvePagePath(page, params);
    try {
      window.history.pushState({}, '', url);
    } catch (e) {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar onNavigate={navigate} currentPage={currentPage} />

      <main style={{ flex: 1 }}>
        {currentPage === 'home' && <Home onNavigate={navigate} />}
        {currentPage === 'products' && (
          <Catalog
            initialCategory={pageParams.category}
            initialQuery={pageParams.q}
            onNavigate={navigate}
          />
        )}
        {currentPage === 'product_detail' && (
          <ProductDetail 
            slug={pageParams.slug || 'chocolate-crunch-peanut-butter-inside'} 
            id={pageParams.id} 
            onNavigate={navigate} 
          />
        )}
        {currentPage === 'cart' && <Cart onNavigate={navigate} />}
        {currentPage === 'checkout' && <Checkout onNavigate={navigate} />}
        {currentPage === 'order_success' && <OrderSuccess orderId={pageParams.orderId} onNavigate={navigate} />}
        {currentPage === 'track_order' && <TrackOrder onNavigate={navigate} />}
        {currentPage === 'login' && <Login onNavigate={navigate} />}
        {currentPage === 'register' && <Register onNavigate={navigate} />}
        {currentPage === 'forgot_password' && <ForgotPassword onNavigate={navigate} />}
        {currentPage === 'account' && <Account onNavigate={navigate} />}
        {currentPage === 'order_detail' && <OrderSuccess orderId={pageParams.orderId} onNavigate={navigate} />}
        {currentPage === 'wishlist' && <Account onNavigate={navigate} />}
        {currentPage === 'about' && <About />}
        {currentPage === 'articles' && <Articles onNavigate={navigate} />}
        {currentPage === 'article_detail' && <Articles slug={pageParams.slug} onNavigate={navigate} />}
        {currentPage === 'contact' && <Contact />}
        {currentPage === 'faq' && <Home onNavigate={navigate} />}
        {currentPage === 'shipping_policy' && <ShippingPolicy />}
        {currentPage === 'refund_policy' && <RefundPolicy />}
        {currentPage === 'privacy_policy' && <PrivacyPolicy />}
        {currentPage === 'terms' && <Terms />}
      </main>

      <WhatsAppButton currentPage={currentPage} hasBottomBar={currentPage === 'product_detail'} />

      <Footer onNavigate={navigate} />
    </div>
  );
}
