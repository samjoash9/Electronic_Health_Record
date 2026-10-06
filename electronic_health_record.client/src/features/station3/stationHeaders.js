import { HeartPulse, ListChecks, ClipboardList, Eye } from 'lucide-react';
import ToothIcon from '../../components/ui/ToothIcon';
import { formatDateAtTime } from '../../lib/formatters';
import { scoreAllCategories, overallScore } from '../../lib/scoring';
import { parseDiagnosticTests } from '../../lib/diagnosticTests';

/**
 * Each station's StationCollapsible header -- name, status line and headline
 * readings -- built from the form in one place, so PriorStationsPanel and the
 * admin's FormDetailPage head a station the same way whichever renders it.
 *
 * Spread straight onto the card: <StationCollapsible {...dentalHeader(form)}>.
 */

const stamp = (verb, iso) => `${verb} ${formatDateAtTime(iso)}`;

export function vitalsHeader(form) {
  return {
    station: 1,
    title: 'Vital signs',
    icon: HeartPulse,
    completed: Boolean(form.station1SubmittedAt),
    subtitle: form.station1SubmittedAt ? stamp('Recorded', form.station1SubmittedAt) : 'Not yet recorded',
    summary: [
      { label: 'BP', value: form.bpSystolic ? `${form.bpSystolic}/${form.bpDiastolic}` : null },
      { label: 'HR', value: form.heartRate },
      { label: 'RR', value: form.respRate },
      { label: 'Temp', value: form.tempCelsius ? `${form.tempCelsius} °C` : null },
      { label: 'BMI', value: form.bmi },
    ],
  };
}

/** `categories` is the assessment template; the scores read as dashes until it loads. */
export function assessmentHeader(form, categories) {
  const scores = categories ? scoreAllCategories(categories, form.assessmentAnswers) : [];
  const overall = categories ? overallScore(categories, form.assessmentAnswers) : null;
  // An average can sit comfortably while one aspect does not, so the weakest
  // is named beside it rather than left inside it.
  const lowest = scores
    .filter((s) => s.percent !== null)
    .reduce((low, s) => (low && low.percent <= s.percent ? low : s), null);

  return {
    station: 2,
    title: 'Assessment',
    icon: ListChecks,
    completed: Boolean(form.station2SubmittedAt),
    subtitle: form.station2SubmittedAt ? stamp('Recorded', form.station2SubmittedAt) : 'Not yet recorded',
    summary: [
      { label: 'Overall', value: overall?.percent == null ? null : `${overall.percent}%` },
      { label: 'Lowest', value: lowest ? `${lowest.name} ${lowest.percent}%` : null, mono: false },
    ],
  };
}

export function consultationHeader(form) {
  return {
    station: 3,
    title: 'Consultation',
    icon: ClipboardList,
    completed: Boolean(form.signedAt),
    subtitle: form.signedAt ? stamp('Signed', form.signedAt) : 'Not yet completed',
    signedAt: form.signedAt,
    summary: [
      { label: 'Physician', value: form.physician ? `Dr. ${form.physician.surname}` : null, mono: false },
      { label: 'Tests', value: parseDiagnosticTests(form.recommendedDiagnosticTest).length },
    ],
  };
}

export function dentalHeader(form) {
  const findings = form.dentalAssessment ?? {};

  return {
    station: 4,
    title: 'Dental assessment',
    icon: ToothIcon,
    completed: Boolean(form.dentalSignedAt),
    subtitle: form.dentalSignedAt ? stamp('Signed', form.dentalSignedAt) : 'Not yet completed',
    summary: [
      { label: 'Hygiene', value: findings.oralHygieneStatus, mono: false },
      { label: 'Caries', value: findings.dentalCaries, mono: false },
      { label: 'Referral', value: findings.dentalReferral, mono: false },
    ],
  };
}

export function visionHeader(form) {
  const findings = form.visionAssessment ?? {};

  return {
    station: 5,
    title: 'Vision assessment',
    icon: Eye,
    completed: Boolean(form.visionSignedAt),
    subtitle: form.visionSignedAt ? stamp('Signed', form.visionSignedAt) : 'Not yet completed',
    summary: [
      { label: 'Right eye', value: findings.visualAcuityRightEye },
      { label: 'Left eye', value: findings.visualAcuityLeftEye },
      { label: 'Referral', value: findings.referralToEyeSpecialist, mono: false },
    ],
  };
}
