const TONES = {
  info: 'bg-sky-100 text-sky-700',
  success: 'bg-emerald-100 text-emerald-700',
  warn: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
  default: 'bg-gray-100 text-gray-700',
};

const DOTS = {
  info: 'bg-sky-500',
  success: 'bg-emerald-500',
  warn: 'bg-amber-500',
  danger: 'bg-rose-500',
  default: 'bg-gray-400',
};

/** `dot` prefixes a status pill with a filled marker, for denser status columns. */
export default function Badge({ tone = 'default', dot = false, children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone] ?? TONES.default}`}>
      {dot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOTS[tone] ?? DOTS.default}`} />}
      {children}
    </span>
  );
}
