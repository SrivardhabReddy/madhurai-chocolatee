import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from './context/AdminAuthContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';

import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import Categories from './pages/Categories.jsx';
import Orders from './pages/Orders.jsx';
import Inventory from './pages/Inventory.jsx';
import Delivery from './pages/Delivery.jsx';
import Coupons from './pages/Coupons.jsx';
import Customers from './pages/Customers.jsx';
import Payments from './pages/Payments.jsx';
import Analytics from './pages/Analytics.jsx';
import Settings from './pages/Settings.jsx';
import UsersRoles from './pages/UsersRoles.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import Articles from './pages/Articles.jsx';
import Login from './pages/Login.jsx';

export default function App() {
  const { adminUser, loading } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🍫</div>
          <div style={{ fontWeight: '600' }}>Initializing Madhurai Operations Portal...</div>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Derive active section from URL
  const currentPath = location.pathname.replace(/^\//, '') || 'dashboard';

  const sectionTitles = {
    dashboard: 'Business Operations Overview',
    products: 'Product Catalog & Pricing Management',
    categories: 'Storefront Categories',
    articles: 'Articles & Journal Stories Publishing',
    orders: 'Customer Orders & Dispatch Fulfillment',
    inventory: 'Inventory & Stock Reconciliation',
    delivery: 'Delivery Zones, Slabs & Serviceability',
    coupons: 'Marketing Discounts & Promotional Coupons',
    customers: 'Registered Customer Directory',
    payments: 'Payment Transactions & Gateway Refunds',
    analytics: 'Financial & Operational Analytics',
    settings: 'Global Business & Compliance Settings',
    users: 'Staff Management & RBAC Permissions',
    audit: 'System Audit Trail & Security Logs'
  };

  const handleNavigate = (sectionId) => {
    navigate(sectionId === 'dashboard' ? '/' : `/${sectionId}`);
  };

  return (
    <div className="admin-layout">
      <Sidebar
        currentSection={currentPath}
        onNavigate={handleNavigate}
      />

      <div className="admin-main">
        <Header title={sectionTitles[currentPath] || 'Operations Console'} />

        <main className="admin-content">
          <Routes>
            <Route path="/" element={<Dashboard onNavigate={handleNavigate} />} />
            <Route path="/dashboard" element={<Dashboard onNavigate={handleNavigate} />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/delivery" element={<Delivery />} />
            <Route path="/coupons" element={<Coupons />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/users" element={<UsersRoles />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
