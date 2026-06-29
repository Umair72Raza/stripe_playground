import { useCallback, useEffect, useState } from 'react';
import { getWebhookEvents, getWebhookStatus } from '../api';
import { usePlayground } from '../context/PlaygroundContext';

export default function WebhooksPage() {
  const { setLastResponse } = usePlayground();
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const [eventData, statusData] = await Promise.all([
        getWebhookEvents(),
        getWebhookStatus(),
      ]);
      setEvents(eventData);
      setStatus(statusData);
      setLastResponse({ events: eventData, status: statusData });
      setError(null);
    } catch (err) {
      setError(err.message);
      setLastResponse({ error: err.message });
    }
  }, [setLastResponse]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 3000);
    return () => clearInterval(interval);
  }, [loadAll]);

  const filtered = filter
    ? events.filter((event) => event.type.includes(filter))
    : events;

  return (
    <section className="page">
      <header className="page-header">
        <h2>Phase 4 — Webhook Logs</h2>
        <p>
          Events Stripe pushes to your ngrok URL. Payment Links do not know your app users —
          webhooks tell you a payment happened and include customer email when available.
        </p>
      </header>

      <div className="card">
        <h3>Webhook status</h3>
        {status ? (
          <ul className="checklist">
            <li>Secret configured: {status.webhookSecretConfigured ? 'Yes' : 'No'}</li>
            <li>Events in log: {status.eventCount}</li>
            <li>Total received (all time): {status.totalReceived}</li>
            <li>Last event: {status.lastEventType || '—'}</li>
            <li>Last received: {status.lastReceivedAt || '—'}</li>
            {status.lastError && (
              <li className="error-text">
                Last error ({status.lastErrorAt}): {status.lastError}
              </li>
            )}
          </ul>
        ) : (
          <p className="muted">Loading status...</p>
        )}
      </div>

      <div className="card">
        <h3>If you see no events — checklist</h3>
        <ul className="checklist">
          <li>
            ngrok running: <code>ngrok http 5000</code> (expose backend, not frontend)
          </li>
          <li>
            Stripe endpoint URL: <code>https://YOUR-NGROK-URL/webhook</code> (must include{' '}
            <code>/webhook</code>)
          </li>
          <li>
            After ngrok restarts, URL changes — update Stripe endpoint and copy the new{' '}
            <code>whsec_...</code> into <code>backend/.env</code>
          </li>
          <li>Restart backend after changing <code>STRIPE_WEBHOOK_SECRET</code></li>
          <li>
            In Stripe Dashboard → Webhooks → your endpoint → check &quot;Recent deliveries&quot;
            for 400/500 errors
          </li>
          <li>
            Subscribe to events: <code>checkout.session.completed</code>,{' '}
            <code>payment_intent.succeeded</code>, <code>charge.succeeded</code>
          </li>
          <li>
            Send a test event from Dashboard → Webhooks → Send test webhook — fastest way to
            verify wiring
          </li>
          <li>
            502 errors during checkout: nodemon must ignore <code>backend/data/</code> — saving
            webhook events was restarting the server mid-delivery
          </li>
        </ul>
      </div>

      <div className="toolbar">
        <button type="button" className="btn" onClick={loadAll}>
          Refresh
        </button>
        <input
          type="text"
          placeholder="Filter by event type..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input"
        />
      </div>

      {error && <p className="error-text">{error}</p>}

      {filtered.length === 0 ? (
        <div className="card">
          <p className="muted">
            No webhook events yet. Use &quot;Send test webhook&quot; in Stripe Dashboard first.
            If test works but real payments do not, check which events your endpoint listens to.
          </p>
        </div>
      ) : (
        <div className="event-list">
          {filtered.map((event) => (
            <article key={event.id} className="event-card">
              <div className="event-meta">
                <strong>{event.type}</strong>
                <span>{new Date(event.created * 1000).toLocaleString()}</span>
              </div>
              <code className="event-id">{event.id}</code>
              {event.data?.object?.id && (
                <p>
                  Object: <code>{event.data.object.id}</code>
                </p>
              )}
              {event.data?.object?.customer_email && (
                <p>
                  Email: <code>{event.data.object.customer_email}</code>
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
