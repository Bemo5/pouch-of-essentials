import { useState } from 'react';

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export default function HistoryView({ store }) {
  const { history, deleteHistoryEntry } = store;
  const [openId, setOpenId] = useState(null);

  if (history.length === 0) {
    return (
      <div className="history-screen">
        <h2 className="screen-title">History</h2>
        <div className="empty">
          <svg
            className="empty-illustration"
            viewBox="0 0 120 120"
            fill="none"
            aria-hidden="true"
          >
            <rect x="24" y="32" width="72" height="70" rx="8" fill="#f4ecdc" stroke="#d9c9a5" strokeWidth="2" />
            <rect x="32" y="44" width="56" height="4" rx="2" fill="#d9c9a5" />
            <rect x="32" y="56" width="44" height="4" rx="2" fill="#d9c9a5" />
            <rect x="32" y="68" width="50" height="4" rx="2" fill="#d9c9a5" />
            <rect x="32" y="80" width="36" height="4" rx="2" fill="#d9c9a5" />
          </svg>
          <div className="empty-title">No past lists yet</div>
          <div className="empty-sub">
            Completed or archived lists show up here.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-screen">
      <h2 className="screen-title">History</h2>
      <ul className="history-list">
        {history.map((entry) => {
          const open = openId === entry.id;
          return (
            <li key={entry.id} className={`history-entry ${open ? 'open' : ''}`}>
              <button
                className="history-head"
                onClick={() => setOpenId(open ? null : entry.id)}
              >
                <div className="history-head-main">
                  <strong>{formatDate(entry.archivedAt)}</strong>
                  <span className="muted">
                    {entry.items.length} item{entry.items.length === 1 ? '' : 's'}
                    {entry.auto ? ' · auto' : ''}
                  </span>
                </div>
                <span className="chev">▸</span>
              </button>
              {open && (
                <div className="history-body">
                  <ul className="items">
                    {entry.items.map((item) => (
                      <li
                        key={item.id}
                        className={`item ${item.done ? 'is-done' : ''} ${
                          item.urgent ? 'is-urgent' : ''
                        }`}
                      >
                        <span className="check static">
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M5 12.5 L10 17.5 L19 7.5" />
                          </svg>
                        </span>
                        <div className="item-body">
                          <span className="item-name" dir="auto">
                            {item.name}
                          </span>
                          {item.qty && (
                            <span className="item-qty" dir="auto">
                              {item.qty}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="history-actions">
                    <button
                      className="btn btn-ghost btn-small"
                      onClick={() => {
                        if (confirm('Delete this history entry?')) {
                          deleteHistoryEntry(entry.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
