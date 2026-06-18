import { API_URL } from './config';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Request failed: ${response.status}`);
  }

  return data;
}

export function getHealth() {
  return request('/health');
}

export function getWebhookEvents() {
  return request('/webhook/events');
}

export function getWebhookStatus() {
  return request('/webhook/status');
}

export function getStoredIds() {
  return request('/store/ids');
}

export function updateStoredIds(ids) {
  return request('/store/ids', {
    method: 'PATCH',
    body: JSON.stringify(ids),
  });
}

export function createProduct({ name, description }) {
  return request('/products', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
}

export function listProducts() {
  return request('/products');
}

export function createPrice({ product, unit_amount, currency, recurring }) {
  return request('/prices', {
    method: 'POST',
    body: JSON.stringify({ product, unit_amount, currency, recurring }),
  });
}

export function listPrices() {
  return request('/prices');
}

export function createPaymentLink({ price, quantity }) {
  return request('/payment-links', {
    method: 'POST',
    body: JSON.stringify({ price, quantity }),
  });
}

export function listPaymentLinks() {
  return request('/payment-links');
}
