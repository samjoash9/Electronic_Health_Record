import { useEffect, useRef, useState } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Button from './Button';
import {
  PRESETS,
  addMonths,
  dayCount,
  formatRange,
  monthGrid,
  normalizeRange,
  presetRange,
  viewOf,
} from './dateRange';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Labels come from the yyyy-MM-dd string pinned to UTC, so the browser's
// timezone can never print the neighbouring day.
const utcDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const dayLabel = (iso) =>
  utcDate(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const monthLabel = ({ year, month }) =>
  new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Where `iso` sits in `range`: 'single', 'start', 'end', 'middle' or undefined. */
function rangePosition(iso, range) {
  if (!range) return undefined;
  if (range.from === range.to) return iso === range.from ? 'single' : undefined;
  if (iso === range.from) return 'start';
  if (iso === range.to) return 'end';
  if (iso > range.from && iso < range.to) return 'middle';
  return undefined;
}

// The light band behind a range. Endpoints only fill the half facing the
// rest of the range, and the band breaks into rounded ends at row edges so
// each week reads as its own pill.
function bandClass(position, column) {
  if (position === 'middle') {
    return `bg-brand-50 ${column === 0 ? 'rounded-l-full' : ''} ${column === 6 ? 'rounded-r-full' : ''}`;
  }
  if (position === 'start' && column !== 6) return 'bg-linear-to-r from-transparent from-50% to-brand-50 to-50%';
  if (position === 'end' && column !== 0) return 'bg-linear-to-l from-transparent from-50% to-brand-50 to-50%';
  return '';
}

// `tentative` is the hovered end of a range still waiting on its second
// click: outlined, so it does not read as already chosen.
function dayClass({ position, tentative, inMonth, isToday }) {
  const isEndpoint = position === 'start' || position === 'end' || position === 'single';
  if (isEndpoint && tentative) return 'bg-surface font-semibold text-brand-700 ring-2 ring-inset ring-brand-600';
  if (isEndpoint) return 'bg-brand-600 font-semibold text-white';
  if (position === 'middle') return 'font-medium text-brand-700 hover:bg-brand-100';
  const tone = inMonth ? 'text-ink-700 hover:bg-gray-100' : 'text-ink-300 hover:bg-gray-50';
  return isToday ? `font-semibold text-brand-700 ring-1 ring-inset ring-brand-600/40 hover:bg-gray-100` : tone;
}

/**
 * A from/to date filter: preset ranges beside a one-month calendar. Picks are
 * a draft until Apply; Escape or a click outside throws the draft away.
 * `from`, `to` and `today` are yyyy-MM-dd ('' for an open range), and
 * onChange receives { from, to } in the same form.
 */
export default function DateRangePicker({ label, from, to, today, onChange, className = '' }) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  // `end` is '' while the second click is still to come.
  const [draft, setDraft] = useState({ start: '', end: '' });
  const [hovered, setHovered] = useState('');
  const [view, setView] = useState(() => viewOf(to || today));

  const hasValue = Boolean(from && to);

  useEffect(() => {
    if (!open) return undefined;
    function handleMouseDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setDraft({ start: from || '', end: to || '' });
    setHovered('');
    setView(viewOf(to || today));
    setOpen(true);
  }

  function pickDay(iso) {
    if (!draft.start || draft.end) {
      setDraft({ start: iso, end: '' });
      return;
    }
    const range = normalizeRange(draft.start, iso);
    setDraft({ start: range.from, end: range.to });
  }

  function pickPreset(key) {
    const range = presetRange(key, today);
    setDraft({ start: range.from, end: range.to });
    setView(viewOf(range.to));
  }

  function commit(range) {
    onChange(range);
    setOpen(false);
  }

  // What Apply would send, and what the footer counts.
  const selected = draft.start ? { from: draft.start, to: draft.end || draft.start } : null;
  // What the grid paints: the selection, stretched to the hovered day while
  // the second click is pending.
  const preview = draft.start && !draft.end && hovered ? normalizeRange(draft.start, hovered) : null;
  const painted = preview ?? selected;
  const activePreset = selected
    ? PRESETS.find(({ key }) => {
      const range = presetRange(key, today);
      return range.from === selected.from && range.to === selected.to;
    })?.key
    : undefined;

  const count = selected ? dayCount(selected.from, selected.to) : 0;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div
        className={`flex h-10 items-center rounded-lg border bg-surface transition
          ${open ? 'border-brand-600 ring-4 ring-brand-600/10' : 'border-line'}`}
      >
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={toggle}
          className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-lg pl-3 pr-2 text-left text-sm outline-none"
        >
          <CalendarRange size={15} className="shrink-0 text-ink-400" />
          <span className="sr-only">{label}: </span>
          <span className={`truncate tabular-nums ${hasValue ? 'text-ink-900' : 'text-ink-400'}`}>
            {hasValue ? formatRange(from, to) : 'mm/dd/yyyy – mm/dd/yyyy'}
          </span>
        </button>
        {hasValue && (
          <button
            type="button"
            onClick={() => commit({ from: '', to: '' })}
            aria-label={`Clear ${label.toLowerCase()}`}
            className="mr-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ink-400 hover:bg-gray-100 hover:text-ink-700"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute right-0 z-50 mt-2 flex w-[calc(100vw-2rem)] max-w-100 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl sm:w-auto sm:max-w-none sm:flex-row"
        >
          <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-line p-2 sm:w-40 sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0 sm:p-3">
            {PRESETS.map(({ key, label: presetLabel }) => {
              const isActive = key === activePreset;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => pickPreset(key)}
                  className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition
                    ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-gray-50 hover:text-ink-900'}`}
                >
                  {presetLabel}
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:w-100">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-base font-semibold text-ink-900">{monthLabel(view)}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setView((v) => addMonths(v, -1))}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-ink-500 transition hover:bg-gray-100 hover:text-ink-900"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => setView((v) => addMonths(v, 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-ink-500 transition hover:bg-gray-100 hover:text-ink-900"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-ink-400">
              {WEEKDAYS.map((wd) => (
                <span key={wd} className="py-1">{wd}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1" onMouseLeave={() => setHovered('')}>
              {monthGrid(view.year, view.month).map((iso, i) => {
                const position = rangePosition(iso, painted);
                return (
                  <div key={iso} className={bandClass(position, i % 7)}>
                    <button
                      type="button"
                      aria-label={dayLabel(iso)}
                      data-range={position}
                      onClick={() => pickDay(iso)}
                      onMouseEnter={() => setHovered(iso)}
                      className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm tabular-nums transition
                        ${dayClass({
                          position,
                          tentative: Boolean(preview) && iso === hovered && iso !== draft.start,
                          inMonth: viewOf(iso).month === view.month,
                          isToday: iso === today,
                        })}`}
                    >
                      {Number(iso.slice(8))}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
              <span className="text-sm text-ink-500">
                {count === 0 ? 'No dates selected' : `${count} ${count === 1 ? 'day' : 'days'} selected`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => commit({ from: '', to: '' })}
                  className="h-10 rounded-lg px-3 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 hover:text-brand-700"
                >
                  Clear
                </button>
                <Button type="button" size="md" disabled={!selected} onClick={() => commit(selected)}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
