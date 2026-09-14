/**
 * `dividedHeader={false}` drops the rule under the title, for a card whose
 * content already carries its own top border (a bordered table, say) and would
 * otherwise show two lines stacked.
 */
export default function Card({
  title, actions, children, className = '', flush = false, dividedHeader = true,
}) {
  return (
    <section className={`${flush ? '' : 'm-5'} rounded-xl border border-line bg-surface shadow-sm ${className}`}>
      {(title || actions) && (
        <header
          className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3.5 ${
            dividedHeader ? 'border-b border-line' : ''
          }`}
        >
          {title && <h2 className="shrink-0 text-sm font-semibold tracking-wide whitespace-nowrap text-ink-900">{title}</h2>}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={`px-5 pb-5 ${dividedHeader ? 'pt-5' : 'pt-1'}`}>{children}</div>
    </section>
  );
}
