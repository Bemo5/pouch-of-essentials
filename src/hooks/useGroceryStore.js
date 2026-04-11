import { useCallback, useEffect, useState } from 'react';
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
  const map = new Map(existingItems.map((i) => [i.id, i]));
  for (const incoming of remote.items || []) {
    if (!incoming || !incoming.id) continue;
    const cur = map.get(incoming.id);
    if (!cur || (incoming.updatedAt || 0) > (cur.updatedAt || 0)) {
      await itemsStore.put(incoming);
    }
  }

  // Merge history by id (history entries are immutable once created).
  const existingHist = await histStore.getAll();
  const histIds = new Set(existingHist.map((h) => h.id));
  for (const h of remote.history || []) {
    if (!h || !h.id) continue;
    if (!histIds.has(h.id)) {
      await histStore.put(h);
    }
  }

  await tx.done;
}

export function useGroceryStore(sync, profile) {
  const [rawItems, setRawItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [ready, setReady] = useState(false);

  // Visible items filter out tombstones. rawItems is what we sync.
  const items = rawItems.filter((i) => !i.deleted);

  const refresh = useCallback(async () => {
    const { items: all, history: allHistory } = await loadAllFromDb();
    setRawItems(all);
    setHistory(allHistory.sort((a, b) => b.archivedAt - a.archivedAt));
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
        history
      }),
      async (state /*, meta */) => {
        await applyRemoteState(state);
        await refresh();
      }
    );
  }, [sync, rawItems, history, refresh]);

  const markDirty = useCallback(() => {
    if (sync?.markDirty) sync.markDirty();
  }, [sync]);

  // --- Mutations ---

  const addItem = useCallback(
    async ({ name, qty = '', urgent = false }) => {
      const trimmed = (name || '').trim();
      if (!trimmed) return;
      const now = Date.now();
      const item = {
        id: newId(),
        name: trimmed,
        qty: (qty || '').trim(),
        urgent: !!urgent,
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
      const entry = {
        id: newId(),
        items: live,
        archivedAt: Date.now(),
        auto: true
      };
      await db.put(STORE_HISTORY, entry);
      const now = Date.now();
      for (const i of live) {
        await db.put(STORE_ITEMS, { ...i, deleted: true, updatedAt: now });
      }
      await refresh();
      markDirty();
    },
    [rawItems, updateItem, refresh, markDirty]
  );

  const toggleUrgent = useCallback(
    (id) => {
      const cur = rawItems.find((i) => i.id === id);
      if (!cur) return;
      return updateItem(id, { urgent: !cur.urgent });
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
      const entry = {
        id: newId(),
        items: live,
        archivedAt: Date.now()
      };
      await db.put(STORE_HISTORY, entry);
      // Tombstone every live item
      const now = Date.now();
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
      const db = await getDB();
      await db.delete(STORE_HISTORY, id);
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
    toggleUrgent,
    deleteItem,
    archiveCurrentList,
    deleteHistoryEntry,
    refresh
  };
}
