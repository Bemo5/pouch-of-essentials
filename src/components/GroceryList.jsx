import { useMemo, useState } from 'react';
import AddItemForm from './AddItemForm.jsx';
import ItemRow from './ItemRow.jsx';
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

export default function GroceryList({ store, showToast }) {
  const {
    items,
    addItem,
    updateItem,
    toggleDone,
    cycleUrgency,
    deleteItem,
    restoreItem,
    archiveCurrentList,
    undoArchive
  } = store;
  const [doneOpen, setDoneOpen] = useState(false);
  const [logItemId, setLogItemId] = useState(null);

  const handleDelete = async (item) => {
    await deleteItem(item.id);
    showToast?.({
      message: `Deleted "${item.name}"`,
      onUndo: () => restoreItem(item.id)
    });
  };

  const handleToggle = async (id) => {
    const result = await toggleDone(id);
    if (result?.autoArchivedId) {
      showToast?.({
        message: 'List finished — archived to history',
        onUndo: () => undoArchive(result.autoArchivedId)
      });
    }
  };

  const handleArchiveAll = async () => {
    const id = await archiveCurrentList();
    if (id) {
      showToast?.({
        message: 'Archived to history',
        onUndo: () => undoArchive(id)
      });
    }
  };
  const logItem = useMemo(
    () => items.find((i) => i.id === logItemId) || null,
    [items, logItemId]
  );

  const { active, done, urgentCount, superUrgentCount } = useMemo(() => {
    const live = items.filter((i) => !i.done);
    // Super urgent first, then urgent, then newest last inside each group.
    const level = (i) => Number(i.urgency) || (i.urgent ? 1 : 0);
    live.sort((a, b) => {
      const d = level(b) - level(a);
      if (d) return d;
      return a.createdAt - b.createdAt;
    });
    const done = items
      .filter((i) => i.done)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return {
      active: live,
      done,
      urgentCount: live.filter((i) => level(i) >= 1).length,
      superUrgentCount: live.filter((i) => level(i) === 2).length
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
            {superUrgentCount > 0 && (
              <b className="hero-super">{superUrgentCount} super urgent</b>
            )}
            {urgentCount - superUrgentCount > 0 && (
              <b>{urgentCount - superUrgentCount} urgent</b>
            )}
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
                onToggle={() => handleToggle(item.id)}
                onCycleUrgency={() => cycleUrgency(item.id)}
                onDelete={() => handleDelete(item)}
                onLog={() => setLogItemId(item.id)}
              />
            ))}
          </ul>
        </section>
      )}

      {done.length > 0 && (
        <section className={`section done-section ${doneOpen ? 'open' : ''}`}>
          <button
            className="done-toggle"
            onClick={() => setDoneOpen((v) => !v)}
            aria-expanded={doneOpen}
          >
            <span className="done-toggle-label">Done</span>
            <span className="section-count">{done.length}</span>
            <span className="done-toggle-chev" aria-hidden="true">
              {doneOpen ? '▾' : '▸'}
            </span>
          </button>
          {doneOpen && (
            <>
              <ul className="items">
                {done.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => toggleDone(item.id)}
                    onCycleUrgency={() => cycleUrgency(item.id)}
                    onDelete={() => deleteItem(item.id)}
                    onLog={() => setLogItemId(item.id)}
                  />
                ))}
              </ul>
              <div className="done-actions">
                <button
                  className="btn btn-ghost btn-small"
                  onClick={handleArchiveAll}
                >
                  Archive all to history
                </button>
              </div>
            </>
          )}
        </section>
      )}
      <LogPurchaseDialog
        item={logItem}
        onSave={async (patch) => {
          await updateItem(logItemId, patch);
          setLogItemId(null);
        }}
        onCancel={() => setLogItemId(null)}
      />
    </div>
  );
}
