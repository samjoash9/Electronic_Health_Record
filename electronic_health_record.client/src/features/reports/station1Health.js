// Turns GET /api/health-reports/station1 into StationReportSection's kpis
// and chart configs. Colours are the ones the page's Station 1 sample
// charts used, so the section looks the same on real data.
import { HeartPulse, Users, Weight } from 'lucide-react';

const DEEP_TEAL = '#0A594D';
const PICKED_TEAL = '#37AF9B';
const EMERALD = '#10B981';
const AMBER = '#F59E0B';
const ORANGE = '#EA580C';
const ROSE = '#EF4444';
const DARK_RED = '#991B1B';
const MAROON = '#7F1D1D';

/** The chart's name for patients whose HR record has no office. */
export const NO_OFFICE = 'No office recorded';

// The ranges print ReportClassifiers.BmiClassDetailed's cutoffs (the
// lib/bmi.js classes with obese split at 30); change them together.
export const BMI_FIVE_CLASSES = [
  { key: 'underweight', name: 'Underweight', range: '< 18.5 kg/m²', color: AMBER },
  { key: 'normal', name: 'Normal', range: '18.5 – 22.9 kg/m²', color: EMERALD },
  { key: 'overweight', name: 'Overweight', range: '23.0 – 24.9 kg/m²', color: AMBER },
  { key: 'obese1', name: 'Obese Class I', range: '25.0 – 29.9 kg/m²', color: ROSE },
  { key: 'obese2', name: 'Obese Class II', range: '≥ 30.0 kg/m²', color: DARK_RED },
];

// lib/bloodPressure.js BP_CLASSES, in the page's wording.
export const BP_STAGES = [
  { key: 'normal', name: 'Normal (<120/<80)', desc: 'Optimal cardiovascular status', color: EMERALD },
  { key: 'elevated', name: 'Elevated (120-129)', desc: 'Lifestyle intervention indicated', color: AMBER },
  { key: 'stage1', name: 'Stage 1 HTN', desc: '130-139 / 80-89 mmHg', color: ORANGE },
  { key: 'stage2', name: 'Stage 2 HTN', desc: '≥ 140 / ≥ 90 mmHg', color: ROSE },
  { key: 'crisis', name: 'Hypertensive Crisis', desc: '> 180 and/or > 120 mmHg', color: MAROON },
];

const LABEL_MAX = 30;

const sumOf = (counts) => Object.values(counts).reduce((total, n) => total + n, 0);

/** count as a one-decimal percent of total, or null when total is 0. */
export const share = (count, total) => (total ? Math.round((count / total) * 1000) / 10 : null);

const percentText = (value) => (value == null ? '—' : `${value}%`);

const visitsText = (n) => `${n} visit${n === 1 ? '' : 's'}`;

/**
 * An axis label for an HR office name, which runs to 75 characters:
 * "PROVINCIAL ASSESSMENT AND TREASURY OFFICE (PASTO) - TREASURY OPERATION"
 * becomes "PASTO - TREASURY OPERATION". The tooltip keeps the full name.
 */
export function shortOfficeName(office) {
  const name = office.trim().replace(/\s+/g, ' ');
  const acronym = name.match(/\(([A-Z]{2,})\)/)?.[1];
  const division = name.split(' - ')[1];
  const label = acronym
    ? [acronym, division].filter(Boolean).join(' - ')
    : name.replace(/^PROVINCIAL /i, 'PROV. ');
  return label.length > LABEL_MAX ? `${label.slice(0, LABEL_MAX - 1).trimEnd()}…` : label;
}

/**
 * The three KPI cards. BMI and BP shares are of the patients whose latest
 * visit has that reading, not of every patient: a missing reading must not
 * read as an unhealthy one.
 */
export function station1Kpis(report) {
  const bmiMeasured = sumOf(report.bmi);
  const bpMeasured = sumOf(report.bp);
  const highBp = report.bp.stage1 + report.bp.stage2 + report.bp.crisis;

  return [
    {
      label: 'Patients Registered & Screened',
      value: report.patients,
      subtext: visitsText(report.visits),
      badgeTone: 'neutral',
      icon: Users,
    },
    {
      label: 'Healthy Normal BMI',
      value: percentText(share(report.bmi.normal, bmiMeasured)),
      subtext: `${report.bmi.normal} of ${bmiMeasured} measured`,
      badgeTone: 'positive',
      icon: Weight,
    },
    {
      label: 'High BP Flagged (Stage 1+)',
      value: percentText(share(highBp, bpMeasured)),
      subtext: `${highBp} of ${bpMeasured} measured`,
      badgeTone: 'alert',
      icon: HeartPulse,
    },
  ];
}

const isPicked = (office, picked) =>
  Boolean(office && picked && office.toLowerCase() === picked.toLowerCase());

/**
 * The by-office, BMI and BP chart configs. pickedOffice is the office
 * filter (undefined for every office); its bar is drawn in a lighter teal
 * so it stands out among the offices it is compared with.
 */
export function station1Charts(report, pickedOffice) {
  const bmiMeasured = sumOf(report.bmi);
  const bpMeasured = sumOf(report.bp);

  return {
    byOffice: {
      type: 'bar',
      title: 'Intake Volume by Agency / Office',
      subtitle: 'Patients screened per office in the period, every office whatever the office filter',
      tag: 'All Agencies',
      barColor: DEEP_TEAL,
      scrollable: true,
      data: report.byOffice.map((row) => ({
        name: row.office ? shortOfficeName(row.office) : NO_OFFICE,
        value: row.patients,
        subtext: row.office ?? undefined,
        color: isPicked(row.office, pickedOffice) ? PICKED_TEAL : DEEP_TEAL,
      })),
    },
    bmi: {
      type: 'bar',
      title: 'Asia-Pacific BMI Classification',
      subtitle: "WHO Western Pacific Region cutoffs, from each patient's latest visit in the period",
      tag: 'Nutritional Triage',
      data: BMI_FIVE_CLASSES.map((c) => ({
        name: c.name,
        value: report.bmi[c.key],
        pct: share(report.bmi[c.key], bmiMeasured) ?? 0,
        color: c.color,
        subtext: c.range,
      })),
    },
    bp: {
      type: 'donut',
      title: 'Blood Pressure Stage Distribution',
      subtitle: "ACC/AHA 2017 guideline, from each patient's latest visit in the period",
      tag: 'Cardiovascular Risk',
      data: BP_STAGES.map((s) => ({
        name: s.name,
        value: report.bp[s.key],
        pct: share(report.bp[s.key], bpMeasured) ?? 0,
        color: s.color,
        desc: s.desc,
      })),
    },
  };
}
