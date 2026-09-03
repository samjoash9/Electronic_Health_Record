import { forwardRef } from 'react';

const Checkbox = forwardRef(function Checkbox({ label, className = '', ...props }, ref) {
  return (
    <label className={`flex items-center gap-2 text-sm ${className}`}>
      <input ref={ref} type="checkbox" {...props} />
      {label && <span>{label}</span>}
    </label>
  );
});

export default Checkbox;
