import { useEffect, useState } from 'react';
import { STORES, PRICE_UNITS } from '../utils/stores.js';

const URGENCY_OPTIONS = [
  { value: 0, label: 'Normal' },
  { value: 1, label: 'Urgent' },
  { value: 2, label: 'Super urgent' }
];

// Modal for editing every user-facing field on an existing item. Mirrors
// LogPurchaseDialog's pattern: open when `item` is truthy, close via ESC,
// backdrop click, or Cancel.
export default function EditItemDialog({ item, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [urgency, setUrgency] = useState(0);
  const [store, setStore] = useState('');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('');

  useEffect(() => {
    if (!item) return;
    setName(item.name || '');
    setQty(item.qty || '');
    setUrgency(Number(item.urgency) || (item.urgent ? 1 : 0));
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
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const priceStr = price.trim();
    const priceNum = priceStr === '' ? null : Number(priceStr);
    onSave({
      name: trimmedName,
      qty: qty.trim(),
      urgency,
      urgent: urgency > 0,
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
        <div className="confirm-title">Edit item</div>
        <label className="log-field">
          <span className="log-label">Name</span>
          <input
            className="input"
            type="text"
            dir="auto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>
        <label className="log-field">
          <span className="log-label">Quantity</span>
          <input
            className="input"
            type="text"
            dir="auto"
            placeholder="2, 500g, 1 box…"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </label>
        <div className="log-field">
          <span className="log-label">Urgency</span>
          <div className="urgency-pills" role="radiogroup" aria-label="Urgency">
            {URGENCY_OPTIONS.map((u) => (
              <button
                key={u.value}
                type="button"
                role="radio"
                aria-checked={urgency === u.value}
                className={`urgency-pill level-${u.value} ${
                  urgency === u.value ? 'on' : ''
                }`}
                onClick={() => setUrgency(u.value)}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
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
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
