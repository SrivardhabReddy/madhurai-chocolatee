const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('mc_customer_token');
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
    const error = new Error(data.message || 'Something went wrong. Please try again.');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Products & Categories
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/products?${query.toString()}`);
  },
  getProductBySlug: (slug) => request(`/products/${slug}`),
  getCategories: () => request('/categories'),
  getCategoryBySlug: (slug) => request(`/categories/${slug}`),

  // Delivery
  checkDelivery: (pincode, items = [], subtotal = 0) =>
    request('/delivery/check', {
      method: 'POST',
      body: JSON.stringify({ pincode, items, subtotal })
    }),
  getDeliveryAreaLimit: () => request('/delivery/area-limit'),

  // Cart & Pricing
  validateCart: (items = [], pincode = '', coupon_code = '') =>
    request('/cart/validate', {
      method: 'POST',
      body: JSON.stringify({ items, pincode, coupon_code })
    }),
  validateCoupon: (code, subtotal = 0, items = [], pincode = '') =>
    request('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal, items, pincode })
    }),

  // Orders
  createOrder: (orderData) =>
    request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    }),
  trackOrder: (order_number, phone) =>
    request('/orders/track', {
      method: 'POST',
      body: JSON.stringify({ order_number, phone })
    }),
  getMyOrders: () => request('/orders/my-orders'),
  getOrderById: (id) => request(`/orders/${id}`),

  // Payments
  createPayment: (orderId, paymentMethod = 'UPI_QR') =>
    request('/payments/create', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, payment_method: paymentMethod })
    }),
  verifyPayment: (data) =>
    request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  simulatePaymentSuccess: (orderId, paymentId) =>
    request('/payments/simulate-success', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, payment_id: paymentId })
    }),

  // Auth
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
  getProfile: () => request('/auth/me'),
  updateProfile: (data) =>
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  changePassword: (data) =>
    request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  getAddresses: () => request('/auth/addresses'),
  saveAddress: (data) =>
    request('/auth/addresses', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteAddress: (id) =>
    request(`/auth/addresses/${id}`, {
      method: 'DELETE'
    })
};
