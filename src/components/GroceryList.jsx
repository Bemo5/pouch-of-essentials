import { useMemo, useState } from 'react';
import AddItemForm from './AddItemForm.jsx';
import ItemRow from './ItemRow.jsx';
import LogPurchaseDialog from './LogPurchaseDialog.jsx';
import EditItemDialog from './EditItemDialog.jsx';
import RecentItems from './RecentItems.jsx';

function EmptyState() {
  return (
    <div className="empty">
      <svg
        className="empty-illustration"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="pouch-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f3a360" />
            <stop offset="1" stopColor="#b5551a" />
          </linearGradient>
        </defs>
        <path
          d="M30 46 Q60 30 90 46 L96 96 Q96 102 90 102 L30 102 Q24 102 24 96 Z"
          fill="url(#pouch-g)"
          opacity="0.92"
        />
        <path
          d="M42 46 Q42 26 60 26 Q78 26 78 46"
          stroke="#8a3e10"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="60" cy="70" r="14" fill="#fbf7ef" opacity="0.85" />
        <path
          d="M54 70 L58 74 L67 63"
          stroke="#d2691e"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <div className="empty-title">Your pouch is empty</div>
      <div className="empty-sub">
        Add milk, bread, خبز — anything you need.
      </div>
    </div>
  );
}

export default function GroceryList({ store, showToast }) {
  const {
    items,
    addItem,
    updateItem,
    toggleDone,
    cycleUrgency,
    deleteItem,
    restoreItem,
    archiveCurrentList,
    undoArchive
  } = store;
  const [doneOpen, setDoneOpen] = useState(false);
  const [logItemId, setLogItemId] = useState(null);
  const [editItemId, setEditItemId] = useState(null);
  const [sharePicker, setSharePicker] = useState(false);

  const handleDelete = async (item) => {
    await deleteItem(item.id);
    showToast?.({
      message: `Deleted "${item.name}"`,
      onUndo: () => restoreItem(item.id)
    });
  };

  const handleToggle = async (id) => {
    const result = await toggleDone(id);
    if (result?.autoArchivedId) {
      showToast?.({
        message: 'List finished — archived to history',
        onUndo: () => undoArchive(result.autoArchivedId)
      });
    }
  };

  const handleArchiveAll = async () => {
    const id = await archiveCurrentList();
    if (id) {
      showToast?.({
        message: 'Archived to history',
        onUndo: () => undoArchive(id)
      });
    }
  };

  const buildShareText = (liveItems, lang = 'en') => {
    if (liveItems.length === 0) return '';
    const level = (i) => Number(i.urgency) || (i.urgent ? 1 : 0);
    const isAr = lang === 'ar';
    const lines = liveItems.map((i) => {
      const lvl = level(i);
      const marker = lvl === 2 ? ' 🔥' : lvl === 1 ? ' ⚠️' : '';
      const meta = [];
      if (i.qty) meta.push(i.qty);
      if (i.store) meta.push(isAr ? `من ${i.store}` : i.store);
      const metaStr = meta.length ? ` (${meta.join(' · ')})` : '';
      return `• ${i.name}${metaStr}${marker}`;
    });
    const header = isAr ? '🛒 قائمة التسوق' : '🛒 Shopping list';
    return `${header}\n${lines.join('\n')}`;
  };

  const doShare = async (lang) => {
    setSharePicker(false);
    const text = buildShareText(active, lang);
    if (!text) {
      showToast?.({ message: 'Nothing to share yet' });
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast?.({ message: lang === 'ar' ? 'تم النسخ' : 'List copied to clipboard' });
    } catch {
      showToast?.({ message: lang === 'ar' ? 'حاول مرة ثانية' : "Couldn't copy — try again" });
    }
  };

  const handleShare = () => {
    if (active.length === 0) {
      showToast?.({ message: 'Nothing to share yet' });
      return;
    }
    setSharePicker(true);
  };
  const logItem = useMemo(
    () => items.find((i) => i.id === logItemId) || null,
    [items, logItemId]
  );
  const editItem = useMemo(
    () => items.find((i) => i.id === editItemId) || null,
    [items, editItemId]
  );

  const { active, done, urgentCount, superUrgentCount } = useMemo(() => {
    const live = items.filter((i) => !i.done);
    // Super urgent first, then urgent, then newest last inside each group.
    const level = (i) => Number(i.urgency) || (i.urgent ? 1 : 0);
    live.sort((a, b) => {
      const d = level(b) - level(a);
      if (d) return d;
      return a.createdAt - b.createdAt;
    });
    const done = items
      .filter((i) => i.done)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return {
      active: live,
      done,
      urgentCount: live.filter((i) => level(i) >= 1).length,
      superUrgentCount: live.filter((i) => level(i) === 2).length
    };
  }, [items]);

  const totalActive = active.length;
  const hasAny = items.length > 0;

  return (
    <div className="list-screen">
      <div className="hero">
        <div className="hero-main">
          <div className="hero-title">
            {totalActive === 0 && done.length === 0
              ? 'Pouch'
              : totalActive === 0
              ? 'All done ✓'
              : `${totalActive} ${totalActive === 1 ? 'item' : 'items'}`}
          </div>
          {urgentCount > 0 && (
            <div className="hero-sub">
              {superUrgentCount > 0 && (
                <b className="hero-super">{superUrgentCount} super urgent</b>
              )}
              {urgentCount - superUrgentCount > 0 && (
                <b>{urgentCount - superUrgentCount} urgent</b>
              )}
            </div>
          )}
        </div>
        {active.length > 0 && (
          <button
            type="button"
            className="hero-share"
            onClick={handleShare}
            aria-label="Share list"
            title="Share list"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M12 3v13M7 8l5-5 5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      <AddItemForm onAdd={addItem} items={active} />

      {/* ── FREQUENT ITEMS ROW — comment out the next line to disable ── */}
      <RecentItems history={store.history} items={items} onAdd={addItem} />

      {!hasAny && <EmptyState />}

      {active.length > 0 && (
        <section className="section">
          <header className={`section-header ${urgentCount > 0 ? 'urgent' : ''}`}>
            {urgentCount > 0 && <span className="section-flame">●</span>}
            <h2>{urgentCount > 0 ? 'To get' : 'Shopping list'}</h2>
            <span className="section-count">{active.length}</span>
          </header>
          <ul className="items">
            {active.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onToggle={() => handleToggle(item.id)}
                onCycleUrgency={() => cycleUrgency(item.id)}
                onDelete={() => handleDelete(item)}
                onLog={() => setLogItemId(item.id)}
                onEdit={() => setEditItemId(item.id)}
              />
            ))}
          </ul>
        </section>
      )}

      {done.length > 0 && (
        <section className={`section done-section ${doneOpen ? 'open' : ''}`}>
          <button
            className="done-toggle"
            onClick={() => setDoneOpen((v) => !v)}
            aria-expanded={doneOpen}
          >
            <span className="done-toggle-label">Done</span>
            <span className="section-count">{done.length}</span>
            <span className="done-toggle-chev" aria-hidden="true">
              {doneOpen ? '▾' : '▸'}
            </span>
          </button>
          {doneOpen && (
            <>
              <ul className="items">
                {done.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => toggleDone(item.id)}
                    onCycleUrgency={() => cycleUrgency(item.id)}
                    onDelete={() => deleteItem(item.id)}
                    onLog={() => setLogItemId(item.id)}
                    onEdit={() => setEditItemId(item.id)}
                  />
                ))}
              </ul>
              <div className="done-actions">
                <button
                  className="btn btn-ghost btn-small"
                  onClick={handleArchiveAll}
                >
                  Archive all to history
                </button>
              </div>
            </>
          )}
        </section>
      )}
      <LogPurchaseDialog
        item={logItem}
        onSave={async (patch) => {
          await updateItem(logItemId, patch);
          setLogItemId(null);
        }}
        onCancel={() => setLogItemId(null)}
      />
      <EditItemDialog
        item={editItem}
        onSave={async (patch) => {
          await updateItem(editItemId, patch);
          setEditItemId(null);
        }}
        onCancel={() => setEditItemId(null)}
      />
      {sharePicker && (
        <div className="confirm-backdrop" onClick={() => setSharePicker(false)}>
          <div className="confirm-pill share-picker" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-title">Share list as</div>
            <div className="share-picker-btns">
              <button className="btn btn-primary" onClick={() => doShare('en')}>
                English
              </button>
              <button className="btn btn-primary" onClick={() => doShare('ar')}>
                عربي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
