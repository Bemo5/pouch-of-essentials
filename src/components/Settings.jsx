import { useEffect, useState } from 'react';
import { gistCreate, verifyToken } from '../hooks/useSync.js';
import { PALETTE, initialsOf, randomColor } from '../utils/colors.js';

// Modal flow:
//   profile  — "What's your name?" + color picker. Always first on fresh install.
//   join     — Setup link detected, tap "Join pouch" to connect.
//   connect  — Owner first-run, Sign in with GitHub + paste token.
//   settings — Configured; iOS-style settings view.

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

// ----- Profile step ---------------------------------------------------

function ProfileStep({ profileHook, onNext, firstRun }) {
  const { profile, setProfile } = profileHook;
  const [name, setName] = useState(profile?.name || '');
  const [color, setColor] = useState(profile?.color || randomColor());

  const submit = (e) => {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setProfile({ name: trimmed, color });
    onNext?.();
  };

  return (
    <form className="profile-step" onSubmit={submit}>
      <div className="profile-preview">
        <div
          className="avatar avatar-xl"
          style={{ background: color }}
          aria-hidden="true"
        >
          {initialsOf(name || '?')}
        </div>
        <div className="color-swatches">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch ${c === color ? 'selected' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`Pick color ${c}`}
            />
          ))}
        </div>
      </div>
      <input
        className="input input-big"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus={firstRun}
        maxLength={24}
        dir="auto"
        enterKeyHint="done"
      />
      <p className="muted small" style={{ textAlign: 'center', marginTop: -6 }}>
        Family sees this on every item you add.
      </p>
    </form>
  );
}

// ----- Join step -------------------------------------------------------

function JoinStep({ profile, busy, error, userInfo }) {
  return (
    <div className="welcome">
      <div
        className="avatar avatar-xl"
        style={{ background: profile?.color || '#d2691e', margin: '0 auto 20px' }}
      >
        {initialsOf(profile?.name || '?')}
      </div>
      <h2 className="welcome-title">Ready to join, {profile?.name}</h2>
      <p className="welcome-sub">
        Tap below to connect to your family's shared pouch. Takes about a second.
      </p>
      {busy && (
        <div className="muted small" style={{ marginTop: 18 }}>
          Connecting…
        </div>
      )}
      {error && (
        <div className="error-box" style={{ textAlign: 'start' }}>
          <span>⚠</span>
          <div>{error}</div>
        </div>
      )}
      {userInfo && (
        <div className="success-box" style={{ textAlign: 'start' }}>
          <span>✓</span>
          <div>You're in!</div>
        </div>
      )}
    </div>
  );
}

// ----- Connect step (owner only) --------------------------------------

function ConnectStep({ token, setToken, error, userInfo }) {
  const [clipboardSupported] = useState(
    () => typeof navigator !== 'undefined' && !!navigator.clipboard?.readText
  );

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text?.trim()) setToken(text.trim());
    } catch {}
  };

  return (
    <div className="connect-steps">
      <div className={`connect-step ${!token ? 'active' : 'done'}`}>
        <div className="connect-step-num">1</div>
        <div className="connect-step-body">
          <strong>Sign in with GitHub</strong>
          <div className="muted">
            One-time, 30 seconds. Your family won't ever see this screen — they just tap
            your invite link.
          </div>
          <a
            className="btn btn-github btn-small"
            href={TOKEN_URL}
            target="_blank"
            rel="noreferrer"
          >
            <span style={{ fontSize: 15 }}>↗</span> Open GitHub token page
          </a>
        </div>
      </div>

      <div className={`connect-step ${token && !userInfo ? 'active' : token ? 'done' : ''}`}>
        <div className="connect-step-num">2</div>
        <div className="connect-step-body">
          <strong>Paste the token</strong>
          <div className="muted">Long-press to paste, or tap the button.</div>
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

function SettingsView({ sync, profileHook, copied, onCopyShare, onEditProfile, onDisconnect }) {
  const { profile } = profileHook;
  return (
    <>
      <div className="settings-group-title">You</div>
      <div className="settings-group">
        <button className="settings-row settings-row-button" onClick={onEditProfile}>
          <div
            className="avatar avatar-md"
            style={{ background: profile?.color || '#d2691e' }}
          >
            {initialsOf(profile?.name || '?')}
          </div>
          <div className="settings-row-label">{profile?.name || 'Set your name'}</div>
          <span className="chev">›</span>
        </button>
      </div>

      <div className="settings-group-title">Family</div>
      <div className="settings-group">
        <button
          className="settings-action"
          style={{ color: 'var(--brand)' }}
          onClick={onCopyShare}
        >
          {copied ? '✓ Copied — text it to your family' : 'Copy family invite link'}
        </button>
      </div>
      <p className="muted" style={{ fontSize: 12, padding: '0 4px 20px', lineHeight: 1.4 }}>
        The link contains your access token, so only share with people you trust — they
        can read and edit the pouch.
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

export default function Settings({ sync, profileHook, open, onClose, firstRun }) {
  const [token, setToken] = useState(sync.token || '');
  const [gistId, setGistId] = useState(sync.gistId || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState('profile');
  const [hasSetupHash, setHasSetupHash] = useState(false);

  // Reset state + determine initial step whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setUserInfo(null);
    setCopied(false);

    const fromHash = readSetupFromHash();
    const hasSetup = !!(fromHash?.token || fromHash?.gistId);
    setHasSetupHash(hasSetup);
    if (hasSetup) {
      if (fromHash.token) setToken(fromHash.token);
      if (fromHash.gistId) setGistId(fromHash.gistId);
    } else {
      setToken(sync.token || '');
      setGistId(sync.gistId || '');
    }

    if (!profileHook.configured) {
      setStep('profile');
    } else if (hasSetup && !sync.configured) {
      setStep('join');
    } else if (!sync.configured) {
      setStep('connect');
    } else {
      setStep('settings');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  // Called after profile is entered — moves to the correct next step.
  const onProfileNext = () => {
    if (hasSetupHash && !sync.configured) {
      setStep('join');
    } else if (!sync.configured) {
      setStep('connect');
    } else {
      // Editing profile from settings → go back to settings.
      setStep('settings');
    }
  };

  const runConnect = async () => {
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
          editor: profileHook.profile?.name || 'Pouch'
        });
        finalGistId = created.id;
        setGistId(finalGistId);
      }
      sync.updateConfig({ token: token.trim(), gistId: finalGistId });
      clearSetupHash();
      setBusy(false);
      setTimeout(() => onClose(), 700);
    } catch (e) {
      setBusy(false);
      setError(
        String(e.message || e).includes('401')
          ? "That token didn't work. Did you copy all of it?"
          : String(e.message || e)
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

  const title =
    step === 'profile'
      ? firstRun || !profileHook.configured
        ? 'Who are you?'
        : 'Edit profile'
      : step === 'join'
      ? 'Join family pouch'
      : step === 'connect'
      ? 'Connect'
      : 'Settings';

  const canClose = !firstRun && profileHook.configured;

  return (
    <div className="modal-backdrop" onClick={canClose ? onClose : undefined}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="modal-handle" />

        <div className="modal-head">
          <h2>{title}</h2>
          {canClose && (
            <button className="modal-close" onClick={onClose} aria-label="Close">
              ×
            </button>
          )}
        </div>

        <div className="modal-body">
          {step === 'profile' && (
            <ProfileStep
              profileHook={profileHook}
              onNext={onProfileNext}
              firstRun={firstRun}
            />
          )}
          {step === 'join' && (
            <JoinStep
              profile={profileHook.profile}
              busy={busy}
              error={error}
              userInfo={userInfo}
            />
          )}
          {step === 'connect' && (
            <ConnectStep
              token={token}
              setToken={setToken}
              error={error}
              userInfo={userInfo}
            />
          )}
          {step === 'settings' && sync.configured && (
            <SettingsView
              sync={sync}
              profileHook={profileHook}
              copied={copied}
              onCopyShare={copyShareLink}
              onEditProfile={() => setStep('profile')}
              onDisconnect={disconnect}
            />
          )}
        </div>

        <div className="modal-foot">
          {step === 'profile' && (
            <button
              className="btn btn-primary btn-fill"
              onClick={onProfileNext}
              disabled={!profileHook.profile?.name?.trim()}
            >
              Continue
            </button>
          )}
          {step === 'join' && (
            <button
              className="btn btn-primary btn-fill"
              onClick={runConnect}
              disabled={busy || !token.trim()}
            >
              {busy ? 'Joining…' : `Join as ${profileHook.profile?.name}`}
            </button>
          )}
          {step === 'connect' && (
            <>
              <div className="grow" />
              <button
                className="btn btn-primary"
                onClick={runConnect}
                disabled={!token.trim() || busy}
              >
                {busy ? 'Connecting…' : 'Connect'}
              </button>
            </>
          )}
          {step === 'settings' && (
            <button className="btn btn-primary btn-fill" onClick={onClose}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
