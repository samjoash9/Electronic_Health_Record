// Turns GET /api/health-reports/station3 into Station3HealthSection's KPIs,
// chart configs and card data. Colours are the ones the page's Station 3
// sample charts used, so the section looks the same on real data.
import { FlaskConical, Pill, Stethoscope } from 'lucide-react';
import { share } from './station1Health';

const DEEP_TEAL = '#0A594D';
const VIBRANT_TEAL = '#37AF9B';
const SKY = '#0EA5E9';
const TEAL = '#14B8A6';
const AMBER = '#F59E0B';
const ROSE = '#EF4444';
const PINK = '#EC4899';
const VIOLET = '#8B5CF6';
const EMERALD = '#10B981';
const SLATE = '#64748B';

const CONDITION_PALETTE = [DEEP_TEAL, VIBRANT_TEAL, SKY, AMBER, PINK, VIOLET, EMERALD];
const DRUG_PALETTE = [DEEP_TEAL, VIBRANT_TEAL, SKY, TEAL, AMBER, PINK, VIOLET, EMERALD];
const EXERCISE_PALETTE = [DEEP_TEAL, VIBRANT_TEAL, SKY, AMBER, VIOLET];

const percentText = (value) => (value == null ? '—' : `${value}%`);

const patientsText = (n) => `${n} patient${n === 1 ? '' : 's'}`;

// The page's top-10 cards shade the first three deepest, the next three lighter.
const rankColor = (index) => (index < 3 ? DEEP_TEAL : index < 6 ? VIBRANT_TEAL : SKY);

const painted = (rows, countKey, palette) =>
  rows.map((row, i) => ({ name: row.name, value: row[countKey], color: palette[i % palette.length] }));

const ranked = (rows, countKey) =>
  rows.map((row, i) => ({ name: row.name, value: row[countKey], color: rankColor(i) }));

// Slices with their share of everyone who answered.
const withShares = (slices) => {
  const answered = slices.reduce((total, s) => total + s.value, 0);
  return slices.map((s) => ({ ...s, pct: share(s.value, answered) ?? 0 }));
};

/** The three KPI cards; both rates are shares of consultations. */
export function station3Kpis(report) {
  const { consultations } = report;
  const rate = (n) => ({
    value: percentText(share(n, consultations)),
    subtext: `${n} of ${consultations} consultations`,
  });

  return [
    {
      label: 'Consultations Completed',
      value: consultations,
      subtext: patientsText(report.patients),
      badgeTone: 'positive',
      icon: Stethoscope,
    },
    { label: 'Prescription Issuance Rate', ...rate(report.withPrescription), badgeTone: 'positive', icon: Pill },
    { label: 'Diagnostic Labs Ordered', ...rate(report.withLabs), badgeTone: 'warning', icon: FlaskConical },
  ];
}

/**
 * conditions and maintenance are StationReportSection chart configs; the
 * rest is data for the section's own lifestyle, lab and medication cards.
 */
export function station3Charts(report) {
  const { smoking, alcohol } = report;

  return {
    conditions: {
      type: 'horizontal-bar',
      layout: 'vertical',
      title: 'Past & Recent Medical History',
      subtitle: "Conditions on each patient's latest consultation in the period, spellings merged",
      tag: 'Medical History',
      barColor: DEEP_TEAL,
      yAxisWidth: 120,
      data: painted(report.conditions, 'patients', CONDITION_PALETTE),
    },
    // Separate drugs, so bars: a line would read as a trend over time.
    maintenance: {
      type: 'horizontal-bar',
      layout: 'vertical',
      title: 'Maintenance Medication Tracking',
      subtitle: "Maintenance drugs on each patient's latest consultation in the period, spellings merged",
      tag: 'Pharmacotherapy',
      barColor: DEEP_TEAL,
      yAxisWidth: 120,
      data: painted(report.maintenanceDrugs, 'patients', DRUG_PALETTE),
    },
    smoking: withShares([
      { name: 'Non-Smoker', value: smoking.nonSmoker, color: DEEP_TEAL },
      { name: 'Cigarettes Only', value: smoking.cigarette, color: AMBER },
      { name: 'E-Cigarette / Vape', value: smoking.ecig, color: VIBRANT_TEAL },
      { name: 'Both', value: smoking.both, color: ROSE },
      ...(smoking.unspecified ? [{ name: 'Type Not Recorded', value: smoking.unspecified, color: SLATE }] : []),
    ]),
    exercise: painted(report.exercise.top, 'patients', EXERCISE_PALETTE),
    alcohol: withShares([
      { name: 'Non-Drinker', value: alcohol.never, color: DEEP_TEAL },
      { name: 'Occasional', value: alcohol.occasional, color: VIBRANT_TEAL },
      { name: 'Weekly', value: alcohol.weekly, color: AMBER },
      { name: 'Frequent/Daily', value: alcohol.frequent, color: ROSE },
    ]),
    labs: ranked(report.labs, 'orders'),
    medications: ranked(report.medications, 'orders'),
  };
}

/** Whether anyone answered a lifestyle question at all. */
export const anyAnswered = (slices) => slices.some((s) => s.value > 0);
