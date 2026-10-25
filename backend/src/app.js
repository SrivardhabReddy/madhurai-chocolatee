import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './modules/auth/authRoutes.js';
import productRoutes from './modules/products/productRoutes.js';
import categoryRoutes from './modules/categories/categoryRoutes.js';
import cartRoutes from './modules/cart/cartRoutes.js';
import orderRoutes from './modules/orders/orderRoutes.js';
import deliveryRoutes from './modules/delivery/deliveryRoutes.js';
import couponRoutes from './modules/coupons/couponRoutes.js';
import paymentRoutes from './modules/payments/paymentRoutes.js';
import inventoryRoutes from './modules/inventory/inventoryRoutes.js';
import adminRoutes from './modules/admin/adminRoutes.js';
import articleRoutes from './modules/articles/articleRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS configuration supporting Customer and Admin web apps across all environments
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins (localhost, onrender.com, custom domains, mobile apps)
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-webhook-signature']
  })
);

// Request Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// General rate limiter
app.use('/api', generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Madhurai Chocolate API',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/articles', articleRoutes);

// Serve Frontend SPAs if built in dist
const customerDist = path.resolve(__dirname, '../../customer-web/dist');
const adminDist = path.resolve(__dirname, '../../admin-web/dist');

if (fs.existsSync(adminDist)) {
  app.use('/admin', express.static(adminDist));
  app.get(['/admin', '/admin/*'], (req, res) => {
    res.sendFile(path.join(adminDist, 'index.html'));
  });
}

if (fs.existsSync(customerDist)) {
  app.use(express.static(customerDist));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads') || req.originalUrl.startsWith('/admin')) {
      return next();
    }
    res.sendFile(path.join(customerDist, 'index.html'));
  });
}

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
