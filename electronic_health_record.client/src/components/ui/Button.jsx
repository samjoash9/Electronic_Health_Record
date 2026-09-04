const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-gray-300',
  secondary: 'border border-line bg-surface text-ink-700 hover:bg-gray-50',
  ghost: 'text-ink-700 hover:bg-gray-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-gray-300',
  teal: 'bg-[#129883] text-white hover:bg-[#0e7d6b] disabled:bg-gray-300 shadow-md hover:shadow-lg',
};

const SIZES = {
  sm: 'h-8 rounded px-3 text-sm',
  md: 'h-10 rounded-lg px-4 text-sm',
  lg: 'h-12 rounded-xl px-6 text-base',
};

export default function Button({ variant = 'primary', size = 'sm', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium transition disabled:cursor-not-allowed ${SIZES[size] ?? SIZES.sm} ${VARIANTS[variant] ?? VARIANTS.primary} ${className}`}
      {...props}
    />
  );
}
