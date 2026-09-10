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
  indigo: 'bg-[#eef2fb] text-[#5b7bb5]',
  sky: 'bg-[#eef4fb] text-[#5b8ab5]',
  amber: 'bg-[#eef2fb] text-[#6a7fb0]',
  emerald: 'bg-[#eef4f9] text-[#5f8ba8]',
  rose: 'bg-[#f1f1f7] text-[#7a7fa8]',
  violet: 'bg-[#f0f0fa] text-[#7076b3]',
  teal: 'bg-[#edf5f8] text-[#5a8ca3]',
};

export default function StatCard({ label, value, icon: Icon, accent = 'indigo' }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-[#eef0f4] bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:border-[#e2e6ee] hover:shadow-[0_2px_8px_rgba(16,24,40,0.06)]">
      {Icon && (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${ACCENTS[accent] ?? ACCENTS.indigo}`}>
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
