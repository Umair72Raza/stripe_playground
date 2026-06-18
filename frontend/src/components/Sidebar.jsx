import { phases } from '../config';

export default function Sidebar({ activeId, onSelect }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Stripe Playground</h1>
        <p>Learn Stripe one button at a time</p>
      </div>
      <nav>
        <ul>
          {phases.map((phase) => (
            <li key={phase.id}>
              <button
                type="button"
                className={`nav-item ${activeId === phase.id ? 'active' : ''} ${phase.enabled ? '' : 'disabled'}`}
                onClick={() => phase.enabled && onSelect(phase.id)}
                disabled={!phase.enabled}
              >
                <span className="phase-num">P{phase.phase}</span>
                <span>{phase.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
