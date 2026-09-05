import { forwardRef } from 'react';

const Textarea = forwardRef(function Textarea({ error, rows = 3, className = '', ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`rounded-lg border px-3 py-2 text-sm text-ink-900 outline-none transition
        ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' : 'border-line focus:border-[#129883] focus:ring-4 focus:ring-[#129883]/10'}
        bg-surface placeholder:text-ink-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-ink-500 ${className}`}
      {...props}
    />
  );
});

export default Textarea;
