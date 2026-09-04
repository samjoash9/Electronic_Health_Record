import { useEffect } from 'react';

export default function KioskShell({ title, subtitle, progress, children, footer, headerActions }) {
  useEffect(() => {
    // Trap back navigation: re-push our entry whenever the user pops off it.
    window.history.pushState(null, '', window.location.href);
    const onPopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col overflow-y-auto bg-canvas">
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-surface px-6 py-4 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
          {progress && (
            <p className="mt-2 text-sm font-semibold text-[#0e7d6b]" role="status">
              {progress}
            </p>
          )}
        </div>
        {headerActions && <div className="flex shrink-0 items-center gap-2">{headerActions}</div>}
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
      {footer && (
        <footer className="sticky bottom-0 border-t border-line bg-surface px-6 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
          {footer}
        </footer>
      )}
    </div>
  );
}
