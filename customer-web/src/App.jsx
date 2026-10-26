import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
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

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageParams, setPageParams] = useState({});

  // Sync with browser URL / history
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/' || path === '') {
        setCurrentPage('home');
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

  const navigate = (page, params = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let url = '/';
    if (page === 'products') url = params.category ? `/categories/${params.category}` : '/products';
    else if (page === 'product_detail') url = `/products/${params.slug}`;
    else if (page === 'articles') url = '/articles';
    else if (page === 'article_detail') url = `/articles/${params.slug || ''}`;
    else if (page === 'cart') url = '/cart';
    else if (page === 'checkout') url = '/checkout';
    else if (page === 'order_success') url = `/order-success/${params.orderId || ''}`;
    else if (page === 'track_order') url = '/track-order';
    else if (page === 'login') url = '/login';
    else if (page === 'register') url = '/register';
    else if (page === 'forgot_password') url = '/forgot-password';
    else if (page === 'account') url = '/account';
    else if (page === 'order_detail') url = `/account/orders/${params.orderId || ''}`;
    else if (page === 'wishlist') url = '/wishlist';
    else if (page === 'about') url = '/about';
    else if (page === 'contact') url = '/contact';
    else if (page === 'shipping_policy') url = '/shipping-policy';
    else if (page === 'refund_policy') url = '/cancellation-refund-policy';
    else if (page === 'privacy_policy') url = '/privacy-policy';
    else if (page === 'terms') url = '/terms';

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

      <Footer onNavigate={navigate} />
    </div>
  );
}
