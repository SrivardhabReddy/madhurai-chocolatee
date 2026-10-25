import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  ShoppingBag, 
  Boxes, 
  Truck, 
  Ticket, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Shield, 
  FileText,
  BookOpen,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

export default function Sidebar({ currentSection, onNavigate }) {
  const { adminUser, logout, canAccess } = useAdminAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products & Slabs', icon: Package, module: 'PRODUCTS' },
    { id: 'categories', label: 'Categories', icon: Tags, module: 'PRODUCTS' },
    { id: 'articles', label: 'Articles & Stories', icon: BookOpen },
    { id: 'orders', label: 'Orders & Dispatch', icon: ShoppingBag, module: 'ORDERS' },
    { id: 'inventory', label: 'Inventory & Stock', icon: Boxes, module: 'INVENTORY' },
    { id: 'delivery', label: 'Delivery & Rules', icon: Truck, module: 'DELIVERY' },
    { id: 'coupons', label: 'Discount Coupons', icon: Ticket, module: 'COUPONS' },
    { id: 'customers', label: 'Customer Directory', icon: Users, module: 'CUSTOMERS' },
    { id: 'payments', label: 'Payments & Gateway', icon: CreditCard, module: 'PAYMENTS' },
    { id: 'analytics', label: 'Business Analytics', icon: BarChart3, module: 'ORDERS' },
    { id: 'settings', label: 'Store Settings', icon: Settings, module: 'SETTINGS' },
    { id: 'users', label: 'Staff & RBAC', icon: Shield, module: 'ROLES' },
    { id: 'audit', label: 'Audit Trail Logs', icon: FileText, module: 'AUDIT' }
  ];

  return (
    <aside className="admin-sidebar">
      {/* Brand Header */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: 'var(--admin-accent)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '800',
          fontSize: '1.2rem'
        }}>
          M
        </div>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#F8FAFC', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
            Madhurai
          </h2>
          <span style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-text-light)', fontWeight: '600' }}>
            Enterprise Operations
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav style={{ flex: 1, padding: '16px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map(item => {
          if (item.module && !canAccess(item.module, 'read')) {
            return null; // Enforce RBAC visibility in navigation
          }

          const Icon = item.icon;
          const isActive = currentSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isActive ? 'var(--admin-sidebar-active)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--admin-text-light)',
                fontWeight: isActive ? '700' : '500',
                fontSize: '0.88rem',
                borderLeft: isActive ? '3px solid var(--admin-accent)' : '3px solid transparent',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--admin-sidebar-hover)';
              }}
              onMouseOut={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon size={18} style={{ color: isActive ? 'var(--admin-accent)' : 'inherit' }} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div style={{ padding: '16px', borderTop: '1px solid #1E293B', backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#F8FAFC' }}>
              {adminUser?.full_name?.split(' ')[0]}
            </div>
            <span className="status-pill pill-warning" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
              {adminUser?.role}
            </span>
          </div>

          <button
            onClick={logout}
            style={{ color: 'var(--admin-text-light)', padding: '6px', cursor: 'pointer' }}
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
