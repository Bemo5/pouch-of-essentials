import { useState } from 'react';
import { STORES } from '../utils/stores.js';

export default function AddItemForm({ onAdd }) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [store, setStore] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onAdd({ name, qty, urgent, store });
    setName('');
    setQty('');
    setUrgent(false);
    setStore('');
  };

  return (
    <form className={`composer ${expanded ? 'expanded' : ''}`} onSubmit={submit}>
      <div className="composer-row">
        <span className="composer-icon" aria-hidden="true">+</span>
        <input
          className="composer-name"
          type="text"
          dir="auto"
          placeholder="Add to pouch…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          enterKeyHint="done"
          aria-label="Item name"
        />
        <input
          className="composer-qty"
          type="text"
          dir="auto"
          placeholder="qty"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          autoComplete="off"
          aria-label="Quantity"
        />
        <button
          type="button"
          className={`composer-urgent ${urgent ? 'on' : ''}`}
          onClick={() => setUrgent((v) => !v)}
          aria-pressed={urgent}
          aria-label="Mark as urgent"
          title="Urgent"
        >
          !
        </button>
        <button
          type="button"
          className={`composer-more ${expanded ? 'on' : ''}`}
          onClick={() => setExpanded((v) => !v)}
          aria-pressed={expanded}
          aria-label="More details"
          title="Store & price"
        >
          ⋯
        </button>
        <button
          type="submit"
          className="composer-add"
          disabled={!name.trim()}
          aria-label="Add item"
        >
          →
        </button>
      </div>
      {expanded && (
        <div className="composer-extras">
          <input
            className="composer-store"
            type="text"
            dir="auto"
            placeholder="From where? (shop)"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            autoComplete="off"
            list="store-suggestions"
            aria-label="Store"
          />
          <datalist id="store-suggestions">
            {STORES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      )}
    </form>
  );
}
