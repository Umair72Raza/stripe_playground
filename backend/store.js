const fs = require('fs');
const path = require('path');

const MAX_EVENTS = 50;
const DATA_DIR = path.join(__dirname, 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'webhook-events.json');

let webhookEvents = [];
let webhookMeta = {
  lastReceivedAt: null,
  lastEventType: null,
  lastError: null,
  lastErrorAt: null,
  totalReceived: 0,
};

let ids = {
  product_id: null,
  price_id: null,
  customer_id: null,
  payment_link_id: null,
  checkout_session_id: null,
  subscription_id: null,
  payment_intent_id: null,
};

function loadEventsFromDisk() {
  try {
    if (fs.existsSync(EVENTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
      webhookEvents = data.events || [];
      webhookMeta = { ...webhookMeta, ...data.meta };
    }
  } catch {
    webhookEvents = [];
  }
}

function saveEventsToDisk() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(
    EVENTS_FILE,
    JSON.stringify({ events: webhookEvents, meta: webhookMeta }, null, 2),
  );
}

loadEventsFromDisk();

function addWebhookEvent(event) {
  webhookEvents.unshift(event);
  if (webhookEvents.length > MAX_EVENTS) {
    webhookEvents = webhookEvents.slice(0, MAX_EVENTS);
  }

  webhookMeta.lastReceivedAt = new Date().toISOString();
  webhookMeta.lastEventType = event.type;
  webhookMeta.totalReceived += 1;
  webhookMeta.lastError = null;
  webhookMeta.lastErrorAt = null;

  saveEventsToDisk();
}

function recordWebhookError(message) {
  webhookMeta.lastError = message;
  webhookMeta.lastErrorAt = new Date().toISOString();
  saveEventsToDisk();
}

function getWebhookEvents() {
  return webhookEvents;
}

function getWebhookMeta() {
  return {
    ...webhookMeta,
    eventCount: webhookEvents.length,
    webhookSecretConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  };
}

function getIds() {
  return { ...ids };
}

function updateIds(updates) {
  ids = { ...ids, ...updates };
  return getIds();
}

module.exports = {
  addWebhookEvent,
  recordWebhookError,
  getWebhookEvents,
  getWebhookMeta,
  getIds,
  updateIds,
};
