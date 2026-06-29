import { useCallback, useEffect, useState } from 'react';
import {
  createCheckoutSession,
  getCheckoutSession,
  getStoredIds,
  listPrices,
} from '../api';
import { usePlayground } from '../context/PlaygroundContext';

function formatAmount(cents, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default function CheckoutPage() {
  const { setLastResponse, setIds } = usePlayground();
  const [prices, setPrices] = useState([]);
  const [oneTimePrices, setOneTimePrices] = useState([]);
  const [selectedPriceId, setSelectedPriceId] = useState('');
  const [clientReferenceId, setClientReferenceId] = useState('user_demo_123');
  const [retrieveSessionId, setRetrieveSessionId] = useState('');
  const [returnStatus, setReturnStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadPrices = useCallback(async () => {
    try {
      const [priceData, storedIds] = await Promise.all([listPrices(), getStoredIds()]);
      setPrices(priceData);
      const oneTime = priceData.filter((price) => !price.recurring);
      setOneTimePrices(oneTime);
      setIds(storedIds);
      setError(null);

      if (!selectedPriceId && storedIds.price_id) {
        const match = oneTime.find((p) => p.id === storedIds.price_id);
        if (match) setSelectedPriceId(storedIds.price_id);
      }
      if (!selectedPriceId && oneTime.length > 0) {
        setSelectedPriceId(oneTime[0].id);
      }
      if (storedIds.checkout_session_id) {
        setRetrieveSessionId(storedIds.checkout_session_id);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [selectedPriceId, setIds]);

  const handleRetrieve = useCallback(
    async (sessionId) => {
      if (!sessionId) return;

      setLoading(true);
      setError(null);

      try {
        const session = await getCheckoutSession(sessionId);
        setLastResponse(session);
        setRetrieveSessionId(session.id);
        const storedIds = await getStoredIds();
        setIds(storedIds);
      } catch (err) {
        setError(err.message);
        setLastResponse({ error: err.message });
      } finally {
        setLoading(false);
      }
    },
    [setIds, setLastResponse],
  );

  useEffect(() => {
    loadPrices();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    const sessionId = params.get('session_id');

    if (checkout === 'success' && sessionId) {
      setReturnStatus('success');
      setRetrieveSessionId(sessionId);
      handleRetrieve(sessionId);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (checkout === 'cancel') {
      setReturnStatus('cancel');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [handleRetrieve]);

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const session = await createCheckoutSession({
        price: selectedPriceId,
        client_reference_id: clientReferenceId,
        metadata: { app_user_id: clientReferenceId },
      });
      setLastResponse(session);
      window.location.href = session.url;
    } catch (err) {
      setError(err.message);
      setLastResponse({ error: err.message });
      setLoading(false);
    }
  }

  const selectedPrice = oneTimePrices.find((p) => p.id === selectedPriceId);

  return (
    <section className="page">
      <header className="page-header">
        <h2>Phase 3 — Checkout Sessions</h2>
        <p>
          Standard SaaS flow: your backend creates a session, user pays on Stripe-hosted
          Checkout, then returns to your app. Unlike Payment Links, you control success URLs
          and can attach your user ID via <code>client_reference_id</code>.
        </p>
      </header>

      {returnStatus === 'success' && (
        <div className="card highlight-card">
          <p className="status-badge status-connected">Payment completed — session retrieved below</p>
        </div>
      )}

      {returnStatus === 'cancel' && (
        <div className="card">
          <p className="status-badge status-checking">Checkout cancelled — no charge was made</p>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      <div className="card">
        <h3>Create Checkout Session</h3>
        {oneTimePrices.length === 0 ? (
          <p className="muted">
            No one-time prices found. Create a one-time price in Phase 1 (recurring prices
            need subscription checkout in Phase 6).
          </p>
        ) : (
          <form className="form" onSubmit={handleCreate}>
            <label>
              One-time price
              <select
                className="input full"
                value={selectedPriceId}
                onChange={(e) => setSelectedPriceId(e.target.value)}
                required
              >
                {oneTimePrices.map((price) => (
                  <option key={price.id} value={price.id}>
                    {price.product?.name || price.product} —{' '}
                    {formatAmount(price.unit_amount, price.currency)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              client_reference_id (your app user)
              <input
                className="input full"
                value={clientReferenceId}
                onChange={(e) => setClientReferenceId(e.target.value)}
                placeholder="user_123"
              />
              <span className="hint">
                Stored on the session — use this to tie payment to your logged-in user
              </span>
            </label>

            {selectedPrice && (
              <p className="hint">
                Using <code>{selectedPrice.id}</code>
              </p>
            )}

            <button type="submit" className="btn" disabled={loading || !selectedPriceId}>
              Create &amp; Redirect to Checkout
            </button>
          </form>
        )}

        {prices.some((p) => p.recurring) && (
          <p className="hint">
            Recurring prices hidden here — they use <code>mode: subscription</code> in Phase 6.
          </p>
        )}
      </div>

      <div className="card">
        <h3>Retrieve Session</h3>
        <p className="hint">
          After payment, inspect <code>payment_intent</code> and <code>customer</code> on the
          session object in the Response panel.
        </p>
        <div className="toolbar">
          <input
            className="input"
            value={retrieveSessionId}
            onChange={(e) => setRetrieveSessionId(e.target.value)}
            placeholder="cs_test_..."
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleRetrieve(retrieveSessionId)}
            disabled={loading || !retrieveSessionId}
          >
            Retrieve Session
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Payment Link vs Checkout Session</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Payment Link</th>
              <th>Checkout Session</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Shareable URL</td>
              <td>Yes — same link for everyone</td>
              <td>No — new session per user</td>
            </tr>
            <tr>
              <td>Your user ID</td>
              <td>Not built-in</td>
              <td>client_reference_id + metadata</td>
            </tr>
            <tr>
              <td>Return to your app</td>
              <td>Stripe thank-you page</td>
              <td>success_url / cancel_url</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Exercises</h3>
        <ul className="checklist">
          <li>Create session → pay with 4242... → land back here with session data</li>
          <li>Note payment_intent and customer in the JSON response</li>
          <li>Compare with Payment Link flow in Dashboard</li>
          <li>Check Webhook Logs for checkout.session.completed</li>
        </ul>
      </div>
    </section>
  );
}
