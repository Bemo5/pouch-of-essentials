import { useEffect, useState } from 'react';

// Small sheet used to record store + price after a user has actually
// bought an item. Opens from the "$" button on done items.

export default function LogPurchaseDialog({ item, onSave, onCancel }) {
  const [store, setStore] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (!item) return;
    setStore(item.store || '');
    setPrice(item.price != null ? String(item.price) : '');
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onCancel]);

  if (!item) return null;

  const save = (e) => {
    e?.preventDefault();
    const priceStr = price.trim();
    const priceNum = priceStr === '' ? null : Number(priceStr);
    onSave({
      store: store.trim(),
      price: Number.isFinite(priceNum) ? priceNum : null
    });
  };

  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <form
        className="confirm-pill log-pill"
        onClick={(e) => e.stopPropagation()}
        onSubmit={save}
      >
        <div className="confirm-title">{item.name}</div>
        <div className="confirm-message">Where did you get it, and for how much?</div>
        <label className="log-field">
          <span className="log-label">From</span>
          <input
            className="input"
            type="text"
            dir="auto"
            placeholder="Shop name"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            autoFocus
          />
        </label>
        <label className="log-field">
          <span className="log-label">Price</span>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>
        <div className="confirm-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
