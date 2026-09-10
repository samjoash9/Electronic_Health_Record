import { forwardRef } from 'react';

const Input = forwardRef(function Input({ error, className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`h-10 rounded-lg border px-3 text-sm text-ink-900 outline-none transition
        ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' : 'border-line focus:border-[#129883] focus:ring-4 focus:ring-[#129883]/10'}
        bg-surface placeholder:text-ink-400 disabled:bg-gray-50 disabled:text-ink-500 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  );
});

export default Input;
