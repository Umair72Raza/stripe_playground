import Sidebar from './Sidebar';
import JsonViewer from './JsonViewer';
import IdsStrip from './IdsStrip';

export default function Layout({ activeId, onSelect, children, lastResponse, ids }) {
  return (
    <div className="app-shell">
      <Sidebar activeId={activeId} onSelect={onSelect} />
      <div className="main-column">
        <main className="content">{children}</main>
        <JsonViewer data={lastResponse} />
        <IdsStrip ids={ids} />
      </div>
    </div>
  );
}
