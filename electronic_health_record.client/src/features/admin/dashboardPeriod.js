// Period-filter pieces shared by the dashboard's Day / Month / Year charts.

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const GRANULARITY_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

export const MONTH_OPTIONS = MONTH_NAMES.map((name, i) => ({ value: String(i + 1), label: name }));

// px-2.5 rather than Select's default px-3: these triggers are narrow, and
// the extra padding is what truncated "Month" and "2026" to an ellipsis.
export const FILTER_TRIGGER = 'h-8 px-2.5 text-xs';

export const shortMonth = (month) => MONTH_NAMES[month - 1].slice(0, 3);

export const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

// The clinic's calendar, not the browser's: the server buckets on Manila
// time, so "today" and "this month" have to be Manila's too.
export function manilaToday() {
  const manila = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return {
    year: manila.getUTCFullYear(),
    month: manila.getUTCMonth() + 1,
    day: manila.getUTCDate(),
  };
}

/**
 * Year dropdown options, newest first: the years the server says can have
 * data, plus the selected year if it is not among them (so the trigger never
 * shows a value its own list lacks).
 */
export function yearOptions(years, selected) {
  const list = years?.length ? [...years] : [selected];
  if (!list.includes(selected)) list.push(selected);
  return list
    .sort((a, b) => b - a)
    .map((y) => ({ value: String(y), label: String(y) }));
}

const pad2 = (n) => String(n).padStart(2, '0');

/** yyyy-MM-dd for a calendar date, the format the report endpoints take. */
export const isoDate = (year, month, day) => `${year}-${pad2(month)}-${pad2(day)}`;

/**
 * Inclusive { from, to } for the station reports' filter: one day, one
 * month, or one calendar year. `date` is already yyyy-MM-dd for Day.
 */
export function periodRange(granularity, { year, month, date }) {
  if (granularity === 'day') return { from: date, to: date };
  if (granularity === 'month') {
    return { from: isoDate(year, month, 1), to: isoDate(year, month, daysInMonth(year, month)) };
  }
  return { from: isoDate(year, 1, 1), to: isoDate(year, 12, 31) };
}

/** The current year and the `count - 1` before it, newest first. */
export const recentYears = (currentYear, count = 5) =>
  Array.from({ length: count }, (_, i) => currentYear - i);
