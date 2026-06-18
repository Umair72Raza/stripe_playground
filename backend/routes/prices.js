const express = require('express');
const stripe = require('../lib/stripe');
const { updateIds } = require('../store');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { product, unit_amount, currency = 'usd', recurring } = req.body;

    if (!product) {
      return res.status(400).json({ error: 'product is required' });
    }

    if (!unit_amount || unit_amount < 1) {
      return res.status(400).json({ error: 'unit_amount must be at least 1 (cents)' });
    }

    const params = {
      product,
      unit_amount: Math.round(unit_amount),
      currency: currency.toLowerCase(),
    };

    if (recurring?.interval) {
      params.recurring = { interval: recurring.interval };
    }

    const price = await stripe.prices.create(params);

    updateIds({ price_id: price.id, product_id: product });

    res.json(price);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const prices = await stripe.prices.list({ limit: 10, active: true, expand: ['data.product'] });
    res.json(prices.data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
