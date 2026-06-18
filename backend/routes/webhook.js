const express = require('express');
const stripe = require('../lib/stripe');
const { addWebhookEvent, getWebhookEvents, getWebhookMeta, recordWebhookError } = require('../store');

const router = express.Router();

router.get('/status', (req, res) => {
  res.json(getWebhookMeta());
});

router.post('/', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET is not configured' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    recordWebhookError(err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`Webhook received: ${event.type} (${event.id})`);

  const object = event.data.object;

  addWebhookEvent({
    id: event.id,
    type: event.type,
    created: event.created,
    livemode: event.livemode,
    data: {
      object: {
        id: object?.id,
        object: object?.object,
        status: object?.status,
        amount: object?.amount,
        customer: object?.customer,
        customer_email: object?.customer_email || object?.customer_details?.email,
        payment_link: object?.payment_link,
      },
    },
  });

  res.json({ received: true });
});

router.get('/events', (req, res) => {
  res.json(getWebhookEvents());
});

module.exports = router;
