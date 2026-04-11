import { useEffect, useState } from 'react';
import GroceryList from './components/GroceryList.jsx';
import HistoryView from './components/HistoryView.jsx';
import SyncStatus from './components/SyncStatus.jsx';
import Settings, { readSetupFromHash } from './components/Settings.jsx';
import { useGroceryStore } from './hooks/useGroceryStore.js';
import { useSync } from './hooks/useSync.js';

export default function App() {
  const sync = useSync();
  const store = useGroceryStore(sync);
  const [tab, setTab] = useState('list');
  const [installEvent, setInstallEvent] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // First-run: open settings automatically if not configured, or if the URL
  // has a ?setup= deeplink from a family member sharing their pouch.
  useEffect(() => {
    const fromHash = readSetupFromHash();
    if (!sync.configured || fromHash) {
      setSettingsOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvent(e);
      const dismissed = localStorage.getItem('pouch-install-dismissed');
      if (!dismissed) setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  useEffect(() => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const dismissed = localStorage.getItem('pouch-install-dismissed');
    if (isIos && !standalone && !dismissed && sync.configured) {
      setShowInstall(true);
    }
  }, [sync.configured]);

  const dismissInstall = () => {
    setShowInstall(false);
    localStorage.setItem('pouch-install-dismissed', '1');
  };

  const doInstall = async () => {
    if (installEvent) {
      installEvent.prompt();
      await installEvent.userChoice;
      setInstallEvent(null);
    }
    dismissInstall();
  };

  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const firstRun = !sync.configured;

  return (
    <div className="app">
      <header className={`app-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div className="brand-text">
            <h1>Pouch of Essentials</h1>
            <p>Shared family grocery list</p>
          </div>
        </div>
        <SyncStatus sync={sync} onOpenSettings={() => setSettingsOpen(true)} />
      </header>

      <main className="app-main">
        {tab === 'list' ? (
          <GroceryList store={store} />
        ) : (
          <HistoryView store={store} />
        )}
      </main>

      <nav className="tabbar" role="tablist">
        <button
          className={tab === 'list' ? 'active' : ''}
          onClick={() => setTab('list')}
          role="tab"
          aria-selected={tab === 'list'}
        >
          <span className="tab-icon" aria-hidden="true">◐</span>
          <span>List</span>
          {store.items.filter((i) => !i.done).length > 0 && (
            <span className="tab-badge">{store.items.filter((i) => !i.done).length}</span>
          )}
        </button>
        <button
          className={tab === 'history' ? 'active' : ''}
          onClick={() => setTab('history')}
          role="tab"
          aria-selected={tab === 'history'}
        >
          <span className="tab-icon" aria-hidden="true">⎓</span>
          <span>History</span>
          {store.history.length > 0 && <span className="tab-badge">{store.history.length}</span>}
        </button>
      </nav>

      {showInstall && (
        <div className="install-toast" role="dialog">
          <div className="install-content">
            <strong>Install Pouch of Essentials</strong>
            {isIos ? (
              <span>
                Tap <b>Share</b> then <b>Add to Home Screen</b> to use offline.
              </span>
            ) : (
              <span>Add it to your home screen to use offline.</span>
            )}
          </div>
          <div className="install-actions">
            {installEvent && (
              <button className="btn btn-primary" onClick={doInstall}>
                Install
              </button>
            )}
            <button className="btn btn-ghost" onClick={dismissInstall}>
              Not now
            </button>
          </div>
        </div>
      )}

      <Settings
        sync={sync}
        open={settingsOpen}
        firstRun={firstRun}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
