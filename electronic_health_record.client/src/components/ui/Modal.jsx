import { useEffect } from 'react';

const SIZES = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ open, title, onClose, children, footer, size = 'md' }) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${SIZES[size] ?? SIZES.md} rounded-2xl bg-surface shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <header className={`border-b border-line px-6 ${size === 'md' ? 'py-4' : 'py-5'}`}>
            <h2 className={`font-semibold text-ink-900 ${size === 'md' ? 'text-base' : 'text-lg'}`}>{title}</h2>
          </header>
        )}
        <div
          className={`flex px-6 text-ink-700 ${size === 'md' ? 'py-5 text-sm' : 'min-h-36 items-center py-6 text-base'}`}
        >
          <div className="w-full">{children}</div>
        </div>
        {footer && (
          <footer className="flex justify-end gap-2 border-t border-line bg-gray-50/60 px-6 py-4 rounded-b-2xl">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
