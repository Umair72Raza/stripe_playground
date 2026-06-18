export default function IdsStrip({ ids }) {
  const entries = Object.entries(ids);

  return (
    <footer className="ids-strip">
      <span className="ids-label">Last IDs</span>
      <div className="ids-list">
        {entries.map(([key, value]) => (
          <div key={key} className="id-chip">
            <span className="id-key">{key}</span>
            <code>{value || '—'}</code>
            {value && (
              <button
                type="button"
                className="copy-btn"
                onClick={() => navigator.clipboard.writeText(value)}
              >
                Copy
              </button>
            )}
          </div>
        ))}
      </div>
    </footer>
  );
}
