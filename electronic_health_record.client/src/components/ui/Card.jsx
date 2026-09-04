export default function Card({ title, actions, children, className = '' }) {
  return (
    <section className={`m-5 rounded-xl border border-line bg-surface shadow-sm ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
          {title && <h2 className="text-sm font-semibold tracking-wide text-ink-900">{title}</h2>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
