import { forwardRef } from 'react';

const Input = forwardRef(function Input({ error, className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`h-8 rounded border px-2 text-sm outline-none transition
        ${error ? 'border-rose-400 focus:border-rose-500' : 'border-line focus:border-brand-500'}
        bg-surface disabled:bg-gray-100 disabled:text-ink-500 ${className}`}
      {...props}
    />
  );
});

export default Input;
