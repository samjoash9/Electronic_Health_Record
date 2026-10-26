/**
 * A single dashboard metric: a soft slate-blue icon chip, the label, and the
 * figure.
 *
 * The tiles deliberately share one cool palette instead of colour-coding each
 * metric: the numbers are what should stand out, and five competing accents
 * made the row read as five unrelated widgets. `accent` is still accepted so
 * callers need not change, and only shifts the icon chip's tint (plus, on a
 * phone, the short underline bar beneath the figure).
 *
 * Below md (768px) the tile stacks icon, label, figure and bar vertically so
 * two fit side by side on a phone; from md up it is the original single row.
 */
const ACCENTS = {
  brand: { chip: 'bg-[#37AF9B]/15 text-[#0A594D]', bar: 'bg-[#37AF9B]' },
  destructive: { chip: 'bg-red-500/15 text-red-600', bar: 'bg-red-500' },
  red: { chip: 'bg-red-500/15 text-red-600', bar: 'bg-red-500' },
  warning: { chip: 'bg-amber-500/15 text-amber-600', bar: 'bg-amber-500' },
  amber: { chip: 'bg-amber-500/15 text-amber-600', bar: 'bg-amber-500' },
  softGreen: { chip: 'bg-emerald-500/15 text-emerald-600', bar: 'bg-emerald-500' },
  emerald: { chip: 'bg-emerald-500/15 text-emerald-600', bar: 'bg-emerald-500' },
  blue: { chip: 'bg-blue-500/15 text-blue-600', bar: 'bg-blue-500' },
  indigo: { chip: 'bg-[#eef2fb] text-[#5b7bb5]', bar: 'bg-[#5b7bb5]' },
  sky: { chip: 'bg-[#eef4fb] text-[#5b8ab5]', bar: 'bg-[#5b8ab5]' },
  rose: { chip: 'bg-red-500/15 text-red-600', bar: 'bg-red-500' },
  violet: { chip: 'bg-[#f0f0fa] text-[#7076b3]', bar: 'bg-[#7076b3]' },
  teal: { chip: 'bg-[#37AF9B]/15 text-[#0A594D]', bar: 'bg-[#37AF9B]' },
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'brand',
  iconWrapperClass = '',
  className = '',
}) {
  const tone = ACCENTS[accent] ?? ACCENTS.brand;
  const iconWrapper = iconWrapperClass || tone.chip;

  return (
    // Grid rows stretch every tile to the tallest one; flex-1 on the text
    // column plus mt-auto on the figure keeps figures and bars level across a
    // row on a phone even when one label wraps to two lines.
    <div className={`flex flex-col items-start gap-3 rounded-2xl border border-[#eef0f4] bg-surface p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-md transition-shadow duration-200 md:flex-row md:items-center md:gap-3.5 md:px-5 md:py-4 ${className}`}>
      {Icon && (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconWrapper}`}>
          <Icon size={19} strokeWidth={1.75} />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-[13px] font-normal text-[#7c8698] md:truncate">{label}</p>
        <p className="mt-auto text-[26px] font-semibold leading-tight tabular-nums text-[#1e293b]">
          {value}
        </p>
        <span aria-hidden="true" className={`mt-1.5 h-0.5 w-9 rounded-full md:hidden ${tone.bar}`} />
      </div>
    </div>
  );
}
