function timeAgo(ts) {
  if (!ts) return 'never';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function SyncStatus({ sync, onOpenSettings }) {
  let dotClass = 'off';
  let label = 'Offline';

  if (!sync.configured) {
    dotClass = 'off';
    label = 'Setup';
  } else if (sync.status === 'syncing') {
    dotClass = 'pending';
    label = 'Syncing…';
  } else if (sync.status === 'ok') {
    dotClass = 'ok';
    label = sync.lastEditor && sync.lastEditor !== sync.deviceName ? sync.lastEditor : 'Synced';
  } else if (sync.status === 'error') {
    dotClass = 'err';
    label = 'Error';
  }

  const title = sync.configured
    ? `Last sync: ${timeAgo(sync.lastSyncAt)}${
        sync.lastEditor ? ` · ${sync.lastEditor}` : ''
      }${sync.lastError ? `\n${sync.lastError}` : ''}`
    : 'Tap to set up shared sync';

  return (
    <button
      className="sync-chip"
      onClick={onOpenSettings}
      title={title}
      aria-label={title}
    >
      <span className={`sync-dot ${dotClass}`} />
      <span className="sync-label">{label}</span>
    </button>
  );
}
