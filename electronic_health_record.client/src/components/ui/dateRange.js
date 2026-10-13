// Calendar math for DateRangePicker. Every date is a yyyy-MM-dd string and
// all arithmetic runs in UTC, so a range never shifts by a day with the
// browser's timezone or a DST change.

export const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 days' },
  { key: 'last30', label: 'Last 30 days' },
  { key: 'thisMonth', label: 'This month' },
  { key: 'lastMonth', label: 'Last month' },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const pad2 = (n) => String(n).padStart(2, '0');

const toUtc = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

const fromUtc = (ms) => {
  const date = new Date(ms);
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
};

export const addDays = (iso, n) => fromUtc(toUtc(iso) + n * DAY_MS);

/** `month` is 1-based on both sides. */
export function addMonths({ year, month }, delta) {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export const viewOf = (iso) => {
  const [year, month] = iso.split('-').map(Number);
  return { year, month };
};

const firstOfMonth = ({ year, month }) => `${year}-${pad2(month)}-01`;
const lastOfMonth = (view) => addDays(firstOfMonth(addMonths(view, 1)), -1);

/** Inclusive { from, to } for a preset key, relative to `today`. */
export function presetRange(key, today) {
  switch (key) {
    case 'today':
      return { from: today, to: today };
    case 'yesterday': {
      const day = addDays(today, -1);
      return { from: day, to: day };
    }
    case 'last7':
      return { from: addDays(today, -6), to: today };
    case 'last30':
      return { from: addDays(today, -29), to: today };
    case 'thisMonth':
      return { from: firstOfMonth(viewOf(today)), to: today };
    case 'lastMonth': {
      const prev = addMonths(viewOf(today), -1);
      return { from: firstOfMonth(prev), to: lastOfMonth(prev) };
    }
    default:
      throw new Error(`Unknown date range preset: ${key}`);
  }
}

/** Six Sunday-first weeks covering the month, as 42 yyyy-MM-dd strings. */
export function monthGrid(year, month) {
  const first = firstOfMonth({ year, month });
  const offset = new Date(toUtc(first)).getUTCDay();
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export const normalizeRange = (a, b) => (a <= b ? { from: a, to: b } : { from: b, to: a });

/** Days in the range, counting both ends. */
export const dayCount = (from, to) => Math.round((toUtc(to) - toUtc(from)) / DAY_MS) + 1;

const formatDay = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
};

export const formatRange = (from, to) =>
  from === to ? formatDay(from) : `${formatDay(from)} – ${formatDay(to)}`;
