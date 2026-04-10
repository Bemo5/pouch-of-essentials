import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// useSync — cross-device sync via a private GitHub Gist.
//
// Why a gist?
//   - Zero servers. GitHub hosts the data, and we can't be "revoked" in any
//     realistic sense: it's a free account resource.
//   - Zero hosting cost, forever.
//   - Works on any platform with a browser — iOS Safari, Android Chrome, desktop.
//   - Users can always delete the gist to wipe the shared state; they own it.
//
// How it works:
//   - The gist holds one file, "pouch.json", with the entire shared state:
//       { items: [...], history: [...], updatedAt, editor }
//   - We poll every POLL_MS, using ETag / If-None-Match so most polls return
//     304 and don't count against the API rate limit.
//   - On a local change, useGroceryStore calls `markDirty()` which debounces
//     a push. A push does read-merge-write to avoid trampling concurrent edits
//     from other family members.
//   - BroadcastChannel is used in parallel for *same-device* instant sync
//     across tabs / the installed PWA window, so two tabs on the same phone
//     update each other with no network round-trip.
//
// Item model (see useGroceryStore) uses soft deletes (`deleted: true` +
// `updatedAt`) so concurrent edits and deletes merge predictably.

const CHANNEL = 'pouch-of-essentials';
const GIST_FILE = 'pouch.json';
const POLL_MS = 4000;
const PUSH_DEBOUNCE_MS = 900;
const LS_KEY = 'pouch-config';

function loadConfig() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { token: '', gistId: '', deviceName: '' };
}

function saveConfig(cfg) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
  } catch {}
}

function randomDeviceName() {
  const a = ['Sunny', 'Cozy', 'Swift', 'Warm', 'Bright', 'Calm', 'Happy'];
  const n = ['Pouch', 'Basket', 'Bag', 'Cart', 'Nest'];
  return `${a[Math.floor(Math.random() * a.length)]} ${n[Math.floor(Math.random() * n.length)]}`;
}

// --- Gist API helpers ---

async function gistGet(token, gistId, etag) {
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (etag) headers['If-None-Match'] = etag;
  const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
  if (res.status === 304) return { unchanged: true };
  if (!res.ok) throw new Error(`Gist GET failed: ${res.status}`);
  const newEtag = res.headers.get('ETag') || null;
  const json = await res.json();
  const file = json.files?.[GIST_FILE];
  let state = null;
  if (file?.content) {
    try {
      state = JSON.parse(file.content);
    } catch {
      state = null;
    }
  }
  return { unchanged: false, state, etag: newEtag };
}

async function gistPatch(token, gistId, state) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      files: {
        [GIST_FILE]: { content: JSON.stringify(state, null, 2) }
      }
    })
  });
  if (!res.ok) throw new Error(`Gist PATCH failed: ${res.status}`);
  return res.json();
}

async function gistCreate(token, initialState) {
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      description: 'Pouch of Essentials — shared family grocery list',
      public: false,
      files: {
        [GIST_FILE]: { content: JSON.stringify(initialState, null, 2) }
      }
    })
  });
  if (!res.ok) throw new Error(`Gist create failed: ${res.status}`);
  return res.json();
}

export async function verifyToken(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error(`Token check failed: ${res.status}`);
  return res.json();
}

export { gistCreate };

// --- Merge logic ---

function mergeById(localArr, remoteArr) {
  const map = new Map();
  for (const x of localArr || []) map.set(x.id, x);
  for (const x of remoteArr || []) {
    const cur = map.get(x.id);
    if (!cur) {
      map.set(x.id, x);
    } else {
      const lu = cur.updatedAt || 0;
      const ru = x.updatedAt || 0;
      map.set(x.id, ru > lu ? x : cur);
    }
  }
  return Array.from(map.values());
}

export function mergeStates(local, remote) {
  return {
    items: mergeById(local?.items, remote?.items),
    history: mergeById(local?.history, remote?.history),
    updatedAt: Math.max(local?.updatedAt || 0, remote?.updatedAt || 0)
  };
}

// --- The hook ---

export function useSync() {
  const [config, setConfig] = useState(loadConfig);
  const [status, setStatus] = useState('idle'); // 'idle' | 'ok' | 'syncing' | 'error' | 'unconfigured'
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [lastEditor, setLastEditor] = useState(null);

  const getLocalStateRef = useRef(null);
  const onRemoteRef = useRef(null);
  const etagRef = useRef(null);
  const pushTimerRef = useRef(null);
  const channelRef = useRef(null);
  const inflightRef = useRef(false);

  const deviceName = useMemo(() => {
    if (config.deviceName) return config.deviceName;
    const fresh = randomDeviceName();
    saveConfig({ ...config, deviceName: fresh });
    return fresh;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const configured = !!(config.token && config.gistId);

  // BroadcastChannel for same-device instant sync across tabs / installed PWA.
  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel(CHANNEL);
      channelRef.current = channel;
    } catch {
      return;
    }

    const handle = (event) => {
      const data = event.data;
      if (!data || data.__type !== 'state') return;
      if (onRemoteRef.current) onRemoteRef.current(data.state, { source: 'local-tab' });
    };
    channel.addEventListener('message', handle);
    return () => {
      channel.removeEventListener('message', handle);
      channel.close();
      channelRef.current = null;
    };
  }, []);

  // --- Core operations ---

  const pullOnce = useCallback(async () => {
    if (!config.token || !config.gistId) return;
    if (inflightRef.current) return;
    if (document.visibilityState === 'hidden') return;
    inflightRef.current = true;
    try {
      const res = await gistGet(config.token, config.gistId, etagRef.current);
      if (res.unchanged) {
        setLastSyncAt(Date.now());
        setStatus('ok');
        return;
      }
      etagRef.current = res.etag;
      if (res.state && onRemoteRef.current) {
        onRemoteRef.current(res.state, { source: 'remote' });
      }
      if (res.state?.editor) setLastEditor(res.state.editor);
      setLastSyncAt(Date.now());
      setStatus('ok');
      setLastError(null);
    } catch (err) {
      console.warn('sync pull error', err);
      setStatus('error');
      setLastError(String(err.message || err));
    } finally {
      inflightRef.current = false;
    }
  }, [config.token, config.gistId]);

  const pushNow = useCallback(async () => {
    if (!config.token || !config.gistId || !getLocalStateRef.current) return;
    try {
      setStatus('syncing');
      // Read-merge-write: fetch latest, merge with ours, write merged back.
      let remote = null;
      try {
        const res = await gistGet(config.token, config.gistId, null);
        if (!res.unchanged) {
          etagRef.current = res.etag;
          remote = res.state;
        }
      } catch (e) {
        // If GET fails, still attempt to push local state.
        console.warn('pre-push read failed', e);
      }
      const local = getLocalStateRef.current();
      const merged = mergeStates(local, remote);
      merged.updatedAt = Date.now();
      merged.editor = deviceName;
      await gistPatch(config.token, config.gistId, merged);
      // After a push, invalidate etag so the next poll re-reads (GitHub sometimes
      // caches ETags briefly after a PATCH).
      etagRef.current = null;
      setLastSyncAt(Date.now());
      setStatus('ok');
      setLastError(null);
      if (onRemoteRef.current) {
        onRemoteRef.current(merged, { source: 'self-push' });
      }
      // Notify other tabs on this device immediately.
      try {
        channelRef.current?.postMessage({ __type: 'state', state: merged });
      } catch {}
    } catch (err) {
      console.warn('sync push error', err);
      setStatus('error');
      setLastError(String(err.message || err));
    }
  }, [config.token, config.gistId, deviceName]);

  const markDirty = useCallback(() => {
    if (!configured) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      pushTimerRef.current = null;
      pushNow();
    }, PUSH_DEBOUNCE_MS);

    // Also broadcast the current local state to same-device tabs immediately.
    try {
      if (channelRef.current && getLocalStateRef.current) {
        channelRef.current.postMessage({
          __type: 'state',
          state: getLocalStateRef.current()
        });
      }
    } catch {}
  }, [configured, pushNow]);

  // --- Polling loop ---

  useEffect(() => {
    if (!configured) {
      setStatus('unconfigured');
      return;
    }
    setStatus('syncing');
    pullOnce();
    const id = setInterval(pullOnce, POLL_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') pullOnce();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [configured, pullOnce]);

  // --- Public wiring from useGroceryStore ---

  const registerLocal = useCallback((getState, onRemote) => {
    getLocalStateRef.current = getState;
    onRemoteRef.current = onRemote;
  }, []);

  // --- Settings management ---

  const updateConfig = useCallback((patch) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      saveConfig(next);
      return next;
    });
    etagRef.current = null;
  }, []);

  const clearConfig = useCallback(() => {
    const kept = { token: '', gistId: '', deviceName: config.deviceName };
    setConfig(kept);
    saveConfig(kept);
    etagRef.current = null;
    setStatus('unconfigured');
  }, [config.deviceName]);

  const setDeviceName = useCallback(
    (name) => updateConfig({ deviceName: name }),
    [updateConfig]
  );

  return {
    // state
    configured,
    status,
    lastSyncAt,
    lastError,
    lastEditor,
    deviceName,
    token: config.token,
    gistId: config.gistId,
    // actions
    registerLocal,
    markDirty,
    pullOnce,
    pushNow,
    updateConfig,
    clearConfig,
    setDeviceName
  };
}
