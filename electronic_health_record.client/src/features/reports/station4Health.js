// Turns GET /api/health-reports/station4 into Station4HealthSection's KPIs and
// chart data. Colours are the ones the page's Station 4 sample charts used.
import { Activity, ShieldAlert, Smile, Wrench } from 'lucide-react';
import { share } from './station1Health';

const EMERALD = '#10B981';
const AMBER = '#F59E0B';
const ROSE = '#EF4444';

const sumOf = (counts) => Object.values(counts).reduce((total, n) => total + n, 0);

const percentText = (value) => (value == null ? '—' : `${value}%`);

const patientsText = (n) => `${n} patient${n === 1 ? '' : 's'}`;

// A rate over the patients who answered: the value and the "x of y" under it.
const rate = (count, answered) => ({
  value: percentText(share(count, answered)),
  subtext: `${count} of ${answered} answered`,
});

const withShares = (slices) => {
  const answered = slices.reduce((total, s) => total + s.value, 0);
  return slices.map((s) => ({ ...s, pct: share(s.value, answered) ?? 0 }));
};

/** The four KPI cards. Rates are of the patients asked, not of every patient. */
export function station4Kpis(report) {
  const { gum, caries, treatmentNeed } = report;

  return [
    {
      label: 'Dental Screenings',
      value: report.screenings,
      subtext: patientsText(report.patients),
      badgeTone: 'positive',
      icon: Smile,
    },
    { label: 'Active Dental Caries Rate', ...rate(caries.present, sumOf(caries)), badgeTone: 'alert', icon: ShieldAlert },
    {
      label: 'Periodontal / Gingivitis',
      ...rate(gum.gingivitis + gum.periodontal, sumOf(gum)),
      badgeTone: 'warning',
      icon: Activity,
    },
    {
      label: 'Restorative & Extraction Needed',
      value: treatmentNeed.restorative + treatmentNeed.extraction,
      subtext: `of ${sumOf(treatmentNeed)} answered`,
      badgeTone: 'warning',
      icon: Wrench,
    },
  ];
}

/** The oral-hygiene donut and gum-condition bars, each a share of those answered. */
export function station4Charts(report) {
  const { hygiene, gum } = report;

  return {
    hygiene: withShares([
      { name: 'Good', value: hygiene.good, color: EMERALD },
      { name: 'Fair', value: hygiene.fair, color: AMBER },
      { name: 'Poor', value: hygiene.poor, color: ROSE },
    ]),
    gum: withShares([
      { name: 'Healthy', value: gum.healthy, color: EMERALD },
      { name: 'Gingivitis', value: gum.gingivitis, color: AMBER },
      { name: 'Suspected Periodontal Problem', value: gum.periodontal, color: ROSE },
    ]),
  };
}
