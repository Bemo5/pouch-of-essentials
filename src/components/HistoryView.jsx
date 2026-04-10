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
        <div className="empty">
          <div className="empty-emoji">📜</div>
          <p>No past lists yet.</p>
          <p className="muted">Completed or archived lists will show up here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-screen">
      <h2 className="screen-title">Past lists</h2>
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
                <span className="chev">{open ? '▾' : '▸'}</span>
              </button>
              {open && (
                <div className="history-body">
                  <ul className="items">
                    {entry.items.map((item) => (
                      <li
                        key={item.id}
                        className={`item read-only ${item.done ? 'is-done' : ''} ${
                          item.urgent ? 'is-urgent' : ''
                        }`}
                      >
                        <span className="check static">{item.done ? '✓' : ''}</span>
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
