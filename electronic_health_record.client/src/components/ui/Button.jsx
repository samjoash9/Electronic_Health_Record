const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-gray-300',
  secondary: 'border border-line bg-surface text-ink-700 hover:bg-gray-50',
  ghost: 'text-ink-700 hover:bg-gray-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-gray-300',
};

export default function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex h-8 items-center justify-center rounded px-3 text-sm font-medium transition disabled:cursor-not-allowed ${VARIANTS[variant] ?? VARIANTS.primary} ${className}`}
      {...props}
    />
  );
}
