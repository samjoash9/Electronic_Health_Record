import { forwardRef } from 'react';

const Textarea = forwardRef(function Textarea({ error, rows = 3, className = '', ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`rounded border px-2 py-1.5 text-sm outline-none transition
        ${error ? 'border-rose-400 focus:border-rose-500' : 'border-line focus:border-brand-500'}
        bg-surface disabled:bg-gray-100 disabled:text-ink-500 ${className}`}
      {...props}
    />
  );
});

export default Textarea;
