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
