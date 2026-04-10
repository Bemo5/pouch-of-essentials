export default function ItemRow({ item, onToggle, onToggleUrgent, onDelete }) {
  return (
    <li className={`item ${item.done ? 'is-done' : ''} ${item.urgent ? 'is-urgent' : ''}`}>
      <button
        className="check"
        onClick={onToggle}
        aria-label={item.done ? 'Mark not done' : 'Mark done'}
      >
        {item.done ? '✓' : ''}
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
      <button
        className={`icon-btn urgent-btn ${item.urgent ? 'on' : ''}`}
        onClick={onToggleUrgent}
        aria-label="Toggle urgent"
        title="Urgent"
      >
        !
      </button>
      <button className="icon-btn delete-btn" onClick={onDelete} aria-label="Delete item">
        ×
      </button>
    </li>
  );
}
