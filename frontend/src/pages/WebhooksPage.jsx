import { useCallback, useEffect, useState } from 'react';
import { getWebhookEvents } from '../api';
import { usePlayground } from '../context/PlaygroundContext';

export default function WebhooksPage() {
  const { setLastResponse } = usePlayground();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

  const loadEvents = useCallback(async () => {
    try {
      const data = await getWebhookEvents();
      setEvents(data);
      setLastResponse(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setLastResponse({ error: err.message });
    }
  }, [setLastResponse]);

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 3000);
    return () => clearInterval(interval);
  }, [loadEvents]);

  const filtered = filter
    ? events.filter((event) => event.type.includes(filter))
    : events;

  return (
    <section className="page">
      <header className="page-header">
        <h2>Phase 4 — Webhook Logs</h2>
        <p>Events received from Stripe via your ngrok endpoint. Auto-refreshes every 3s.</p>
      </header>

      <div className="toolbar">
        <button type="button" className="btn" onClick={loadEvents}>
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
          <p className="muted">No webhook events yet. Send a test event from the Stripe Dashboard or complete a test payment.</p>
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
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
