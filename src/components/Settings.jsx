import { useEffect, useState } from 'react';
import { gistCreate, verifyToken } from '../hooks/useSync.js';

// Setup + settings screen.
//
// First-run flow:
//   1. User creates a GitHub Personal Access Token (gist scope only) via the
//      prefilled link below.
//   2. Paste token here, tap Connect. We verify the token and, if there's no
//      gistId yet, create a fresh private gist to hold the shared state.
//   3. Family members either paste the same token + gist id, or tap a
//      "Share with family" link that encodes both into a setup URL.

function b64urlEncode(obj) {
  const json = JSON.stringify(obj);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(str) {
  try {
    const s = str.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(s)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function readSetupFromHash() {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash || '';
  const m = hash.match(/setup=([A-Za-z0-9_-]+)/);
  if (!m) return null;
  return b64urlDecode(m[1]);
}

export function clearSetupHash() {
  if (typeof window === 'undefined') return;
  if (window.location.hash.includes('setup=')) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

const TOKEN_URL =
  'https://github.com/settings/tokens/new?scopes=gist&description=Pouch%20of%20Essentials';

export default function Settings({ sync, open, onClose, firstRun }) {
  const [token, setToken] = useState(sync.token || '');
  const [gistId, setGistId] = useState(sync.gistId || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setToken(sync.token || '');
      setGistId(sync.gistId || '');
      setError(null);
      setUserInfo(null);
      setCopied(false);
    }
  }, [open, sync.token, sync.gistId]);

  // Pre-fill from setup deeplink
  useEffect(() => {
    const fromHash = readSetupFromHash();
    if (fromHash?.token) setToken(fromHash.token);
    if (fromHash?.gistId) setGistId(fromHash.gistId);
  }, []);

  if (!open) return null;

  const connect = async () => {
    setBusy(true);
    setError(null);
    try {
      const user = await verifyToken(token.trim());
      setUserInfo(user);
      let finalGistId = gistId.trim();
      if (!finalGistId) {
        const created = await gistCreate(token.trim(), {
          items: [],
          history: [],
          updatedAt: Date.now(),
          editor: sync.deviceName
        });
        finalGistId = created.id;
      }
      sync.updateConfig({ token: token.trim(), gistId: finalGistId });
      clearSetupHash();
      setBusy(false);
      if (!firstRun) onClose();
    } catch (e) {
      setBusy(false);
      setError(e.message || String(e));
    }
  };

  const disconnect = () => {
    if (confirm('Disconnect this device from the shared pouch? Local data will remain.')) {
      sync.clearConfig();
      onClose();
    }
  };

  const shareUrl = () => {
    const base = window.location.origin + window.location.pathname;
    const setup = b64urlEncode({ token: sync.token, gistId: sync.gistId });
    return `${base}#setup=${setup}`;
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      prompt('Copy this link to share with your family:', shareUrl());
    }
  };

  return (
    <div className="modal-backdrop" onClick={firstRun ? undefined : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="modal-head">
          <h2>{firstRun ? 'Welcome to Pouch of Essentials' : 'Settings'}</h2>
          {!firstRun && (
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              ×
            </button>
          )}
        </div>

        <div className="modal-body">
          {firstRun && (
            <p className="muted" style={{ marginBottom: 14 }}>
              Set up shared sync with your family. Uses a free GitHub account — no servers,
              no subscriptions, nothing that can be revoked on you.
            </p>
          )}

          <ol className="setup-steps">
            <li>
              <span className="step-num">1</span>
              <div>
                <strong>Create a token</strong>
                <div className="muted small">
                  Opens GitHub with everything pre-filled. Scroll down, tap{' '}
                  <b>Generate token</b>, copy it.
                </div>
                <a
                  className="btn btn-ghost btn-small"
                  href={TOKEN_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={{ marginTop: 8 }}
                >
                  Open GitHub token page ↗
                </a>
              </div>
            </li>

            <li>
              <span className="step-num">2</span>
              <div>
                <strong>Paste it here</strong>
                <input
                  className="input"
                  type="password"
                  autoComplete="off"
                  placeholder="ghp_..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  style={{ marginTop: 8 }}
                />
              </div>
            </li>

            <li>
              <span className="step-num">3</span>
              <div>
                <strong>Gist ID</strong>
                <div className="muted small">
                  Leave blank to create a new shared pouch. Family members paste the id
                  that's created (or tap the share link below after setup).
                </div>
                <input
                  className="input"
                  type="text"
                  autoComplete="off"
                  placeholder="(blank = create new)"
                  value={gistId}
                  onChange={(e) => setGistId(e.target.value)}
                  style={{ marginTop: 8 }}
                />
              </div>
            </li>
          </ol>

          {error && <div className="error-box">⚠ {error}</div>}
          {userInfo && (
            <div className="ok-box">
              ✓ Connected as <b>{userInfo.login}</b>
            </div>
          )}

          <div className="modal-section">
            <label className="muted small">Device name (shown to family)</label>
            <input
              className="input"
              type="text"
              value={sync.deviceName}
              onChange={(e) => sync.setDeviceName(e.target.value)}
              maxLength={24}
              dir="auto"
              style={{ marginTop: 6 }}
            />
          </div>

          {sync.configured && (
            <div className="modal-section">
              <div className="muted small">Share setup with family</div>
              <button
                className="btn btn-ghost"
                style={{ marginTop: 6, width: '100%' }}
                onClick={copyShareLink}
              >
                {copied ? '✓ Copied — text it to your family' : 'Copy family setup link'}
              </button>
              <div className="muted small" style={{ marginTop: 6 }}>
                They open the link on their phone, tap Install, and they're in. The link
                contains the token — only share it with people you trust.
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          {sync.configured && !firstRun && (
            <button className="btn btn-ghost" onClick={disconnect}>
              Disconnect
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button
            className="btn btn-primary"
            onClick={connect}
            disabled={!token.trim() || busy}
          >
            {busy ? 'Connecting…' : sync.configured ? 'Save' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}
