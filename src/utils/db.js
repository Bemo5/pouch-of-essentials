import { openDB } from 'idb';

export const DB_NAME = 'pouch-of-essentials';
export const DB_VERSION = 1;
export const STORE_ITEMS = 'items';
export const STORE_HISTORY = 'history';
export const STORE_META = 'meta';

let _dbPromise = null;

export function getDB() {
  if (!_dbPromise) {
    _dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_ITEMS)) {
          const items = db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
          items.createIndex('createdAt', 'createdAt');
          items.createIndex('urgent', 'urgent');
        }
        if (!db.objectStoreNames.contains(STORE_HISTORY)) {
          const hist = db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
          hist.createIndex('archivedAt', 'archivedAt');
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META);
        }
      }
    });
  }
  return _dbPromise;
}

export function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
