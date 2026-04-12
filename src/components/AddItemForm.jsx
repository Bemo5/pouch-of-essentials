import { useMemo, useState } from 'react';
import { STORES, PRICE_UNITS } from '../utils/stores.js';
import { normalizeName } from '../utils/normalizeName.js';

const URGENCY_LABELS = {
  0: 'Normal · tap to mark urgent',
  1: 'Urgent · tap again for super urgent',
  2: 'Super urgent · tap to clear'
};

export default function AddItemForm({ onAdd, items = [] }) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [urgency, setUrgency] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [store, setStore] = useState('');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('');

  // Build a normalized lookup of names already on the active list so we can
  // warn the user before they create an accidental duplicate. Done items
  // are not in `items` (caller passes the active list), which is what we
  // want — re-adding something you bought yesterday is intentional.
  const existingKeys = useMemo(
    () => new Set(items.map((i) => normalizeName(i.name))),
    [items]
  );
  const isDuplicate =
    name.trim() !== '' && existingKeys.has(normalizeName(name));

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onAdd({ name, qty, urgency, store, price, priceUnit });
    setName('');
    setQty('');
    setUrgency(0);
    setStore('');
    setPrice('');
    setPriceUnit('');
    setExpanded(false);
  };

  const urgencyClass =
    urgency === 2 ? 'super-urgent' : urgency === 1 ? 'on' : '';

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
        <button
          type="button"
          className={`composer-urgent ${urgencyClass}`}
          onClick={() => setUrgency((v) => (v + 1) % 3)}
          aria-label={URGENCY_LABELS[urgency]}
          title={URGENCY_LABELS[urgency]}
        >
          !
        </button>
        <button
          type="button"
          className={`composer-more ${expanded ? 'on' : ''}`}
          onClick={() => setExpanded((v) => !v)}
          aria-pressed={expanded}
          aria-label="Quantity and store"
          title="Quantity & store"
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
      {isDuplicate && (
        <div className="composer-warn" role="status">
          <span className="composer-warn-icon" aria-hidden="true">!</span>
          <span>Already on the list — add anyway?</span>
        </div>
      )}
      {expanded && (
        <div className="composer-extras">
          <input
            className="composer-qty-wide"
            type="text"
            dir="auto"
            placeholder="Quantity (2, 500g, 1 box…)"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            autoComplete="off"
            aria-label="Quantity"
          />
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
          <div className="composer-price-row">
            <input
              className="composer-price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              aria-label="Price"
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
        </div>
      )}
    </form>
  );
}
