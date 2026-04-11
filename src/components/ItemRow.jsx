export default function ItemRow({ item, onToggle, onToggleUrgent, onDelete }) {
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
        {item.qty && (
          <span className="item-qty" dir="auto">
            {item.qty}
          </span>
        )}
      </div>
      <div className="row-actions">
        <button
          className={`icon-btn ${item.urgent ? 'on' : ''}`}
          onClick={onToggleUrgent}
          aria-label="Toggle urgent"
          title="Urgent"
        >
          !
        </button>
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
