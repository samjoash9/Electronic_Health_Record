/**
 * A single dashboard metric: a soft slate-blue icon chip, the label, and the
 * figure.
 *
 * The tiles deliberately share one cool palette instead of colour-coding each
 * metric: the numbers are what should stand out, and five competing accents
 * made the row read as five unrelated widgets. `accent` is still accepted so
 * callers need not change, and only shifts the icon chip's tint.
 */
const ACCENTS = {
  brand: 'bg-[#37AF9B]/15 text-[#0A594D]',
  destructive: 'bg-red-500/15 text-red-600',
  red: 'bg-red-500/15 text-red-600',
  warning: 'bg-amber-500/15 text-amber-600',
  amber: 'bg-amber-500/15 text-amber-600',
  softGreen: 'bg-emerald-500/15 text-emerald-600',
  emerald: 'bg-emerald-500/15 text-emerald-600',
  indigo: 'bg-[#eef2fb] text-[#5b7bb5]',
  sky: 'bg-[#eef4fb] text-[#5b8ab5]',
  rose: 'bg-red-500/15 text-red-600',
  violet: 'bg-[#f0f0fa] text-[#7076b3]',
  teal: 'bg-[#37AF9B]/15 text-[#0A594D]',
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'brand',
  iconWrapperClass = '',
  className = '',
}) {
  const iconWrapper = iconWrapperClass || ACCENTS[accent] || 'bg-[#37AF9B]/15 text-[#0A594D]';

  return (
    <div className={`flex items-center gap-3.5 rounded-2xl border border-[#eef0f4] bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-md transition-shadow duration-200 ${className}`}>
      {Icon && (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconWrapper}`}>
          <Icon size={19} strokeWidth={1.75} />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-[13px] font-normal text-[#7c8698]">{label}</p>
        <p className="mt-0.5 text-[26px] font-semibold leading-tight tabular-nums text-[#1e293b]">
          {value}
        </p>
      </div>
    </div>
  );
}
