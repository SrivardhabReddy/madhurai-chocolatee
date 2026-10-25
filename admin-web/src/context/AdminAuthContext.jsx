import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi.js';

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mc_admin_token');
    if (token) {
      adminApi.getMe()
        .then(res => {
          if (res.success && res.data.user && res.data.user.role !== 'CUSTOMER') {
            setAdminUser(res.data.user);
          } else {
            localStorage.removeItem('mc_admin_token');
            setAdminUser(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('mc_admin_token');
          setAdminUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await adminApi.login(email, password);
    if (res.success && res.data.token) {
      localStorage.setItem('mc_admin_token', res.data.token);
      setAdminUser(res.data.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('mc_admin_token');
    setAdminUser(null);
  };

  // RBAC permission check helper
  const canAccess = (moduleName, action = 'read') => {
    if (!adminUser) return false;
    if (adminUser.role === 'SUPER_ADMIN') return true;
    const perms = adminUser.permissions?.[moduleName];
    if (!perms) return false;
    return Boolean(perms[action] || perms.manage);
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, loading, login, logout, canAccess }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
