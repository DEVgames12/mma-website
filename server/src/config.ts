import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'development_secret',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@mmacademy.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'Mma@2026',
  paymentKeyId: process.env.PAYMENT_KEY_ID || '',
  paymentKeySecret: process.env.PAYMENT_KEY_SECRET || '',
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || '',
  paymentSandbox: process.env.PAYMENT_SANDBOX !== 'false',
};
