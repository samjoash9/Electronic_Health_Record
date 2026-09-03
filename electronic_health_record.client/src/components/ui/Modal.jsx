import { useEffect } from 'react';

export default function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-lg bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <header className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
          </header>
        )}
        <div className="px-4 py-4 text-sm text-ink-700">{children}</div>
        {footer && (
          <footer className="flex justify-end gap-2 border-t border-line px-4 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
