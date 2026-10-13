const PRIMARY = 'bg-brand-600 text-white shadow-md hover:bg-brand-700 hover:shadow-lg disabled:bg-gray-300';

const VARIANTS = {
  primary: PRIMARY,
  secondary: 'border border-line bg-surface text-ink-700 hover:bg-gray-50',
  // A disabled ghost button keeps no background to grey out, so it dims and
  // drops its hover instead -- otherwise it still reads as clickable.
  ghost: 'text-ink-700 hover:bg-gray-100 disabled:text-ink-300 disabled:opacity-60 disabled:hover:bg-transparent',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-gray-300',
  // Alias of primary: teal and primary once rendered as two different greens,
  // so main actions looked different from page to page.
  teal: PRIMARY,
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
