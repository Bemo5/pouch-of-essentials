import { initialsOf } from '../utils/colors.js';
import { formatPriceUnit } from '../utils/stores.js';

function formatPrice(n) {
  if (n == null || !Number.isFinite(n)) return '';
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

const URGENCY_LABELS = {
  0: 'Mark urgent',
  1: 'Urgent — tap for super urgent',
  2: 'Super urgent — tap to clear'
};

export default function ItemRow({ item, onToggle, onCycleUrgency, onDelete, onLog }) {
  const urgency = Number(item.urgency) || (item.urgent ? 1 : 0);
  const urgencyClass =
    urgency === 2 ? 'is-super-urgent' : urgency === 1 ? 'is-urgent' : '';
  const btnClass =
    urgency === 2 ? 'super-urgent' : urgency === 1 ? 'on' : '';
  const ownerLabel = item.createdBy ? `Added by ${item.createdBy}` : '';
  const hasMeta = item.qty || item.store || item.price != null;

  return (
    <li className={`item ${item.done ? 'is-done' : ''} ${urgencyClass}`}>
      <button
        className="check"
        onClick={onToggle}
        aria-label={item.done ? 'Mark not done' : 'Mark done'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5 L10 17.5 L19 7.5" />
        </svg>
      </button>
      <div className="item-body" onClick={onToggle}>
        <span className="item-name" dir="auto">
          {item.name}
        </span>
        {hasMeta && (
          <div className="item-meta">
            {item.qty && (
              <span className="item-qty" dir="auto">
                {item.qty}
              </span>
            )}
            {item.store && (
              <span className="item-store" dir="auto">
                {item.store}
              </span>
            )}
            {item.price != null && (
              <span className="item-price">
                {formatPrice(item.price)}
                {item.priceUnit && (
                  <span className="item-price-unit">{formatPriceUnit(item.priceUnit)}</span>
                )}
              </span>
            )}
          </div>
        )}
      </div>
      {item.createdBy && (
        <span
          className="item-owner-dot"
          style={{ background: item.createdByColor || '#888' }}
          title={ownerLabel}
          aria-label={ownerLabel}
        >
          {initialsOf(item.createdBy)}
        </span>
      )}
      <div className="row-actions">
        {item.done && onLog && (
          <button
            className={`icon-btn log ${item.price != null ? 'has-price' : ''}`}
            onClick={onLog}
            aria-label="Log purchase"
            title="Log where & price"
          >
            $
          </button>
        )}
        {!item.done && (
          <button
            className={`icon-btn ${btnClass}`}
            onClick={onCycleUrgency}
            aria-label={URGENCY_LABELS[urgency]}
            title={URGENCY_LABELS[urgency]}
          >
            !
          </button>
        )}
        <button
          className="icon-btn delete"
          onClick={onDelete}
          aria-label="Delete item"
          title="Delete"
        >
          ×
        </button>
      </div>
    </li>
  );
}
