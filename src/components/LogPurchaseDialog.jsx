import { useEffect, useState } from 'react';
import { STORES, PRICE_UNITS } from '../utils/stores.js';

// Small sheet used to record store + price after a user has actually
// bought an item. Opens from the "$" button on done items.

export default function LogPurchaseDialog({ item, onSave, onCancel }) {
  const [store, setStore] = useState('');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('');

  useEffect(() => {
    if (!item) return;
    setStore(item.store || '');
    setPrice(item.price != null ? String(item.price) : '');
    setPriceUnit(item.priceUnit || '');
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
      price: Number.isFinite(priceNum) ? priceNum : null,
      priceUnit: priceNum != null ? priceUnit : ''
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
            list="store-suggestions"
            autoFocus
          />
          <datalist id="store-suggestions">
            {STORES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <label className="log-field">
          <span className="log-label">Price</span>
          <div className="price-row">
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
            <div className="unit-chips" role="radiogroup" aria-label="Price unit">
              {PRICE_UNITS.map((u) => (
                <button
                  key={u.value || 'total'}
                  type="button"
                  role="radio"
                  aria-checked={priceUnit === u.value}
                  className={`unit-chip ${priceUnit === u.value ? 'on' : ''}`}
                  onClick={() => setPriceUnit(u.value)}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
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
