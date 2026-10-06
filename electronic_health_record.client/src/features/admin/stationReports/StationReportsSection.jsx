import { useState } from 'react';
import Select from '../../../components/ui/Select';
import {
  FILTER_TRIGGER,
  GRANULARITY_OPTIONS,
  MONTH_OPTIONS,
  isoDate,
  manilaToday,
  periodRange,
  recentYears,
  yearOptions,
} from '../dashboardPeriod';
import { ALL_OFFICES, OFFICE_OPTIONS, officeParams } from '../dashboardOffice';
import Station1Report from './Station1Report';
import Station2Report from './Station2Report';
import Station3Report from './Station3Report';
import Station4Report from './Station4Report';
import Station5Report from './Station5Report';
import Station6Report from './Station6Report';

/**
 * The dashboard's six station report cards under one period + office
 * filter. Each card fetches its own report, so one slow or failing station
 * never blanks the others.
 */
export default function StationReportsSection() {
  const [today] = useState(manilaToday);
  const todayIso = isoDate(today.year, today.month, today.day);

  const [granularity, setGranularity] = useState('month');
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  const [date, setDate] = useState(todayIso);
  const [office, setOffice] = useState(ALL_OFFICES);

  const params = { ...periodRange(granularity, { year, month, date }), ...officeParams(office) };

  return (
    <section aria-label="Station reports" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink-900">Station Reports</h2>

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
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Station1Report params={params} />
        <Station2Report params={params} />
        <Station3Report params={params} />
        <Station4Report params={params} />
        <Station5Report params={params} />
        <Station6Report params={params} />
      </div>
    </section>
  );
}
