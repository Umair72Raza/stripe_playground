import { useCallback, useEffect, useState } from 'react';
import {
  createPaymentLink,
  getStoredIds,
  listPaymentLinks,
  listPrices,
} from '../api';
import { usePlayground } from '../context/PlaygroundContext';

function formatAmount(cents, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default function PaymentLinksPage() {
  const { setLastResponse, setIds } = usePlayground();
  const [prices, setPrices] = useState([]);
  const [paymentLinks, setPaymentLinks] = useState([]);
  const [selectedPriceId, setSelectedPriceId] = useState('');
  const [lastCreatedUrl, setLastCreatedUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [priceData, linkData, storedIds] = await Promise.all([
        listPrices(),
        listPaymentLinks(),
        getStoredIds(),
      ]);
      setPrices(priceData);
      setPaymentLinks(linkData);
      setIds(storedIds);
      setError(null);

      if (!selectedPriceId && storedIds.price_id) {
        setSelectedPriceId(storedIds.price_id);
      } else if (!selectedPriceId && priceData.length > 0) {
        setSelectedPriceId(priceData[0].id);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [selectedPriceId, setIds]);

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const paymentLink = await createPaymentLink({ price: selectedPriceId });
      setLastResponse(paymentLink);
      setLastCreatedUrl(paymentLink.url);
      await loadAll();
    } catch (err) {
      setError(err.message);
      setLastResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleListLinks() {
    setLoading(true);
    setError(null);

    try {
      const data = await listPaymentLinks();
      setPaymentLinks(data);
      setLastResponse(data);
    } catch (err) {
      setError(err.message);
      setLastResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  const selectedPrice = prices.find((p) => p.id === selectedPriceId);

  return (
    <section className="page">
      <header className="page-header">
        <h2>Phase 2 — Payment Links</h2>
        <p>
          Stripe hosts the entire checkout page. Pick a price, get a shareable URL like{' '}
          <code>https://buy.stripe.com/...</code>, no checkout code required.
        </p>
      </header>

      {error && <p className="error-text">{error}</p>}

      <div className="card">
        <h3>Create Payment Link</h3>
        {prices.length === 0 ? (
          <p className="muted">
            No prices yet. Go to Phase 1 and create a product + price first.
          </p>
        ) : (
          <form className="form" onSubmit={handleCreate}>
            <label>
              Price
              <select
                className="input full"
                value={selectedPriceId}
                onChange={(e) => setSelectedPriceId(e.target.value)}
                required
              >
                {prices.map((price) => (
                  <option key={price.id} value={price.id}>
                    {price.product?.name || price.product} —{' '}
                    {formatAmount(price.unit_amount, price.currency)}
                    {price.recurring ? ` / ${price.recurring.interval}` : ' (one-time)'}
                  </option>
                ))}
              </select>
            </label>

            {selectedPrice && (
              <p className="hint">
                Using <code>{selectedPrice.id}</code>
              </p>
            )}

            <div className="toolbar">
              <button type="submit" className="btn" disabled={loading || !selectedPriceId}>
                Create Payment Link
              </button>
              {lastCreatedUrl && (
                <a
                  href={lastCreatedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary link-btn"
                >
                  Open Link
                </a>
              )}
            </div>
          </form>
        )}
      </div>

      {lastCreatedUrl && (
        <div className="card highlight-card">
          <h3>Latest link</h3>
          <p>
            <a href={lastCreatedUrl} target="_blank" rel="noreferrer">
              {lastCreatedUrl}
            </a>
          </p>
          <button
            type="button"
            className="copy-btn"
            onClick={() => navigator.clipboard.writeText(lastCreatedUrl)}
          >
            Copy URL
          </button>
        </div>
      )}

      <div className="toolbar">
        <button type="button" className="btn btn-secondary" onClick={handleListLinks} disabled={loading}>
          List Payment Links
        </button>
        <button type="button" className="btn btn-secondary" onClick={loadAll} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="card">
        <h3>Payment Links ({paymentLinks.length})</h3>
        {paymentLinks.length === 0 ? (
          <p className="muted">No payment links yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>URL</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paymentLinks.map((link) => (
                <tr key={link.id}>
                  <td><code>{link.id}</code></td>
                  <td>
                    <a href={link.url} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  </td>
                  <td>{link.active ? 'Yes' : 'No'}</td>
                  <td>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => navigator.clipboard.writeText(link.url)}
                    >
                      Copy URL
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Test card</h3>
        <p>
          <code>4242 4242 4242 4242</code> — any future expiry, any CVC, any ZIP
        </p>
      </div>

      <div className="card">
        <h3>Exercises</h3>
        <ul className="checklist">
          <li>Create a link for your Ebook price → pay → find Payment in Dashboard</li>
          <li>Notice a Customer was created automatically</li>
          <li>Trace: Payment Link → Checkout → Payment Intent → Charge</li>
          <li>Check Webhook Logs for events after payment</li>
        </ul>
      </div>
    </section>
  );
}
