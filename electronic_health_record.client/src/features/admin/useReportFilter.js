import { useState } from 'react';
import { isoDate, manilaToday, periodLabel, periodRange } from './dashboardPeriod';
import { ALL_OFFICES, officeParams } from './dashboardOffice';

/**
 * The reports' period + office filter, shared by the dashboard's station
 * cards and the Health Reports page. Opens on the current Manila month for
 * every office. `params` is what the report endpoints take; `label` says
 * the same in words, e.g. "All offices · October 2026".
 */
export function useReportFilter() {
  const [today] = useState(manilaToday);
  const todayIso = isoDate(today.year, today.month, today.day);

  const [granularity, setGranularity] = useState('month');
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  const [date, setDate] = useState(todayIso);
  const [office, setOffice] = useState(ALL_OFFICES);

  const period = { year, month, date };
  const params = { ...periodRange(granularity, period), ...officeParams(office) };
  const label = `${office === ALL_OFFICES ? 'All offices' : office} · ${periodLabel(granularity, period)}`;

  return {
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
    params,
    label,
  };
}
