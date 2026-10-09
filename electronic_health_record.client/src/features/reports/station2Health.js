// Turns GET /api/health-reports/station2 into StationReportSection's kpis
// and chart configs. Aspect colours are the ones the page's Station 2 sample
// chart used, and an aspect keeps its colour in both charts.
import { Activity, Sparkles } from 'lucide-react';
import { scoreBand } from '../../lib/interpretation';

const ASPECT_COLOR = {
  Spiritual: '#10B981',
  Psychological: '#37AF9B',
  Mental: '#0EA5E9',
  Emotional: '#14B8A6',
  Physical: '#0A594D',
  Financial: '#F59E0B',
  Social: '#8B5CF6',
};
const OTHER_ASPECT = '#64748B';

// lib/interpretation.js bands, in the words Station2Report.jsx uses.
const BAND_LABEL = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  attention: 'Needs attention',
  support: 'Needs support',
};

const colorOf = (category) => ASPECT_COLOR[category] ?? OTHER_ASPECT;

const bandText = (score) => (score == null ? 'No answers in this period' : BAND_LABEL[scoreBand(score)]);

const patientsText = (n) => `${n} patient${n === 1 ? '' : 's'}`;

/** The two KPI cards: assessments done, and the pooled score out of 100. */
export function station2Kpis(report) {
  const { overallScore } = report;

  return [
    {
      label: 'Total Assessments Completed',
      value: report.assessments,
      subtext: patientsText(report.patients),
      badgeTone: 'positive',
      icon: Activity,
    },
    {
      label: 'Average Global Wellness Score',
      value: overallScore == null ? '—' : `${overallScore.toFixed(1)} / 100`,
      subtext: bandText(overallScore),
      badgeTone: 'positive',
      icon: Sparkles,
    },
  ];
}

/**
 * The aspect-score and at-risk chart configs. An aspect nobody answered
 * (assessments before the seven-aspect questionnaire cover four) has no bar
 * and a dash in the legend, rather than a zero that reads as a bad score.
 */
export function station2Charts(report) {
  return {
    scores: {
      type: 'bar',
      title: '7 Aspects of Wellness (Average Assessment Scores)',
      subtitle: "Average score per aspect, from each patient's latest assessment in the period (0–100 scale)",
      tag: 'Wellness Dimensions',
      domain: [0, 100],
      ticks: [0, 20, 40, 60, 80, 100],
      yUnit: ' pts',
      valueFormatter: (value) => value ?? '',
      data: report.aspects.map((a) => ({
        name: a.category,
        value: a.score,
        // The legend shows `value ?? count`.
        ...(a.score == null && { count: '—' }),
        color: colorOf(a.category),
        subtext: bandText(a.score),
      })),
    },
    atRisk: {
      type: 'horizontal-bar',
      title: 'At-Risk Patients by Wellness Aspect (Score < 50)',
      subtitle: "Patients whose own score in the aspect is below 50, from their latest assessment in the period",
      tag: 'Priority Interventions',
      // sort is stable, so ties keep the questionnaire's order.
      data: [...report.aspects]
        .sort((a, b) => b.atRisk - a.atRisk)
        .map((a) => ({
          name: a.category,
          value: a.atRisk,
          color: colorOf(a.category),
          subtext: `${a.atRisk} of ${a.patients} who answered`,
        })),
    },
  };
}
