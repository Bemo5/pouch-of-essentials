import { useMemo } from 'react';
import { normalizeName } from '../utils/normalizeName.js';

// How many chips to show at most.
const MAX_CHIPS = 6;
// Hide the row once the active list is this long — once you're deep into
// building a list, suggestions become noise.
const HIDE_WHEN_LIST_AT_LEAST = 15;
// How many of the most recent archives to scan. Older than this doesn't
// influence suggestions at all.
const LOOKBACK_ENTRIES = 20;
// Recency weight: each week older multiplies the score by this.
const DECAY_PER_WEEK = 0.85;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Compute the top frequent items from history, weighted by recency and
// filtered against anything already on the active list.
function computeRecent(history, activeItems) {
  if (!history || history.length === 0) return [];
  const onList = new Set(activeItems.map((i) => normalizeName(i.name)));
  const now = Date.now();
  const scored = new Map(); // key -> { display, score, lastSeen }

  const recent = history.slice(0, LOOKBACK_ENTRIES);
  for (const entry of recent) {
    const archivedAt = entry.archivedAt || entry.updatedAt || now;
    const weeksAgo = Math.max(0, (now - archivedAt) / WEEK_MS);
    const weight = Math.pow(DECAY_PER_WEEK, weeksAgo);
    for (const item of entry.items || []) {
      const key = normalizeName(item.name);
      if (!key) continue;
      if (onList.has(key)) continue;
      const cur = scored.get(key);
      if (cur) {
        cur.score += weight;
        if (archivedAt > cur.lastSeen) {
          cur.lastSeen = archivedAt;
          cur.display = item.name; // prefer most-recent capitalization
        }
      } else {
        scored.set(key, {
          display: item.name,
          score: weight,
          lastSeen: archivedAt
        });
      }
    }
  }

  return Array.from(scored.values())
    .sort((a, b) => b.score - a.score || b.lastSeen - a.lastSeen)
    .slice(0, MAX_CHIPS);
}

export default function RecentItems({ history, items, onAdd }) {
  const suggestions = useMemo(
    () => computeRecent(history, items),
    [history, items]
  );

  if (items.length >= HIDE_WHEN_LIST_AT_LEAST) return null;
  if (suggestions.length === 0) return null;

  return (
    <div className="recent-row" aria-label="Frequent items">
      <span className="recent-label">Often</span>
      <div className="recent-chips">
        {suggestions.map((s) => (
          <button
            key={s.display}
            type="button"
            className="recent-chip"
            onClick={() => onAdd({ name: s.display })}
            title={`Add "${s.display}"`}
          >
            <span className="recent-chip-plus" aria-hidden="true">+</span>
            <span dir="auto">{s.display}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
