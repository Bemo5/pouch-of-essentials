import { useEffect, useState } from 'react';
import { gistCreate, verifyToken } from '../hooks/useSync.js';

// Onboarding + settings.
//
// First-run is a two-screen flow:
//   1. Welcome — explains the one-time setup in friendly terms, with a big
//      "Sign in with GitHub" primary action.
//   2. Connect — opens GitHub token create page in a new tab, shows a single
//      paste field with a "Paste from clipboard" helper.
//
// Once configured, the same component turns into an iOS-style settings
// sheet: device name, share link, disconnect.

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

// ----- Welcome / intro ------------------------------------------------

function Welcome({ onNext, isJoining }) {
  return (
    <div className="welcome">
      <div className="welcome-hero">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 8 Q12 4 19 8 L20 18 Q20 20 18 20 L6 20 Q4 20 4 18 Z" />
          <path d="M8 8 Q8 4 12 4 Q16 4 16 8" />
        </svg>
      </div>
      <h2 className="welcome-title">
        {isJoining ? "You're invited" : 'Welcome to Pouch'}
      </h2>
      <p className="welcome-sub">
        {isJoining
          ? 'Your family shared their pouch with you. One tap and you\'re in.'
          : 'A shared grocery list for your family. Works offline, syncs across every phone, nothing to pay for — ever.'}
      </p>

      {!isJoining && (
        <div className="welcome-features">
          <div className="welcome-feature">
            <div className="welcome-feature-icon">∞</div>
            <div className="welcome-feature-text">
              <strong>Free forever</strong>
              <span>No subscriptions, no accounts to maintain, no service to disappear.</span>
            </div>
          </div>
          <div className="welcome-feature">
            <div className="welcome-feature-icon">↯</div>
            <div className="welcome-feature-text">
              <strong>Synced everywhere</strong>
              <span>iPhone, Samsung, tablet, laptop — every device shows the same pouch.</span>
            </div>
          </div>
          <div className="welcome-feature">
            <div className="welcome-feature-icon">⌁</div>
            <div className="welcome-feature-text">
              <strong>Works offline</strong>
              <span>Write in the supermarket basement — it syncs when you're back up.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----- Connect (token) -------------------------------------------------

function ConnectScreen({
  token,
  setToken,
  gistId,
  setGistId,
  busy,
  error,
  userInfo,
  isJoining
}) {
  const [clipboardSupported] = useState(
    () => typeof navigator !== 'undefined' && !!navigator.clipboard?.readText
  );

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text?.trim()) setToken(text.trim());
    } catch {
      // Safari often rejects; user can paste manually.
    }
  };

  if (isJoining) {
    return (
      <div className="stack">
        <p className="muted" style={{ fontSize: 14, lineHeight: 1.5 }}>
          Your family's setup link is pre-filled. Tap <b>Join pouch</b> below to connect.
        </p>
        <div className="settings-group">
          <div className="settings-row">
            <div className="settings-row-label">Status</div>
            <div className="settings-row-value">
              {token ? 'Token received' : 'Waiting…'}
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-label">Gist</div>
            <div className="settings-row-value">
              {gistId ? gistId.slice(0, 8) + '…' : 'Waiting…'}
            </div>
          </div>
        </div>
        {error && (
          <div className="error-box">
            <span>⚠</span>
            <div>{error}</div>
          </div>
        )}
        {userInfo && (
          <div className="success-box">
            <span>✓</span>
            <div>Connected as {userInfo.login}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="connect-steps">
      <div className={`connect-step ${!token ? 'active' : 'done'}`}>
        <div className="connect-step-num">1</div>
        <div className="connect-step-body">
          <strong>Sign in with GitHub</strong>
          <div className="muted">
            Tap the button, generate the token, then come back. Takes about 30 seconds.
          </div>
          <a
            className="btn btn-github btn-small"
            href={TOKEN_URL}
            target="_blank"
            rel="noreferrer"
          >
            <span style={{ fontSize: 15 }}>↗</span> Sign in with GitHub
          </a>
        </div>
      </div>

      <div className={`connect-step ${token && !userInfo ? 'active' : token ? 'done' : ''}`}>
        <div className="connect-step-num">2</div>
        <div className="connect-step-body">
          <strong>Paste the token</strong>
          <div className="muted">
            Long-press the field to paste, or tap the button below.
          </div>
          <div className="input-row">
            <input
              className="input input-mono"
              type="password"
              placeholder="ghp_…"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
              spellCheck="false"
            />
            {clipboardSupported && (
              <button
                type="button"
                className="btn btn-ghost btn-small"
                onClick={pasteFromClipboard}
              >
                Paste
              </button>
            )}
          </div>
        </div>
      </div>

      {gistId && (
        <div className="connect-step done">
          <div className="connect-step-num">3</div>
          <div className="connect-step-body">
            <strong>Pouch ID</strong>
            <div className="muted" style={{ fontFamily: 'SF Mono, Menlo, monospace', fontSize: 12 }}>
              {gistId}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-box">
          <span>⚠</span>
          <div>{error}</div>
        </div>
      )}
      {userInfo && (
        <div className="success-box">
          <span>✓</span>
          <div>Signed in as <b>{userInfo.login}</b></div>
        </div>
      )}
    </div>
  );
}

// ----- Configured settings view ---------------------------------------

function ConfiguredSettings({ sync, copied, onCopyShare, onDisconnect }) {
  return (
    <>
      <div className="settings-group-title">Device</div>
      <div className="settings-group">
        <div className="settings-row">
          <div className="settings-row-label">Name</div>
          <input
            className="input"
            type="text"
            value={sync.deviceName}
            onChange={(e) => sync.setDeviceName(e.target.value)}
            maxLength={24}
            dir="auto"
          />
        </div>
      </div>

      <div className="settings-group-title">Family</div>
      <div className="settings-group">
        <button className="settings-action" onClick={onCopyShare} style={{ color: 'var(--brand)' }}>
          {copied ? '✓ Copied — text it to your family' : 'Copy family invite link'}
        </button>
      </div>
      <p className="muted" style={{ fontSize: 12, padding: '0 4px 20px', lineHeight: 1.4 }}>
        The link lets your family join with one tap. Only share it with people you trust — it
        contains the token that lets them read and write the pouch.
      </p>

      <div className="settings-group-title">Pouch</div>
      <div className="settings-group">
        <div className="settings-row">
          <div className="settings-row-label">Gist ID</div>
          <div className="settings-row-value">{sync.gistId}</div>
        </div>
        <div className="settings-row">
          <div className="settings-row-label">Last sync</div>
          <div className="settings-row-value">
            {sync.lastSyncAt ? new Date(sync.lastSyncAt).toLocaleTimeString() : 'never'}
          </div>
        </div>
      </div>

      <div className="settings-group" style={{ marginTop: 20 }}>
        <button className="settings-action" onClick={onDisconnect}>
          Disconnect this device
        </button>
      </div>
    </>
  );
}

// ----- Main component --------------------------------------------------

export default function Settings({ sync, open, onClose, firstRun }) {
  const [token, setToken] = useState(sync.token || '');
  const [gistId, setGistId] = useState(sync.gistId || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState('welcome'); // welcome | connect
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!open) return;
    setToken(sync.token || '');
    setGistId(sync.gistId || '');
    setError(null);
    setUserInfo(null);
    setCopied(false);

    // If the URL has a setup deeplink, auto-fill and jump to connect.
    const fromHash = readSetupFromHash();
    if (fromHash?.token || fromHash?.gistId) {
      if (fromHash.token) setToken(fromHash.token);
      if (fromHash.gistId) setGistId(fromHash.gistId);
      setIsJoining(true);
      setStep('connect');
    } else if (firstRun) {
      setStep('welcome');
    } else {
      setStep('configured');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, firstRun]);

  if (!open) return null;

  const connect = async () => {
    if (!token.trim()) {
      setError('Paste the token first.');
      return;
    }
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
        setGistId(finalGistId);
      }
      sync.updateConfig({ token: token.trim(), gistId: finalGistId });
      clearSetupHash();
      setBusy(false);
      // Small delay so the success state is visible
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (e) {
      setBusy(false);
      setError(
        e.message?.includes('401')
          ? "That token didn't work. Did you copy all of it?"
          : e.message || String(e)
      );
    }
  };

  const disconnect = () => {
    if (
      confirm('Disconnect this device from the shared pouch? Your local data stays on this phone.')
    ) {
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
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copy this link to share with your family:', shareUrl());
    }
  };

  // ----- render ------------------------------------------------------

  const configured = sync.configured;
  const title =
    step === 'welcome'
      ? ''
      : step === 'connect'
      ? isJoining
        ? 'Join family pouch'
        : 'Connect'
      : 'Settings';

  return (
    <div className="modal-backdrop" onClick={firstRun ? undefined : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="modal-handle" />

        {title && (
          <div className="modal-head">
            <h2>{title}</h2>
            {!firstRun && (
              <button className="modal-close" onClick={onClose} aria-label="Close">
                ×
              </button>
            )}
          </div>
        )}

        <div className="modal-body">
          {step === 'welcome' && (
            <Welcome onNext={() => setStep('connect')} isJoining={isJoining} />
          )}
          {step === 'connect' && (
            <ConnectScreen
              token={token}
              setToken={setToken}
              gistId={gistId}
              setGistId={setGistId}
              busy={busy}
              error={error}
              userInfo={userInfo}
              isJoining={isJoining}
            />
          )}
          {step === 'configured' && configured && (
            <ConfiguredSettings
              sync={sync}
              copied={copied}
              onCopyShare={copyShareLink}
              onDisconnect={disconnect}
            />
          )}
        </div>

        <div className="modal-foot">
          {step === 'welcome' && (
            <button className="btn btn-primary btn-fill" onClick={() => setStep('connect')}>
              {isJoining ? 'Continue' : 'Get started'}
            </button>
          )}
          {step === 'connect' && (
            <>
              {!firstRun && !isJoining && (
                <button className="btn btn-ghost" onClick={() => setStep('configured')}>
                  Back
                </button>
              )}
              <div className="grow" />
              <button
                className="btn btn-primary"
                onClick={connect}
                disabled={!token.trim() || busy}
              >
                {busy ? 'Connecting…' : isJoining ? 'Join pouch' : 'Connect'}
              </button>
            </>
          )}
          {step === 'configured' && (
            <button className="btn btn-primary btn-fill" onClick={onClose}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
