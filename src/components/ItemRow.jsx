import { initialsOf } from '../utils/colors.js';
import { formatPriceUnit } from '../utils/stores.js';

function formatPrice(n) {
  if (n == null || !Number.isFinite(n)) return '';
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

export default function ItemRow({ item, onToggle, onToggleUrgent, onDelete, onLog }) {
  const ownerLabel = item.createdBy ? `added by ${item.createdBy}` : '';
  const hasMeta = item.qty || item.store || item.price != null || item.createdBy;
  return (
    <li
      className={`item ${item.done ? 'is-done' : ''} ${item.urgent ? 'is-urgent' : ''}`}
    >
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
              <span className="item-store" dir="auto" title={`From ${item.store}`}>
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
            {item.createdBy && (
              <span className="item-owner" title={ownerLabel}>
                <span
                  className="avatar avatar-xs"
                  style={{ background: item.createdByColor || '#888' }}
                >
                  {initialsOf(item.createdBy)}
                </span>
                <span className="item-owner-name" dir="auto">
                  {item.createdBy}
                </span>
              </span>
            )}
          </div>
        )}
      </div>
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
            className={`icon-btn ${item.urgent ? 'on' : ''}`}
            onClick={onToggleUrgent}
            aria-label="Toggle urgent"
            title="Urgent"
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
