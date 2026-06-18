export default function JsonViewer({ data }) {
  return (
    <section className="panel json-panel">
      <h2>Response</h2>
      {data ? (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      ) : (
        <p className="muted">API responses will appear here.</p>
      )}
    </section>
  );
}
