/**
 * Labelled sub-panel inside a section: an icon rail names the group, the fields
 * sit in a column beside it, so a group with one field reads the same as one
 * with three.
 */
export function SubPanel({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="rounded-xl border border-line bg-surface/60 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[13rem_1fr] sm:gap-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e9fbf6] text-[#0e7d6b] ring-1 ring-[#0e7d6b]/10"
          >
            <Icon size={20} strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
            <p className="text-xs text-ink-500">{subtitle}</p>
          </div>
        </div>
        <div className="min-w-0 sm:border-l sm:border-line sm:pl-6">{children}</div>
      </div>
    </section>
  );
}

/**
 * Consultation section shell: a numbered header with a decorative pulse line,
 * shared by every Station 3 section so their titles line up exactly.
 *
 * `flush` drops the body padding for sections that manage their own (a table
 * bleeding to the card edge, for instance).
 */
export default function SectionCard({
  step, title, subtitle, icon: Icon, actions, children, flush = false,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <header className="relative overflow-hidden border-b border-line bg-linear-to-r from-[#f3fdfb] to-surface px-5 py-4">
        <svg
          aria-hidden
          viewBox="0 0 600 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-y-0 right-0 h-full w-2/3 text-[#0e7d6b]/10"
        >
          <path d="M0 70 C 120 70 160 18 280 18 S 440 62 600 30" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M0 88 C 140 88 190 40 300 40 S 470 82 600 52" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        <div className="relative flex items-center gap-3.5">
          {/* The closing certification carries no step number, so the badge
              falls back to the section's own icon. */}
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d9f7ee] text-base font-bold text-[#0e7d6b] ring-1 ring-[#0e7d6b]/15"
          >
            {step ?? (Icon ? <Icon size={19} strokeWidth={2} /> : null)}
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink-900">{title}</h2>
            {subtitle && <p className="text-xs text-ink-500">{subtitle}</p>}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            {actions}
            {Icon && step != null && (
              <Icon aria-hidden size={22} className="hidden text-[#0e7d6b]/30 sm:block" />
            )}
          </div>
        </div>
      </header>

      <div className={flush ? '' : 'p-4 sm:p-5'}>{children}</div>
    </section>
  );
}
