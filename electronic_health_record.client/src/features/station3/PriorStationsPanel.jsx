import { HeartPulse, ListChecks, ClipboardList, FlaskConical, Stethoscope, Pill, BadgeCheck, Smile, History, Receipt } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { bmiCategory } from '../../lib/bmi';
import { scoreAllCategories, overallScore } from '../../lib/scoring';
import { formatDate, formatDateTime, peso } from '../../lib/formatters';
import { DENTAL_INDICATORS, STATUS_LABEL, STATUS_TONE } from '../../lib/constants';
import { getPatientVisitHistory } from '../../api/patients.api';
import Collapsible from '../../components/ui/Collapsible';
import Badge from '../../components/ui/Badge';
import ScoreRing from '../../components/ui/ScoreRing';
import AnswersReview from '../station2/AnswersReview';
import { SubPanel } from './SectionCard';
import DiagnosticTestList from '../../components/ui/DiagnosticTestList';

/**
 * A patient's earlier visits, shown collapsed above the current one's own
 * stations so a doctor sees the last cycle's impression and prescriptions
 * while writing this one -- the clinical payoff of a patient having many
 * WellnessForm rows rather than exactly one. The current form itself is
 * excluded: PriorStationsPanel already shows it in full below.
 */
function PreviousVisitsSection({ patientID, currentFormID }) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['patient-visit-history', patientID],
    queryFn: () => getPatientVisitHistory(patientID),
    enabled: patientID != null,
  });

  const previousVisits = (history ?? []).filter((v) => v.formID !== currentFormID);

  if (!patientID || isLoading || previousVisits.length === 0) return null;

  return (
    <Collapsible
      title="Previous Visits"
      icon={History}
      subtitle={`${previousVisits.length} earlier visit${previousVisits.length > 1 ? 's' : ''} on record`}
      defaultOpen={false}
    >
      <div className="flex flex-col gap-2">
        {previousVisits.map((visit) => (
          <div
            key={visit.formID}
            className="flex flex-col gap-2 rounded-lg border border-line bg-canvas p-3.5 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink-900">{formatDate(visit.formDate)}</span>
                <Badge tone={STATUS_TONE[visit.status] ?? 'default'}>
                  {STATUS_LABEL[visit.status] ?? visit.status}
                </Badge>
              </div>
              {visit.impressionClinical && (
                <p className="mt-1.5 text-sm text-ink-700">{visit.impressionClinical}</p>
              )}
              {visit.managementTreatment && (
                <p className="mt-1 whitespace-pre-wrap text-xs text-ink-500">{visit.managementTreatment}</p>
              )}
            </div>
            {/* Charge total only, no billing status: budget is scoped to a
                period at Station 6, not approved per visit, so a single visit
                is never "Billed" or "Pending" on its own. */}
            <div className="flex items-center gap-1.5 text-xs font-medium text-ink-600 sm:flex-col sm:items-end">
              <span className="inline-flex items-center gap-1">
                <Receipt size={12} className="text-ink-400" />
                {peso(visit.totalCharged)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Collapsible>
  );
}

/** Read-only stand-in for a Textarea — the physician's own words, no input. */
function StaticAnswer({ value, placeholder }) {
  return value
    ? <p className="text-sm whitespace-pre-wrap text-ink-900">{value}</p>
    : <p className="text-sm text-ink-400 italic">{placeholder}</p>;
}

const BMI_TONE = {
  Underweight: 'warn',
  Normal: 'success',
  Overweight: 'warn',
  Obese: 'danger',
};

function VitalRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="text-sm font-medium text-ink-900">{value ?? '—'}</p>
    </div>
  );
}

export default function PriorStationsPanel({ form, categories, upToStation = 2 }) {
  const category = bmiCategory(form.bmi);
  const scores = categories ? scoreAllCategories(categories, form.assessmentAnswers) : [];
  const overall = categories ? overallScore(categories, form.assessmentAnswers) : null;

  return (
    <div className="flex flex-col gap-3">
      <PreviousVisitsSection patientID={form.patientID} currentFormID={form.formID} />

      <Collapsible
        title="Station 1 — Vital Signs"
        icon={HeartPulse}
        subtitle={`Recorded ${formatDateTime(form.station1SubmittedAt)}`}
      >
        <div className="grid grid-cols-2 gap-3 tab:grid-cols-4">
          <VitalRow label="Weight" value={form.weightKg ? `${form.weightKg} kg` : null} />
          <VitalRow label="Height" value={form.heightCm ? `${form.heightCm} cm` : null} />
          <div>
            <p className="text-xs text-ink-500">BMI</p>
            <p className="flex items-center gap-1.5 text-sm font-medium text-ink-900">
              {form.bmi ?? '—'}
              {category && <Badge tone={BMI_TONE[category]}>{category}</Badge>}
            </p>
          </div>
          <VitalRow label="Ideal BMI" value={form.idealBMI} />
          <VitalRow label="Blood Pressure" value={form.bpSystolic ? `${form.bpSystolic}/${form.bpDiastolic}` : null} />
          <VitalRow label="Temperature" value={form.tempCelsius ? `${form.tempCelsius} °C` : null} />
          <VitalRow label="Heart Rate" value={form.heartRate ? `${form.heartRate} bpm` : null} />
          <VitalRow label="Resp. Rate" value={form.respRate ? `${form.respRate} bpm` : null} />
        </div>
      </Collapsible>

      <Collapsible
        title="Station 2 — Assessment"
        icon={ListChecks}
        subtitle={`Recorded ${formatDateTime(form.station2SubmittedAt)}`}
      >
        {categories ? (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 tab:grid-cols-4">
              {scores.map((s) => (
                <ScoreRing key={s.categoryID} label={s.name} percent={s.percent} total={s.total} max={s.max} />
              ))}
              {overall && (
                <ScoreRing label="Overall Average" percent={overall.percent} total={overall.total} max={overall.max} />
              )}
            </div>
            <AnswersReview categories={categories} answers={form.assessmentAnswers} />
          </>
        ) : (
          <p className="text-sm text-ink-500">Loading assessment…</p>
        )}
      </Collapsible>

      {upToStation >= 3 && (
        <Collapsible
          title="Station 3 — Consultation"
          icon={ClipboardList}
          subtitle={form.signedAt ? `Signed ${formatDateTime(form.signedAt)}` : 'Not yet completed'}
        >
          {form.signedAt ? (
            <>
              <div className="flex flex-col gap-4">
                <SubPanel icon={FlaskConical} title="Recommended Diagnostic Test" subtitle="Labs, imaging, or referrals ordered.">
                  <DiagnosticTestList value={form.recommendedDiagnosticTest} />
                </SubPanel>
                <SubPanel icon={Stethoscope} title="Impression / Clinical" subtitle="Working diagnosis from the findings above.">
                  <StaticAnswer value={form.impressionClinical} placeholder="No impression recorded." />
                </SubPanel>
                <SubPanel icon={Pill} title="Management / Treatment" subtitle="Medication, lifestyle advice, and follow-up.">
                  <StaticAnswer value={form.managementTreatment} placeholder="No treatment plan recorded." />
                </SubPanel>
              </div>

              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-line bg-surface/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e9fbf6] text-[#0e7d6b] ring-1 ring-[#0e7d6b]/10"
                  >
                    <BadgeCheck size={16} strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-wide text-ink-500 uppercase">Physician</p>
                    <p className="text-sm font-semibold text-ink-900">
                      {form.physician ? `Dr. ${form.physician.firstName} ${form.physician.surname}` : '—'}
                    </p>
                    <p className="text-xs text-ink-500">PRC License No. {form.physician?.prcLicenseNo ?? '—'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end">
                  {form.signature && (
                    <img src={form.signature} alt="Physician signature" className="h-16 rounded border border-line bg-surface" />
                  )}
                  <p className="mt-1 text-xs text-ink-500">Signed {formatDateTime(form.signedAt)}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-500">Not yet completed.</p>
          )}
        </Collapsible>
      )}

      {upToStation >= 4 && (
        <Collapsible
          title="Station 4 — Dental Assessment"
          icon={Smile}
          subtitle={form.dentalAssessment ? `Recorded ${formatDateTime(form.dentalSignedAt)}` : 'Not yet completed'}
        >
          {form.dentalAssessment ? (
            <div className="flex flex-col gap-4">
              {DENTAL_INDICATORS.map(({ name, label }, index) => (
                <SubPanel key={name} icon={Smile} title={`${index + 1}. ${label}`}>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-semibold text-ink-900">
                      {form.dentalAssessment[name] || <span className="font-normal text-ink-400 italic">Not assessed</span>}
                    </p>
                    <StaticAnswer
                      value={form.dentalAssessment[`${name}Remarks`]}
                      placeholder="No remarks."
                    />
                  </div>
                </SubPanel>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-500">Not yet completed.</p>
          )}
        </Collapsible>
      )}
    </div>
  );
}
