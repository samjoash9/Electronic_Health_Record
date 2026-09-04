import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

function normalizeOptions(options) {
  return options.map((option) =>
    typeof option === 'string' ? { value: option, label: option } : option
  );
}

const Select = forwardRef(function Select(
  { error, options = [], className = '', value, defaultValue, onChange, onBlur, name, id, disabled, ...props },
  ref
) {
  const normalized = useMemo(() => normalizeOptions(options), [options]);
  const nativeRef = useRef(null);
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? '');

  useEffect(() => {
    if (value !== undefined) setInternalValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = normalized.find((o) => String(o.value) === String(internalValue));

  function commit(nextValue) {
    setInternalValue(nextValue);
    setOpen(false);
    if (nativeRef.current) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(nativeRef.current, nextValue);
      nativeRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
    onChange?.({ target: { name, value: nextValue } });
  }

  return (
    <div ref={rootRef} className="relative">
      <select
        ref={(node) => {
          nativeRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        name={name}
        id={id}
        defaultValue={defaultValue}
        value={value}
        onChange={(e) => setInternalValue(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        {...props}
      >
        <option value="">Select…</option>
        {normalized.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        id={id ? `${id}-trigger` : undefined}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onBlur={onBlur}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-surface px-3 text-left text-sm outline-none transition
          ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' : 'border-line focus:border-[#129883] focus:ring-4 focus:ring-[#129883]/10'}
          disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-ink-500 ${className}`}
      >
        <span className={selected ? 'text-ink-900' : 'text-ink-400'}>
          {selected ? selected.label : 'Select…'}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-ink-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-line bg-surface p-1.5 text-sm shadow-xl"
        >
          {normalized.map((option) => {
            const isSelected = String(option.value) === String(internalValue);
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => commit(option.value)}
                className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors
                  ${isSelected ? 'bg-[#129883] font-semibold text-white' : 'text-ink-700 hover:bg-[#cdf2e8] hover:text-[#0e7d6b]'}`}
              >
                {option.label}
                {isSelected && <Check size={15} className="text-white" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

export default Select;
