// Office-filter pieces shared by the dashboard's per-office charts.

import AGENCY_POSITION_MAP from '../../lib/agencyPositions.json';

export const ALL_OFFICES = 'all';

export const OFFICE_OPTIONS = [
  { value: ALL_OFFICES, label: 'All offices' },
  ...Object.keys(AGENCY_POSITION_MAP)
    .sort((a, b) => a.localeCompare(b))
    .map((office) => ({ value: office, label: office })),
];

/** Query params for the picked office: {} means every office. */
export const officeParams = (office) => (office === ALL_OFFICES ? {} : { office });
