import { useMemo, useState } from 'react';
import AddItemForm from './AddItemForm.jsx';
import ItemRow from './ItemRow.jsx';
import Confirm from './Confirm.jsx';
import LogPurchaseDialog from './LogPurchaseDialog.jsx';

function EmptyState() {
  return (
    <div className="empty">
      <svg
        className="empty-illustration"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="pouch-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f3a360" />
            <stop offset="1" stopColor="#b5551a" />
          </linearGradient>
        </defs>
        <path
          d="M30 46 Q60 30 90 46 L96 96 Q96 102 90 102 L30 102 Q24 102 24 96 Z"
          fill="url(#pouch-g)"
          opacity="0.92"
        />
        <path
          d="M42 46 Q42 26 60 26 Q78 26 78 46"
          stroke="#8a3e10"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="60" cy="70" r="14" fill="#fbf7ef" opacity="0.85" />
        <path
          d="M54 70 L58 74 L67 63"
          stroke="#d2691e"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <div className="empty-title">Your pouch is empty</div>
      <div className="empty-sub">
        Add milk, bread, خبز — anything you need.
      </div>
    </div>
  );
}

export default function GroceryList({ store }) {
  const { items, addItem, updateItem, toggleDone, toggleUrgent, deleteItem, archiveCurrentList } =
    store;
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [logItemId, setLogItemId] = useState(null);
  const logItem = useMemo(
    () => items.find((i) => i.id === logItemId) || null,
    [items, logItemId]
  );

  const { active, done, urgentCount } = useMemo(() => {
    const live = items.filter((i) => !i.done);
    // Urgent first, newest last inside each group
    live.sort((a, b) => {
      if (!!b.urgent - !!a.urgent) return !!b.urgent - !!a.urgent;
      return a.createdAt - b.createdAt;
    });
    const done = items
      .filter((i) => i.done)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return {
      active: live,
      done,
      urgentCount: live.filter((i) => i.urgent).length
    };
  }, [items]);

  const totalActive = active.length;
  const hasAny = items.length > 0;

  return (
    <div className="list-screen">
      <div className="hero">
        <div className="hero-title">
          {totalActive === 0 && done.length === 0
            ? 'Pouch'
            : totalActive === 0
            ? 'All done ✓'
            : `${totalActive} ${totalActive === 1 ? 'item' : 'items'}`}
        </div>
        {urgentCount > 0 && (
          <div className="hero-sub">
            <b>{urgentCount} urgent</b>
          </div>
        )}
      </div>

      <AddItemForm onAdd={addItem} />

      {!hasAny && <EmptyState />}

      {active.length > 0 && (
        <section className="section">
          <header className={`section-header ${urgentCount > 0 ? 'urgent' : ''}`}>
            {urgentCount > 0 && <span className="section-flame">●</span>}
            <h2>{urgentCount > 0 ? 'To get' : 'Shopping list'}</h2>
            <span className="section-count">{active.length}</span>
          </header>
          <ul className="items">
            {active.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onToggle={() => toggleDone(item.id)}
                onToggleUrgent={() => toggleUrgent(item.id)}
                onDelete={() => deleteItem(item.id)}
                onLog={() => setLogItemId(item.id)}
              />
            ))}
          </ul>
        </section>
      )}

      {done.length > 0 && (
        <section className="section">
          <header className="section-header">
            <h2>Done</h2>
            <span className="section-count">{done.length}</span>
          </header>
          <ul className="items">
            {done.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onToggle={() => toggleDone(item.id)}
                onToggleUrgent={() => toggleUrgent(item.id)}
                onDelete={() => deleteItem(item.id)}
                onLog={() => setLogItemId(item.id)}
              />
            ))}
          </ul>
        </section>
      )}

      {hasAny && (
        <div className="list-footer">
          <button
            className="btn btn-ghost btn-small"
            onClick={() => setArchiveOpen(true)}
          >
            Archive list
          </button>
        </div>
      )}
      <LogPurchaseDialog
        item={logItem}
        onSave={async (patch) => {
          await updateItem(logItemId, patch);
          setLogItemId(null);
        }}
        onCancel={() => setLogItemId(null)}
      />
      <Confirm
        open={archiveOpen}
        title="Archive this list?"
        message="It will move to History and the current list will be cleared."
        confirmLabel="Archive"
        onConfirm={() => {
          archiveCurrentList();
          setArchiveOpen(false);
        }}
        onCancel={() => setArchiveOpen(false)}
      />
    </div>
  );
}
