const MAX_EVENTS = 50;

let webhookEvents = [];
let ids = {
  product_id: null,
  price_id: null,
  customer_id: null,
  payment_link_id: null,
  checkout_session_id: null,
  subscription_id: null,
  payment_intent_id: null,
};

function addWebhookEvent(event) {
  webhookEvents.unshift(event);
  if (webhookEvents.length > MAX_EVENTS) {
    webhookEvents = webhookEvents.slice(0, MAX_EVENTS);
  }
}

function getWebhookEvents() {
  return webhookEvents;
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
  getWebhookEvents,
  getIds,
  updateIds,
};
