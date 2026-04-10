import { useMemo } from 'react';
import AddItemForm from './AddItemForm.jsx';
import ItemRow from './ItemRow.jsx';

export default function GroceryList({ store }) {
  const { items, addItem, toggleDone, toggleUrgent, deleteItem, archiveCurrentList } = store;

  const { urgent, normal, done } = useMemo(() => {
    const urgent = [];
    const normal = [];
    const done = [];
    for (const i of items) {
      if (i.done) done.push(i);
      else if (i.urgent) urgent.push(i);
      else normal.push(i);
    }
    const bySeen = (a, b) => a.createdAt - b.createdAt;
    return {
      urgent: urgent.sort(bySeen),
      normal: normal.sort(bySeen),
      done: done.sort((a, b) => b.updatedAt - a.updatedAt)
    };
  }, [items]);

  const hasAny = items.length > 0;

  return (
    <div className="list-screen">
      <AddItemForm onAdd={addItem} />

      {urgent.length > 0 && (
        <section className="section section-urgent">
          <header className="section-header">
            <span className="section-dot urgent" />
            <h2>Urgent</h2>
            <span className="section-count">{urgent.length}</span>
          </header>
          <ul className="items">
            {urgent.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onToggle={() => toggleDone(item.id)}
                onToggleUrgent={() => toggleUrgent(item.id)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </ul>
        </section>
      )}

      <section className="section">
        <header className="section-header">
          <span className="section-dot" />
          <h2>Shopping list</h2>
          <span className="section-count">{normal.length}</span>
        </header>
        {normal.length === 0 && urgent.length === 0 && done.length === 0 && (
          <div className="empty">
            <div className="empty-emoji">🧺</div>
            <p>Your pouch is empty.</p>
            <p className="muted">Add milk, bread, or anything you need.</p>
          </div>
        )}
        <ul className="items">
          {normal.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onToggle={() => toggleDone(item.id)}
              onToggleUrgent={() => toggleUrgent(item.id)}
              onDelete={() => deleteItem(item.id)}
            />
          ))}
        </ul>
      </section>

      {done.length > 0 && (
        <section className="section section-done">
          <header className="section-header">
            <span className="section-dot done" />
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
              />
            ))}
          </ul>
        </section>
      )}

      {hasAny && (
        <div className="list-footer">
          <button
            className="btn btn-ghost"
            onClick={() => {
              if (confirm('Archive this list to history?')) archiveCurrentList();
            }}
          >
            Archive list
          </button>
        </div>
      )}
    </div>
  );
}
