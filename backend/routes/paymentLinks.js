const express = require('express');
const stripe = require('../lib/stripe');
const { updateIds } = require('../store');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { price, quantity = 1 } = req.body;

    if (!price) {
      return res.status(400).json({ error: 'price is required' });
    }

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price, quantity: Math.max(1, Math.round(quantity)) }],
    });

    updateIds({ price_id: price, payment_link_id: paymentLink.id });

    res.json(paymentLink);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const paymentLinks = await stripe.paymentLinks.list({ limit: 10, active: true });
    res.json(paymentLinks.data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
