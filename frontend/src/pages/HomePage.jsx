import { useEffect, useState } from 'react';
import { getHealth } from '../api';
import { usePlayground } from '../context/PlaygroundContext';

export default function HomePage() {
  const { setLastResponse } = usePlayground();
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);

  async function checkHealth() {
    setStatus('checking');
    setError(null);

    try {
      const data = await getHealth();
      setLastResponse(data);
      setStatus(data.ok ? 'connected' : 'error');
    } catch (err) {
      setError(err.message);
      setStatus('error');
      setLastResponse({ error: err.message });
    }
  }

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <section className="page">
      <header className="page-header">
        <h2>Phase 0 — Scaffold</h2>
        <p>Verify the backend is running and Stripe keys are loaded.</p>
      </header>

      <div className="card">
        <div className={`status-badge status-${status}`}>
          {status === 'checking' && 'Checking backend...'}
          {status === 'connected' && 'Backend connected'}
          {status === 'error' && 'Backend unreachable'}
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="button" className="btn" onClick={checkHealth}>
          Run Health Check
        </button>
      </div>

      <div className="card">
        <h3>What is wired up</h3>
        <ul className="checklist">
          <li>Express API on port 5000</li>
          <li>Stripe SDK initialized with secret key</li>
          <li>POST /webhook with signature verification</li>
          <li>GET /webhook/events for the logs page</li>
        </ul>
      </div>

      <div className="card">
        <h3>ngrok webhook</h3>
        <p>
          Point your Stripe endpoint to{' '}
          <code>https://YOUR-NGROK-URL/webhook</code> and events will show up
          on the Webhook Logs page.
        </p>
      </div>
    </section>
  );
}
