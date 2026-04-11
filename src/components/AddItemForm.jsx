import { useState } from 'react';

export default function AddItemForm({ onAdd }) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [urgent, setUrgent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onAdd({ name, qty, urgent });
    setName('');
    setQty('');
    setUrgent(false);
  };

  return (
    <form className="composer" onSubmit={submit}>
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
        type="submit"
        className="composer-add"
        disabled={!name.trim()}
        aria-label="Add item"
      >
        →
      </button>
    </form>
  );
}
