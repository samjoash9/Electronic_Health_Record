import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

/**
 * A Select whose option list filters as you type — for lists too long to scan,
 * where plain Select's scroll-and-hunt stops working (the registered-doctor
 * list, say).
 *
 * Options are `{ value, label, hint? }`; `hint` renders as a dimmer second line
 * (a PRC licence number under a name) and is searched alongside the label.
 * Controlled only: pass `value` and handle `onChange(nextValue)`.
 */
export default function SearchSelect({
  options = [], value, onChange, placeholder = 'Select…',
  searchPlaceholder = 'Type to search…', empty = 'No matches.',
  disabled = false, error = false, id, className = '',
}) {
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  // Which option the arrow keys are sitting on, as an index into `filtered`.
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = options.find((o) => String(o.value) === String(value));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.hint ?? ''}`.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Opening starts from a clean search with the highlight on the current
  // selection, so reopening never shows a stale filter. Done in the handler
  // rather than an effect: the reset belongs to the act of opening.
  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setQuery('');
    const index = options.findIndex((o) => String(o.value) === String(value));
    setActiveIndex(index === -1 ? 0 : index);
    setOpen(true);
  };

  // Focus follows the list appearing, which is a DOM effect, not state.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const commit = (option) => {
    onChange?.(option.value);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!filtered.length) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((i) => (i + step + filtered.length) % filtered.length);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const option = filtered[activeIndex];
      if (option) commit(option);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-surface px-3 text-left text-sm outline-none transition
          ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' : 'border-line focus:border-[#129883] focus:ring-4 focus:ring-[#129883]/10'}
          disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-ink-500`}
      >
        <span className={`truncate ${selected ? 'text-ink-900' : 'text-ink-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-ink-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-full min-w-max overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
          <div className="relative border-b border-line">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              autoComplete="off"
              aria-label={searchPlaceholder}
              className="h-10 w-full bg-transparent pl-9 pr-3 text-sm outline-none placeholder:text-ink-400"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-ink-500">{empty}</p>
          ) : (
            <ul role="listbox" className="max-h-64 overflow-auto p-1.5 text-sm">
              {filtered.map((option, i) => {
                const isSelected = String(option.value) === String(value);
                const isActive = i === activeIndex;
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => commit(option)}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors
                      ${isSelected
                    ? 'bg-[#129883] font-semibold text-white'
                    : isActive ? 'bg-[#cdf2e8] text-[#0e7d6b]' : 'text-ink-700'}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{option.label}</span>
                      {option.hint && (
                        <span
                          className={`block truncate text-[11px] ${
                            isSelected ? 'text-white/80' : 'text-ink-500'
                          }`}
                        >
                          {option.hint}
                        </span>
                      )}
                    </span>
                    {isSelected && <Check size={15} className="shrink-0 text-white" />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
