const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function adminRequest(endpoint, options = {}) {
  const token = localStorage.getItem('mc_admin_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Operation failed.');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const adminApi = {
  // Auth
  login: (email, password) =>
    adminRequest('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  getMe: () => adminRequest('/auth/me'),

  // Dashboard & Analytics
  getDashboard: () => adminRequest('/admin/dashboard'),
  getAnalytics: (range = '30d') => adminRequest(`/admin/analytics?range=${range}`),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return adminRequest(`/products/admin/all?${query}`);
  },
  createProduct: (data) =>
    adminRequest('/products/admin/create', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateProduct: (id, data) =>
    adminRequest(`/products/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteProduct: (id, permanent = false) =>
    adminRequest(`/products/admin/${id}${permanent ? '?permanent=true' : ''}`, {
      method: 'DELETE'
    }),
  uploadImage: async (file) => {
    const token = localStorage.getItem('mc_admin_token');
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE}/products/admin/upload-image`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData
    });
    return res.json();
  },

  // Categories
  getCategories: () => adminRequest('/categories/admin/all'),
  createCategory: (data) =>
    adminRequest('/categories/admin/create', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateCategory: (id, data) =>
    adminRequest(`/categories/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteCategory: (id) =>
    adminRequest(`/categories/admin/${id}`, {
      method: 'DELETE'
    }),

  // Orders
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return adminRequest(`/orders/admin/list?${query}`);
  },
  updateOrderStatus: (id, order_status) =>
    adminRequest(`/orders/admin/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ order_status })
    }),
  markCodCollected: (id) =>
    adminRequest(`/orders/admin/${id}/cod-collected`, {
      method: 'POST'
    }),
  refundOrder: (paymentId, amount, reason) =>
    adminRequest(`/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason })
    }),

  // Inventory
  getInventoryOverview: (filter) =>
    adminRequest(`/admin/inventory/admin/overview${filter ? `?status_filter=${filter}` : ''}`),
  restock: (data) =>
    adminRequest('/admin/inventory/admin/restock', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  adjustStock: (data) =>
    adminRequest('/admin/inventory/admin/adjust', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getInventoryTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return adminRequest(`/admin/inventory/admin/transactions?${query}`);
  },

  // Delivery
  getZones: () => adminRequest('/delivery/admin/zones'),
  createZone: (data) =>
    adminRequest('/delivery/admin/zones', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateZone: (id, data) =>
    adminRequest(`/delivery/admin/zones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getPincodes: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return adminRequest(`/delivery/admin/pincodes?${query}`);
  },
  createPincode: (data) =>
    adminRequest('/delivery/admin/pincodes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updatePincode: (id, data) =>
    adminRequest(`/delivery/admin/pincodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deletePincode: (id) =>
    adminRequest(`/delivery/admin/pincodes/${id}`, {
      method: 'DELETE'
    }),
  bulkImportPincodes: (pincodes) =>
    adminRequest('/delivery/admin/pincodes/bulk', {
      method: 'POST',
      body: JSON.stringify({ pincodes })
    }),

  getDeliveryRules: () => adminRequest('/delivery/admin/rules'),
  createDeliveryRule: (data) =>
    adminRequest('/delivery/admin/rules', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateDeliveryRule: (id, data) =>
    adminRequest(`/delivery/admin/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteDeliveryRule: (id) =>
    adminRequest(`/delivery/admin/rules/${id}`, {
      method: 'DELETE'
    }),

  getDeliverySettings: () => adminRequest('/delivery/admin/settings'),
  updateDeliverySettings: (settings) =>
    adminRequest('/delivery/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings })
    }),

  // Coupons
  getCoupons: () => adminRequest('/coupons/admin/all'),
  createCoupon: (data) =>
    adminRequest('/coupons/admin/create', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateCoupon: (id, data) =>
    adminRequest(`/coupons/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteCoupon: (id) =>
    adminRequest(`/coupons/admin/${id}`, {
      method: 'DELETE'
    }),

  // Customers
  getCustomers: (q = '') => adminRequest(`/admin/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  // Payments Log
  getPayments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return adminRequest(`/payments/admin/list?${query}`);
  },

  // Business Settings
  getBusinessSettings: () => adminRequest('/admin/settings'),
  updateBusinessSettings: (settings) =>
    adminRequest('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings })
    }),

  // Staff Users & RBAC
  getStaffUsers: () => adminRequest('/admin/users'),
  createStaffUser: (data) =>
    adminRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return adminRequest(`/admin/audit-logs?${query}`);
  },

  // Articles & Journal Stories
  getArticles: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return adminRequest(`/articles/admin/all?${query}`);
  },
  createArticle: (data) =>
    adminRequest('/articles', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateArticle: (id, data) =>
    adminRequest(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteArticle: (id) =>
    adminRequest(`/articles/${id}`, {
      method: 'DELETE'
    }),
  uploadArticleImage: async (file) => {
    const token = localStorage.getItem('mc_admin_token');
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE}/articles/upload-image`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData
    });
    return res.json();
  }
};
