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
    <form className="add-form" onSubmit={submit}>
      <div className="add-row">
        <input
          className="input input-name"
          type="text"
          dir="auto"
          placeholder="Add item… (e.g. milk, خبز)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          enterKeyHint="done"
        />
        <input
          className="input input-qty"
          type="text"
          dir="auto"
          placeholder="qty"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="add-row add-actions">
        <label className={`urgent-toggle ${urgent ? 'on' : ''}`}>
          <input
            type="checkbox"
            checked={urgent}
            onChange={(e) => setUrgent(e.target.checked)}
          />
          <span className="urgent-dot" />
          Urgent
        </label>
        <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
          Add
        </button>
      </div>
    </form>
  );
}
