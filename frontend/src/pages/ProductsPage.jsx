import { useCallback, useEffect, useState } from 'react';
import {
  createPrice,
  createProduct,
  getStoredIds,
  listPrices,
  listProducts,
} from '../api';
import { usePlayground } from '../context/PlaygroundContext';

function formatAmount(cents, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default function ProductsPage() {
  const { setLastResponse, setIds } = usePlayground();
  const [products, setProducts] = useState([]);
  const [prices, setPrices] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [productName, setProductName] = useState('Pro Plan');
  const [productDescription, setProductDescription] = useState('');

  const [priceProductId, setPriceProductId] = useState('');
  const [priceAmount, setPriceAmount] = useState('2000');
  const [priceCurrency, setPriceCurrency] = useState('usd');
  const [priceType, setPriceType] = useState('recurring');
  const [priceInterval, setPriceInterval] = useState('month');

  const loadAll = useCallback(async () => {
    try {
      const [productData, priceData, storedIds] = await Promise.all([
        listProducts(),
        listPrices(),
        getStoredIds(),
      ]);
      setProducts(productData);
      setPrices(priceData);
      setIds(storedIds);
      setError(null);

      if (!priceProductId && storedIds.product_id) {
        setPriceProductId(storedIds.product_id);
      } else if (!priceProductId && productData.length > 0) {
        setPriceProductId(productData[0].id);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [priceProductId, setIds]);

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreateProduct(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const product = await createProduct({
        name: productName,
        description: productDescription,
      });
      setLastResponse(product);
      setPriceProductId(product.id);
      await loadAll();
    } catch (err) {
      setError(err.message);
      setLastResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePrice(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const price = await createPrice({
        product: priceProductId,
        unit_amount: Number(priceAmount),
        currency: priceCurrency,
        recurring: priceType === 'recurring' ? { interval: priceInterval } : undefined,
      });
      setLastResponse(price);
      await loadAll();
    } catch (err) {
      setError(err.message);
      setLastResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleListProducts() {
    setLoading(true);
    setError(null);

    try {
      const data = await listProducts();
      setProducts(data);
      setLastResponse(data);
    } catch (err) {
      setError(err.message);
      setLastResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleListPrices() {
    setLoading(true);
    setError(null);

    try {
      const data = await listPrices();
      setPrices(data);
      setLastResponse(data);
    } catch (err) {
      setError(err.message);
      setLastResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <h2>Phase 1 — Products &amp; Prices</h2>
        <p>
          A <strong>Product</strong> is what you sell. A <strong>Price</strong> is how much
          and how often. One product can have many prices.
        </p>
      </header>

      {error && <p className="error-text">{error}</p>}

      <div className="grid-2">
        <div className="card">
          <h3>Create Product</h3>
          <form className="form" onSubmit={handleCreateProduct}>
            <label>
              Name
              <input
                className="input full"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </label>
            <label>
              Description (optional)
              <input
                className="input full"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
              />
            </label>
            <button type="submit" className="btn" disabled={loading}>
              Create Product
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Create Price</h3>
          <form className="form" onSubmit={handleCreatePrice}>
            <label>
              Product
              <select
                className="input full"
                value={priceProductId}
                onChange={(e) => setPriceProductId(e.target.value)}
                required
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.id})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Amount (cents)
              <input
                className="input full"
                type="number"
                min="1"
                value={priceAmount}
                onChange={(e) => setPriceAmount(e.target.value)}
                required
              />
              <span className="hint">2000 = $20.00</span>
            </label>
            <label>
              Currency
              <input
                className="input full"
                value={priceCurrency}
                onChange={(e) => setPriceCurrency(e.target.value)}
                required
              />
            </label>
            <label>
              Billing type
              <select
                className="input full"
                value={priceType}
                onChange={(e) => setPriceType(e.target.value)}
              >
                <option value="one_time">One-time</option>
                <option value="recurring">Recurring</option>
              </select>
            </label>
            {priceType === 'recurring' && (
              <label>
                Interval
                <select
                  className="input full"
                  value={priceInterval}
                  onChange={(e) => setPriceInterval(e.target.value)}
                >
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                  <option value="week">Weekly</option>
                  <option value="day">Daily</option>
                </select>
              </label>
            )}
            <button type="submit" className="btn" disabled={loading || !priceProductId}>
              Create Price
            </button>
          </form>
        </div>
      </div>

      <div className="toolbar">
        <button type="button" className="btn btn-secondary" onClick={handleListProducts} disabled={loading}>
          List Products
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleListPrices} disabled={loading}>
          List Prices
        </button>
        <button type="button" className="btn btn-secondary" onClick={loadAll} disabled={loading}>
          Refresh All
        </button>
      </div>

      <div className="card">
        <h3>Products ({products.length})</h3>
        {products.length === 0 ? (
          <p className="muted">No products yet. Create one above.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td><code>{product.id}</code></td>
                  <td>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => navigator.clipboard.writeText(product.id)}
                    >
                      Copy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Prices ({prices.length})</h3>
        {prices.length === 0 ? (
          <p className="muted">No prices yet. Create one above.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Amount</th>
                <th>Type</th>
                <th>ID</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {prices.map((price) => (
                <tr key={price.id}>
                  <td>{price.product?.name || price.product}</td>
                  <td>{formatAmount(price.unit_amount, price.currency)}</td>
                  <td>
                    {price.recurring
                      ? `${price.recurring.interval}ly`
                      : 'One-time'}
                  </td>
                  <td><code>{price.id}</code></td>
                  <td>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => navigator.clipboard.writeText(price.id)}
                    >
                      Copy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Try these exercises</h3>
        <ul className="checklist">
          <li>Create product &quot;Ebook&quot; + one-time price $15 (1500 cents)</li>
          <li>Create product &quot;Pro Plan&quot; + recurring price $20/month (2000 cents)</li>
          <li>Add a second price to Pro Plan: $200/year (20000 cents)</li>
          <li>Open Stripe Dashboard → Products and confirm the structure</li>
        </ul>
      </div>
    </section>
  );
}
