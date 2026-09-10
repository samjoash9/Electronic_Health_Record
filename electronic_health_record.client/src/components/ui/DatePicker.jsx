import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseIso(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDisplay(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function buildGrid(viewYear, viewMonth) {
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(viewYear, viewMonth, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + i);
    return cellDate;
  });
}

const YEAR_PAGE_SIZE = 12;

function buildYearPage(centerYear) {
  const start = centerYear - (centerYear % YEAR_PAGE_SIZE);
  return Array.from({ length: YEAR_PAGE_SIZE }, (_, i) => start + i);
}

const DatePicker = forwardRef(function DatePicker(
  { error, className = '', value, defaultValue, onChange, onBlur, name, id, disabled, max, min, ...props },
  ref
) {
  const nativeRef = useRef(null);
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pickerView, setPickerView] = useState('days');
  const [isoValue, setIsoValue] = useState(value ?? defaultValue ?? '');

  useEffect(() => {
    if (value !== undefined) setIsoValue(value);
  }, [value]);

  const selectedDate = useMemo(() => parseIso(isoValue), [isoValue]);
  const [view, setView] = useState(() => selectedDate ?? new Date());

  useEffect(() => {
    if (selectedDate) setView(selectedDate);
  }, [isoValue]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const maxDate = max ? parseIso(max) : null;
  const minDate = min ? parseIso(min) : null;

  function commit(date) {
    const iso = toIso(date);
    setIsoValue(iso);
    setOpen(false);
    if (nativeRef.current) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(nativeRef.current, iso);
      nativeRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
    onChange?.({ target: { name, value: iso } });
  }

  const grid = buildGrid(view.getFullYear(), view.getMonth());

  return (
    <div ref={rootRef} className="relative">
      <input
        ref={(node) => {
          nativeRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        type="date"
        name={name}
        id={id}
        defaultValue={defaultValue}
        value={value}
        onChange={(e) => setIsoValue(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        max={max}
        min={min}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        {...props}
      />

      <button
        type="button"
        id={id ? `${id}-trigger` : undefined}
        disabled={disabled}
        onClick={() => {
          setOpen((v) => !v);
          setPickerView('days');
        }}
        onBlur={onBlur}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-surface px-3 text-left text-sm outline-none transition
          ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' : 'border-line focus:border-[#129883] focus:ring-4 focus:ring-[#129883]/10'}
          disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-ink-500 ${className}`}
      >
        <span className={selectedDate ? 'text-ink-900' : 'text-ink-400'}>
          {selectedDate ? formatDisplay(selectedDate) : 'mm/dd/yyyy'}
        </span>
        <Calendar size={16} className="shrink-0 text-ink-500" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-96 rounded-xl border border-line bg-surface p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                pickerView === 'years'
                  ? setView(new Date(view.getFullYear() - YEAR_PAGE_SIZE, view.getMonth(), 1))
                  : setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
              }
              className="flex h-9 w-9 items-center justify-center rounded-md text-ink-500 transition hover:bg-[#f3fdfb] hover:text-[#0e7d6b]"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => setPickerView((v) => (v === 'years' ? 'days' : 'years'))}
              className="rounded-md px-3 py-1 text-base font-semibold text-ink-900 transition hover:bg-[#f3fdfb] hover:text-[#0e7d6b]"
            >
              {pickerView === 'years'
                ? `${buildYearPage(view.getFullYear())[0]} – ${buildYearPage(view.getFullYear())[YEAR_PAGE_SIZE - 1]}`
                : view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </button>
            <button
              type="button"
              onClick={() =>
                pickerView === 'years'
                  ? setView(new Date(view.getFullYear() + YEAR_PAGE_SIZE, view.getMonth(), 1))
                  : setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))
              }
              className="flex h-9 w-9 items-center justify-center rounded-md text-ink-500 transition hover:bg-[#f3fdfb] hover:text-[#0e7d6b]"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {pickerView === 'years' ? (
            <div className="grid grid-cols-3 gap-2">
              {buildYearPage(view.getFullYear()).map((year) => {
                const isSelected = selectedDate && selectedDate.getFullYear() === year;
                const isThisYear = new Date().getFullYear() === year;
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      setView(new Date(year, view.getMonth(), 1));
                      setPickerView('days');
                    }}
                    className={`rounded-md py-2.5 text-base transition
                      ${isSelected ? 'bg-[#129883] font-semibold text-white' : 'text-ink-700 hover:bg-[#f3fdfb]'}
                      ${isThisYear && !isSelected ? 'font-semibold text-[#0e7d6b] ring-1 ring-inset ring-[#129883]/40' : ''}`}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-y-2 text-center">
              {WEEKDAYS.map((wd) => (
                <span key={wd} className="text-xs font-semibold text-ink-500">
                  {wd}
                </span>
              ))}
              {grid.map((cellDate) => {
                const inMonth = cellDate.getMonth() === view.getMonth();
                const isSelected = selectedDate && toIso(cellDate) === toIso(selectedDate);
                const isToday = toIso(cellDate) === toIso(new Date());
                const isDisabled = (maxDate && cellDate > maxDate) || (minDate && cellDate < minDate);
                return (
                  <button
                    key={cellDate.toISOString()}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => commit(cellDate)}
                    className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full text-base transition
                      ${!inMonth ? 'text-ink-300' : 'text-ink-700'}
                      ${isSelected ? 'bg-[#129883] font-semibold text-white' : 'hover:bg-[#f3fdfb]'}
                      ${isToday && !isSelected ? 'font-semibold text-[#0e7d6b] ring-1 ring-inset ring-[#129883]/40' : ''}
                      ${isDisabled ? 'cursor-not-allowed text-ink-200 hover:bg-transparent' : ''}`}
                  >
                    {cellDate.getDate()}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <button
              type="button"
              onClick={() => {
                setIsoValue('');
                if (nativeRef.current) {
                  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                  setter.call(nativeRef.current, '');
                  nativeRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                }
                onChange?.({ target: { name, value: '' } });
                setOpen(false);
              }}
              className="text-xs font-medium text-ink-500 transition hover:text-ink-900"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => commit(new Date())}
              className="text-xs font-medium text-[#129883] transition hover:text-[#0e7d6b]"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default DatePicker;
