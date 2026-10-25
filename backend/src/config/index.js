import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root or parent directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  appUrl: process.env.APP_URL || 'http://localhost:4000',
  customerAppUrl: process.env.CUSTOMER_APP_URL || 'http://localhost:3000',
  adminAppUrl: process.env.ADMIN_APP_URL || 'http://localhost:3001',
  
  // Database configuration
  databaseUrl: process.env.DATABASE_URL || '',
  
  // Authentication
  jwtSecret: process.env.JWT_SECRET || 'madhurai_super_secret_jwt_key_2026_cacao_peanut_butter',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Payment Gateway
  paymentGateway: process.env.PAYMENT_GATEWAY || 'MOCK_SANDBOX', // 'MOCK_SANDBOX' | 'RAZORPAY' | 'CASHFREE' | 'PHONEPE'
  paymentGatewayKey: process.env.PAYMENT_GATEWAY_KEY || 'rzp_test_madhurai_demo_key',
  paymentGatewaySecret: process.env.PAYMENT_GATEWAY_SECRET || 'rzp_test_madhurai_secret_123',
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'whsec_madhurai_webhook_secret_999',
  upiVpa: process.env.UPI_VPA || '9676823113-2@ybl',
  
  // Email / Notifications
  emailHost: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  emailPort: parseInt(process.env.EMAIL_PORT || '2525', 10),
  emailUser: process.env.EMAIL_USER || '',
  emailPassword: process.env.EMAIL_PASSWORD || '',
  emailFrom: process.env.EMAIL_FROM || 'madhuraicompany@gmail.com',
  
  // Paths
  uploadsDir: path.resolve(__dirname, '../../uploads'),
};
