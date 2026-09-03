import { forwardRef } from 'react';

const Select = forwardRef(function Select({ error, options = [], className = '', ...props }, ref) {
  return (
    <select
      ref={ref}
      className={`h-8 rounded border px-2 text-sm outline-none transition
        ${error ? 'border-rose-400 focus:border-rose-500' : 'border-line focus:border-brand-500'}
        bg-surface disabled:bg-gray-100 disabled:text-ink-500 ${className}`}
      {...props}
    >
      <option value="">Select…</option>
      {options.map((option) => {
        const value = typeof option === 'string' ? option : option.value;
        const label = typeof option === 'string' ? option : option.label;
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
});

export default Select;
