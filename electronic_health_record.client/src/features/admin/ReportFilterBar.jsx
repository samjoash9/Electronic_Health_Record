import Select from '../../components/ui/Select';
import {
  FILTER_TRIGGER,
  GRANULARITY_OPTIONS,
  MONTH_OPTIONS,
  recentYears,
  yearOptions,
} from './dashboardPeriod';
import { OFFICE_OPTIONS } from './dashboardOffice';

/**
 * The period (Day / Month / Year) and office pickers for a useReportFilter()
 * state, so the dashboard and the Health Reports page filter the same way.
 */
export default function ReportFilterBar({ filter }) {
  const {
    today,
    todayIso,
    granularity,
    setGranularity,
    year,
    setYear,
    month,
    setMonth,
    date,
    setDate,
    office,
    setOffice,
  } = filter;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        className="w-24"
        triggerClassName={FILTER_TRIGGER}
        options={GRANULARITY_OPTIONS}
        value={granularity}
        onChange={(e) => setGranularity(e.target.value)}
      />
      {granularity === 'day' && (
        <input
          type="date"
          aria-label="Date"
          value={date}
          max={todayIso}
          // A cleared picker sends ''; keep the last real date instead.
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="h-8 rounded-lg border border-line bg-surface px-2.5 text-xs text-ink-700"
        />
      )}
      {granularity === 'month' && (
        <Select
          className="w-32"
          triggerClassName={FILTER_TRIGGER}
          options={MONTH_OPTIONS}
          value={String(month)}
          onChange={(e) => setMonth(Number(e.target.value))}
        />
      )}
      {granularity !== 'day' && (
        <Select
          className="w-24"
          triggerClassName={FILTER_TRIGGER}
          options={yearOptions(recentYears(today.year), year)}
          value={String(year)}
          onChange={(e) => setYear(Number(e.target.value))}
        />
      )}
      <Select
        className="w-56"
        triggerClassName={FILTER_TRIGGER}
        options={OFFICE_OPTIONS}
        value={office}
        onChange={(e) => setOffice(e.target.value)}
      />
    </div>
  );
}

// Taller than the compact pickers above: each box carries its own caption
// above the value.
const FIELD_TRIGGER = 'h-12 px-3 text-sm font-medium';

/**
 * The same filter as captioned boxes, for the Health Reports page: a
 * Day / Month / Year toggle, then the period pickers side by side, then the
 * office on its own row. From md up they share one row.
 */
export function ReportFilterFields({ filter }) {
  const {
    today,
    todayIso,
    granularity,
    setGranularity,
    year,
    setYear,
    month,
    setMonth,
    date,
    setDate,
    office,
    setOffice,
  } = filter;

  // Day and Year leave one period picker, which takes both columns.
  const single = granularity !== 'month' ? 'col-span-2' : '';

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      <div
        role="radiogroup"
        aria-label="Report period"
        className="col-span-2 flex h-10 rounded-lg bg-slate-100 p-1 md:col-span-1 md:h-12"
      >
        {GRANULARITY_OPTIONS.map(({ value, label }) => {
          const active = value === granularity;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setGranularity(value)}
              className={`flex-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                active ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-brand-700'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {granularity === 'day' && (
        <label className={`${single} flex h-12 flex-col justify-center rounded-lg border border-line bg-surface px-3 focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-600/10`}>
          <span className="text-[11px] font-medium leading-tight text-ink-500">Date</span>
          <input
            type="date"
            value={date}
            max={todayIso}
            // A cleared picker sends ''; keep the last real date instead.
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-ink-900 outline-none"
          />
        </label>
      )}
      {granularity === 'month' && (
        <Select
          label="Month"
          matchWidth
          triggerClassName={FIELD_TRIGGER}
          options={MONTH_OPTIONS}
          value={String(month)}
          onChange={(e) => setMonth(Number(e.target.value))}
        />
      )}
      {granularity !== 'day' && (
        <Select
          label="Year"
          matchWidth
          className={single}
          triggerClassName={FIELD_TRIGGER}
          options={yearOptions(recentYears(today.year), year)}
          value={String(year)}
          onChange={(e) => setYear(Number(e.target.value))}
        />
      )}
      <Select
        label="Office"
        matchWidth
        className="col-span-2 md:col-span-1"
        triggerClassName={FIELD_TRIGGER}
        options={OFFICE_OPTIONS}
        value={office}
        onChange={(e) => setOffice(e.target.value)}
      />
    </div>
  );
}
