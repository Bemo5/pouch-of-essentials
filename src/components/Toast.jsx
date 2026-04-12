import { useEffect, useRef } from 'react';

// Single-slot toast. Showing a new one replaces the current; the caller is
// responsible for cleaning up any state tied to the outgoing toast.
export default function Toast({ toast, onClose }) {
  const timerRef = useRef(null);
  // onClose is typically defined inline in the parent (`() => setToast(null)`),
  // so its identity changes on every parent render. Stashing it in a ref
  // keeps the timer effect from re-running and resetting the timer every
  // time the parent re-renders (which happens often during sync polls).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!toast) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onCloseRef.current?.();
    }, toast.duration || 5000);
    return () => clearTimeout(timerRef.current);
  }, [toast]);

  if (!toast) return null;

  const handleUndo = () => {
    clearTimeout(timerRef.current);
    try {
      toast.onUndo?.();
    } finally {
      onClose?.();
    }
  };

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-message">{toast.message}</span>
      {toast.onUndo && (
        <button className="toast-action" onClick={handleUndo}>
          Undo
        </button>
      )}
    </div>
  );
}
