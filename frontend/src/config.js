export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const phases = [
  { id: 'home', label: 'Home', phase: 0, enabled: true },
  { id: 'products', label: 'Products & Prices', phase: 1, enabled: true },
  { id: 'payment-links', label: 'Payment Links', phase: 2, enabled: true },
  { id: 'checkout', label: 'Checkout Sessions', phase: 3, enabled: false },
  { id: 'webhooks', label: 'Webhook Logs', phase: 4, enabled: true },
  { id: 'customers', label: 'Customers', phase: 5, enabled: false },
  { id: 'subscriptions', label: 'Subscriptions', phase: 6, enabled: false },
  { id: 'invoices', label: 'Invoices', phase: 7, enabled: false },
  { id: 'portal', label: 'Customer Portal', phase: 8, enabled: false },
  { id: 'refunds', label: 'Refunds', phase: 9, enabled: false },
  { id: 'elements', label: 'Payment Intents', phase: 10, enabled: false },
];
