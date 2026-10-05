/** The card every Health Reports panel sits in, styled like the dashboard's. */
export default function ReportCard({ eyebrow, title, aside, className = '', children }) {
  return (
    <section className={`flex min-w-0 flex-col rounded-xl border border-[#eef0f4] bg-white p-6 shadow-sm ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">{eyebrow}</p>
          {title && <p className="mt-0.5 text-sm font-medium text-ink-600">{title}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
