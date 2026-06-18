const express = require('express');
const stripe = require('../lib/stripe');
const { updateIds } = require('../store');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const product = await stripe.products.create({
      name: name.trim(),
      ...(description?.trim() && { description: description.trim() }),
    });

    updateIds({ product_id: product.id });

    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const products = await stripe.products.list({ limit: 10, active: true });
    res.json(products.data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
