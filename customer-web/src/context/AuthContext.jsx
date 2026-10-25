import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mc_customer_token');
    if (token) {
      api.getProfile()
        .then(res => {
          if (res.success && res.data.user) {
            setUser(res.data.user);
          } else {
            localStorage.removeItem('mc_customer_token');
          }
        })
        .catch(() => {
          localStorage.removeItem('mc_customer_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success && res.data.token) {
      localStorage.setItem('mc_customer_token', res.data.token);
      setUser(res.data.user);
    }
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success && res.data.token) {
      localStorage.setItem('mc_customer_token', res.data.token);
      setUser(res.data.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('mc_customer_token');
    setUser(null);
  };

  const updateProfile = async (data) => {
    const res = await api.updateProfile(data);
    if (res.success) {
      setUser(prev => ({ ...prev, ...data }));
    }
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
