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
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* min-h-full centres short dialogs while letting tall ones scroll with
          the overlay; centring the dialog directly clips its header and footer
          off-screen once it outgrows the viewport. */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={`w-full ${SIZES[size] ?? SIZES.md} rounded-2xl bg-surface shadow-2xl`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <header className={`border-b border-line px-4 sm:px-6 ${size === 'md' ? 'py-4' : 'py-4 sm:py-5'}`}>
              <h2 className={`font-semibold text-ink-900 ${size === 'md' ? 'text-base' : 'text-base sm:text-lg'}`}>{title}</h2>
            </header>
          )}
          <div
            className={`flex px-4 text-ink-700 sm:px-6 ${size === 'md' ? 'py-5 text-sm' : 'min-h-36 items-center py-4 text-base sm:py-6'}`}
          >
            <div className="w-full">{children}</div>
          </div>
          {footer && (
            <footer className="flex justify-end gap-2 border-t border-line bg-gray-50/60 px-4 py-3 rounded-b-2xl sm:px-6 sm:py-4">
              {footer}
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
