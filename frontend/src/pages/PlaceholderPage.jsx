export default function PlaceholderPage({ title, phase, description }) {
  return (
    <section className="page">
      <header className="page-header">
        <h2>
          Phase {phase} — {title}
        </h2>
        <p>{description}</p>
      </header>
      <div className="card">
        <p className="muted">Coming next. Complete earlier phases first.</p>
      </div>
    </section>
  );
}
