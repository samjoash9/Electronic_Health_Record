// Turns GET /api/health-reports/station5 into Station5HealthSection's KPIs and
// chart data. Colours are the ones the page's Station 5 sample chart used.
import { Activity, AlertCircle, Eye, Glasses } from 'lucide-react';
import { share } from './station1Health';

// VISION_INDICATORS' order and labels in lib/constants.js.
const SYMPTOMS = [
  { key: 'history', name: 'History of Eye Problems', color: '#0A594D' },
  { key: 'eyePain', name: 'Eye Pain / Discomfort', color: '#EF4444' },
  { key: 'blurred', name: 'Blurred Vision', color: '#F59E0B' },
  { key: 'near', name: 'Difficulty Seeing Near Objects', color: '#37AF9B' },
  { key: 'distant', name: 'Difficulty Seeing Distant Objects', color: '#0EA5E9' },
];

const percentText = (value) => (value == null ? '—' : `${value}%`);

const patientsText = (n) => `${n} patient${n === 1 ? '' : 's'}`;

// "Yes" count with its share of those who answered beside it.
const yesCount = ({ yes, answered }) => ({
  value: yes,
  subtext: `${percentText(share(yes, answered))} of ${answered} answered`,
});

/** The four KPI cards. Shares are of the patients asked, not of every patient. */
export function station5Kpis(report) {
  const { eyePain, near, distant } = report.symptoms;

  return [
    {
      label: 'Vision Screenings Performed',
      value: report.screenings,
      subtext: patientsText(report.patients),
      badgeTone: 'positive',
      icon: Eye,
    },
    {
      label: 'Reported Eye Pain / Discomfort',
      value: percentText(share(eyePain.yes, eyePain.answered)),
      subtext: `${eyePain.yes} of ${eyePain.answered} answered`,
      badgeTone: 'alert',
      icon: AlertCircle,
    },
    { label: 'Near Vision Difficulty (Presbyopia Risk)', ...yesCount(near), badgeTone: 'warning', icon: Glasses },
    { label: 'Distant Vision Difficulty (Myopia Risk)', ...yesCount(distant), badgeTone: 'warning', icon: Activity },
  ];
}

/** The five symptoms' "Yes" counts, each with its share of those who answered it. */
export function station5Charts(report) {
  return {
    symptoms: SYMPTOMS.map(({ key, name, color }) => {
      const { yes, answered } = report.symptoms[key];
      return { name, value: yes, pct: share(yes, answered) ?? 0, color };
    }),
  };
}
