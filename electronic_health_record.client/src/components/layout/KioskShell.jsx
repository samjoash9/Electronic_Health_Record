import { useEffect } from 'react';

export default function KioskShell({ title, subtitle, progress, children, footer }) {
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
      <header className="sticky top-0 z-10 border-b border-line bg-surface px-6 py-4">
        <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
        {progress && (
          <p className="mt-2 text-sm font-medium text-brand-600" role="status">
            {progress}
          </p>
        )}
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
      {footer && (
        <footer className="sticky bottom-0 border-t border-line bg-surface px-6 py-4">
          {footer}
        </footer>
      )}
    </div>
  );
}
