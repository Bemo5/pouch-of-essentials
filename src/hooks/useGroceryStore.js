import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getDB,
  newId,
  STORE_ITEMS,
  STORE_HISTORY
} from '../utils/db.js';

// Item shape:
//   { id, name, qty, urgent, done, deleted?, createdAt, updatedAt }
//
// History entry:
//   { id, items: [...], archivedAt, auto? }
//
// Sync model: the hook owns IndexedDB and exposes the current logical state
// (items filtered of tombstones + history). On any mutation we mark the sync
// layer dirty; the sync layer debounces and read-merge-writes the gist.
// Incoming remote states (from polling or BroadcastChannel) are merged into
// IndexedDB using updatedAt, so concurrent edits and deletes converge.

async function loadAllFromDb() {
  const db = await getDB();
  const [allItems, allHistory] = await Promise.all([
    db.getAll(STORE_ITEMS),
    db.getAll(STORE_HISTORY)
  ]);
  return { items: allItems, history: allHistory };
}

async function applyRemoteState(remote) {
  if (!remote) return;
  const db = await getDB();
  const tx = db.transaction([STORE_ITEMS, STORE_HISTORY], 'readwrite');
  const itemsStore = tx.objectStore(STORE_ITEMS);
  const histStore = tx.objectStore(STORE_HISTORY);

  // Merge items by id: keep whichever record has the higher updatedAt.
  const existingItems = await itemsStore.getAll();
  const itemMap = new Map(existingItems.map((i) => [i.id, i]));
  for (const incoming of remote.items || []) {
    if (!incoming || !incoming.id) continue;
    const cur = itemMap.get(incoming.id);
    if (!cur || (incoming.updatedAt || 0) > (cur.updatedAt || 0)) {
      await itemsStore.put(incoming);
    }
  }

  // Merge history by id with LWW semantics so history deletions (which are
  // soft-deletes with a bumped updatedAt) actually propagate to peers.
  const existingHist = await histStore.getAll();
  const histMap = new Map(existingHist.map((h) => [h.id, h]));
  for (const h of remote.history || []) {
    if (!h || !h.id) continue;
    const cur = histMap.get(h.id);
    if (!cur || (h.updatedAt || 0) > (cur.updatedAt || 0)) {
      await histStore.put(h);
    }
  }

  await tx.done;
}

export function useGroceryStore(sync, profile) {
  const [rawItems, setRawItems] = useState([]);
  const [rawHistory, setRawHistory] = useState([]);
  const [ready, setReady] = useState(false);
  // Guard against the auto-archive path firing twice for the same finished
  // set (e.g. mobile click+touch double-fire, or a re-entry from a remote
  // merge racing with the local mutation).
  const autoArchiveLastRef = useRef(null);
  const autoArchiveInFlightRef = useRef(false);

  // Visible items + history filter out tombstones. raw* is what we sync.
  const items = rawItems.filter((i) => !i.deleted);
  const history = rawHistory
    .filter((h) => !h.deleted)
    .sort((a, b) => b.archivedAt - a.archivedAt);

  const refresh = useCallback(async () => {
    const { items: all, history: allHistory } = await loadAllFromDb();
    setRawItems(all);
    setRawHistory(allHistory);
  }, []);

  useEffect(() => {
    refresh().then(() => setReady(true));
  }, [refresh]);

  // Hook up sync: provide the local state snapshot, and handle remote updates.
  useEffect(() => {
    if (!sync || !sync.registerLocal) return;
    sync.registerLocal(
      () => ({
        items: rawItems,
        history: rawHistory
      }),
      async (state /*, meta */) => {
        await applyRemoteState(state);
        await refresh();
      }
    );
  }, [sync, rawItems, rawHistory, refresh]);

  const markDirty = useCallback(() => {
    if (sync?.markDirty) sync.markDirty();
  }, [sync]);

  // --- Mutations ---

  const addItem = useCallback(
    async ({ name, qty = '', urgency = 0, store = '', price = '', priceUnit = '' }) => {
      const trimmed = (name || '').trim();
      if (!trimmed) return;
      const now = Date.now();
      const priceNum = String(price).trim() === '' ? null : Number(price);
      const lvl = Math.max(0, Math.min(2, Number(urgency) || 0));
      const item = {
        id: newId(),
        name: trimmed,
        qty: (qty || '').trim(),
        store: (store || '').trim(),
        price: Number.isFinite(priceNum) ? priceNum : null,
        priceUnit: priceUnit || '',
        urgency: lvl,
        urgent: lvl > 0,
        done: false,
        deleted: false,
        createdAt: now,
        updatedAt: now,
        createdBy: profile?.name || null,
        createdByColor: profile?.color || null
      };
      const db = await getDB();
      await db.put(STORE_ITEMS, item);
      await refresh();
      markDirty();
    },
    [refresh, markDirty, profile]
  );

  const updateItem = useCallback(
    async (id, patch) => {
      const db = await getDB();
      const cur = await db.get(STORE_ITEMS, id);
      if (!cur) return;
      const next = { ...cur, ...patch, updatedAt: Date.now() };
      await db.put(STORE_ITEMS, next);
      await refresh();
      markDirty();
    },
    [refresh, markDirty]
  );

  const toggleDone = useCallback(
    async (id) => {
      const cur = rawItems.find((i) => i.id === id);
      if (!cur) return;
      const willBeDone = !cur.done;
      await updateItem(id, { done: willBeDone });
      // If the user just marked the last remaining active item done,
      // auto-archive the whole list. We re-read from the DB to get the
      // post-update snapshot rather than relying on React state.
      if (!willBeDone) return;
      const db = await getDB();
      const all = await db.getAll(STORE_ITEMS);
      const live = all.filter((i) => !i.deleted);
      if (live.length === 0) return;
      if (!live.every((i) => i.done)) return;
      if (autoArchiveInFlightRef.current) return;
      const signature = live.map((i) => i.id).sort().join('|');
      if (autoArchiveLastRef.current === signature) return;
      autoArchiveLastRef.current = signature;
      autoArchiveInFlightRef.current = true;
      try {
        const now = Date.now();
        const entry = {
          id: newId(),
          items: live,
          archivedAt: now,
          updatedAt: now,
          auto: true
        };
        await db.put(STORE_HISTORY, entry);
        for (const i of live) {
          await db.put(STORE_ITEMS, { ...i, deleted: true, updatedAt: now });
        }
        await refresh();
        markDirty();
      } finally {
        autoArchiveInFlightRef.current = false;
      }
    },
    [rawItems, updateItem, refresh, markDirty]
  );

  // Cycle urgency: none → urgent → super urgent → none.
  const cycleUrgency = useCallback(
    (id) => {
      const cur = rawItems.find((i) => i.id === id);
      if (!cur) return;
      const prev = Number(cur.urgency) || (cur.urgent ? 1 : 0);
      const next = (prev + 1) % 3;
      return updateItem(id, { urgency: next, urgent: next > 0 });
    },
    [rawItems, updateItem]
  );

  const deleteItem = useCallback(
    async (id) => {
      // Soft-delete with a tombstone so the deletion propagates instead of
      // being "re-hydrated" by a stale peer on next sync.
      const db = await getDB();
      const cur = await db.get(STORE_ITEMS, id);
      if (!cur) return;
      const tomb = { ...cur, deleted: true, updatedAt: Date.now() };
      await db.put(STORE_ITEMS, tomb);
      await refresh();
      markDirty();
    },
    [refresh, markDirty]
  );

  const archiveCurrentList = useCallback(
    async () => {
      const db = await getDB();
      const all = await db.getAll(STORE_ITEMS);
      const live = all.filter((i) => !i.deleted);
      if (live.length === 0) return;
      const now = Date.now();
      const entry = {
        id: newId(),
        items: live,
        archivedAt: now,
        updatedAt: now
      };
      await db.put(STORE_HISTORY, entry);
      // Tombstone every live item
      for (const i of live) {
        await db.put(STORE_ITEMS, { ...i, deleted: true, updatedAt: now });
      }
      await refresh();
      markDirty();
    },
    [refresh, markDirty]
  );

  const deleteHistoryEntry = useCallback(
    async (id) => {
      // Soft-delete so the removal propagates via LWW merge instead of
      // being re-hydrated from a peer's stale copy.
      const db = await getDB();
      const cur = await db.get(STORE_HISTORY, id);
      if (!cur) return;
      await db.put(STORE_HISTORY, {
        ...cur,
        deleted: true,
        updatedAt: Date.now()
      });
      await refresh();
      markDirty();
    },
    [refresh, markDirty]
  );

  return {
    ready,
    items,
    history,
    addItem,
    updateItem,
    toggleDone,
    cycleUrgency,
    deleteItem,
    archiveCurrentList,
    deleteHistoryEntry,
    refresh
  };
}
