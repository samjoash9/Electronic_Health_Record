const TONES = {
  info: 'bg-sky-100 text-sky-700',
  success: 'bg-emerald-100 text-emerald-700',
  warn: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
  default: 'bg-gray-100 text-gray-700',
};

export default function Badge({ tone = 'default', children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone] ?? TONES.default}`}>
      {children}
    </span>
  );
}
