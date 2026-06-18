require('dotenv').config();

const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');
const webhookRouter = require('./routes/webhook');
const storeRouter = require('./routes/store');
const productsRouter = require('./routes/products');
const pricesRouter = require('./routes/prices');
const paymentLinksRouter = require('./routes/paymentLinks');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  }),
);

app.use('/webhook', webhookRouter);

app.use(express.json());

app.use(healthRouter);
app.use('/store', storeRouter);
app.use('/products', productsRouter);
app.use('/prices', pricesRouter);
app.use('/payment-links', paymentLinksRouter);

app.listen(PORT, () => {
  console.log(`Stripe Playground API running on http://localhost:${PORT}`);
});
