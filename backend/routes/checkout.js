const express = require('express');
const stripe = require('../lib/stripe');
const { updateIds } = require('../store');

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

router.post('/sessions', async (req, res) => {
  try {
    const { price, quantity = 1, client_reference_id, metadata } = req.body;

    if (!price) {
      return res.status(400).json({ error: 'price is required' });
    }

    const params = {
      mode: 'payment',
      line_items: [{ price, quantity: Math.max(1, Math.round(quantity)) }],
      success_url: `${FRONTEND_URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/?checkout=cancel`,
    };

    if (client_reference_id?.trim()) {
      params.client_reference_id = client_reference_id.trim();
    }

    if (metadata && typeof metadata === 'object') {
      params.metadata = metadata;
    }

    const session = await stripe.checkout.sessions.create(params);

    updateIds({
      checkout_session_id: session.id,
      price_id: price,
    });

    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/sessions/:id', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id, {
      expand: ['payment_intent', 'customer'],
    });

    if (session.customer?.id || session.customer) {
      updateIds({
        checkout_session_id: session.id,
        customer_id: session.customer?.id || session.customer,
        payment_intent_id: session.payment_intent?.id || session.payment_intent,
      });
    }

    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
