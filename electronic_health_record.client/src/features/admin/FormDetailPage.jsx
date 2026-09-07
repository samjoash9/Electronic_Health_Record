import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, IdCard, Briefcase, Building2, Cake, VenusAndMars, HeartHandshake, MapPin, Phone,
  Users, Stethoscope, Activity, ClipboardList, FlaskConical, Pill,
  Cigarette, Dumbbell, Wine, BadgeCheck,
} from 'lucide-react';
import { getAssessmentTemplate } from '../../api/assessment.api';
import { useWellnessForm } from '../../hooks/useWellnessForm';
import { FORM_STATUS } from '../../lib/constants';
import { fullName, ageFrom, formatDate, formatDateTime } from '../../lib/formatters';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PriorStationsPanel from '../station3/PriorStationsPanel';
import SectionCard, { SubPanel } from '../station3/SectionCard';

const STATUS_LABEL = {
  [FORM_STATUS.PENDING_ASSESSMENT]: 'Pending Assessment',
  [FORM_STATUS.PENDING_CONSULTATION]: 'Pending Consultation',
  [FORM_STATUS.COMPLETED]: 'Completed',
  [FORM_STATUS.CANCELLED]: 'Cancelled',
};

const STATUS_TONE = {
  [FORM_STATUS.PENDING_ASSESSMENT]: 'info',
  [FORM_STATUS.PENDING_CONSULTATION]: 'warn',
  [FORM_STATUS.COMPLETED]: 'success',
  [FORM_STATUS.CANCELLED]: 'danger',
};

// Mirrors Station3ConsultationPage's PATIENT_FIELDS — the physician sees this
// same identity grid when they open the record, so the admin's copy reads as
// the same document rather than a lighter substitute.
const PATIENT_FIELDS = [
  { key: 'externalEmployeeId', label: 'Employee ID', icon: IdCard },
  { key: 'position', label: 'Position', icon: Briefcase },
  { key: 'agencyOffice', label: 'Agency/Office', icon: Building2 },
  { key: 'birthdate', label: 'Birthdate', icon: Cake, render: (p) => formatDate(p.birthdate) },
  { key: 'sex', label: 'Sex', icon: VenusAndMars },
  { key: 'civilStatus', label: 'Civil Status', icon: HeartHandshake },
  { key: 'address', label: 'Address', icon: MapPin },
  { key: 'contactNo', label: 'Contact No.', icon: Phone },
];

function HistoryList({ items, render, empty }) {
  if (!items?.length) return <p className="text-sm text-ink-500">{empty}</p>;
  return (
    <ul className="flex flex-col gap-1.5 text-sm">
      {items.map((item, i) => <li key={item.fmhID ?? item.pmhID ?? i}>{render(item)}</li>)}
    </ul>
  );
}

/** Read-only stand-in for AssessmentPlanSection's Textarea — the same label and icon, just the physician's own words instead of an input. */
function StaticAnswer({ value, placeholder }) {
  return value
    ? <p className="text-sm whitespace-pre-wrap text-ink-900">{value}</p>
    : <p className="text-sm text-ink-400 italic">{placeholder}</p>;
}

export default function FormDetailPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { data: form, isLoading, error, refetch } = useWellnessForm(formId);
  const { data: categories } = useQuery({
    queryKey: ['assessment-template'],
    queryFn: getAssessmentTemplate,
    staleTime: Infinity,
  });

  const backButton = (
    <Button
      type="button"
      variant="secondary"
      size="md"
      className="self-start"
      onClick={() => navigate('/forms')}
    >
      <ArrowLeft size={16} strokeWidth={2.25} />
      Back to Forms
    </Button>
  );

  if (isLoading || error) {
    return (
      <div className="flex flex-col gap-3 pb-6">
        {backButton}
        {isLoading ? <Skeleton /> : <ErrorState error={error} onRetry={refetch} />}
      </div>
    );
  }

  const patient = form.patient;
  const social = form.socialHistory;

  return (
    <div className="flex flex-col gap-4 pb-6">
      {backButton}

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <div className="flex items-center gap-4 bg-linear-to-r from-[#e9fbf6] to-[#f3fdfb] p-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#14a690] to-[#0e7d6b] text-xl font-bold text-white shadow-sm ring-4 ring-white">
            {fullName(patient).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-ink-900">{fullName(patient)}</p>
            <p className="text-sm text-ink-500">Age {ageFrom(patient?.birthdate)} · {patient?.position} · {patient?.agencyOffice}</p>
          </div>
          <Badge tone={STATUS_TONE[form.status]}>{STATUS_LABEL[form.status] ?? form.status}</Badge>
        </div>

        <dl className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {PATIENT_FIELDS.map(({ key, label, icon: Icon, render }) => (
            <div key={key} className="flex items-start gap-3 rounded-lg border border-line bg-canvas p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#e9fbf6] text-[#0e7d6b]">
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</dt>
                <dd className={`mt-0.5 text-sm font-medium text-ink-900 ${key === 'address' ? 'wrap-break-word' : 'truncate'}`}>
                  {render ? render(patient) : patient?.[key] || '—'}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </div>

      <PriorStationsPanel form={form} categories={categories} />

      <SectionCard
        step={1}
        title="Family Medical History"
        subtitle="Conditions reported among the patient's immediate family."
        icon={Users}
      >
        <HistoryList
          items={form.familyMedicalHistory}
          empty="No family medical history on file."
          render={(row) => row.isNone
            ? 'None reported'
            : `${row.conditionOther ?? `Condition #${row.conditionID}`}${row.familyMembers ? ` — ${row.familyMembers}` : ''}`}
        />
      </SectionCard>

      <SectionCard
        step={2}
        title="Past Medical History"
        subtitle="Diagnosed conditions and any maintenance medication on file."
        icon={Stethoscope}
      >
        <HistoryList
          items={form.pastMedicalHistory}
          empty="No past medical history on file."
          render={(row) => `${row.conditionOther} (${row.yearDiagnosed ?? '—'}) — ${row.maintenanceDrugGeneric ?? '—'} ${row.dosage ?? ''} ${row.frequency ?? ''}`}
        />
      </SectionCard>

      <SectionCard
        step={3}
        title="Social History"
        subtitle="Lifestyle habits recorded during the consultation."
        icon={Activity}
      >
        {social ? (
          <div className="flex flex-col gap-4">
            <SubPanel icon={Cigarette} title="Smoking" subtitle="Cigarette usage">
              <p className="text-sm font-medium text-ink-900">{social.smokingSticksPerDay ?? 0} sticks/day</p>
            </SubPanel>
            <SubPanel icon={Dumbbell} title="Exercise" subtitle="Physical activity">
              <p className="text-sm font-medium text-ink-900">{social.exerciseFrequency ?? '—'} · {social.exerciseType ?? '—'}</p>
            </SubPanel>
            <SubPanel icon={Wine} title="Alcohol" subtitle="Alcohol consumption">
              <p className="text-sm font-medium text-ink-900">{social.alcoholType ?? '—'}</p>
              <p className="mt-1 text-xs text-ink-500">Drinking frequency: {social.drinkFrequency ?? '—'}</p>
            </SubPanel>
          </div>
        ) : (
          <p className="text-sm text-ink-500">No social history on file.</p>
        )}
      </SectionCard>

      <SectionCard
        step={4}
        title="Physician's Assessment"
        subtitle="Findings and plan of care recorded by the attending physician."
        icon={ClipboardList}
      >
        {form.status === FORM_STATUS.COMPLETED ? (
          <>
            <div className="flex flex-col gap-4">
              <SubPanel icon={FlaskConical} title="Recommended Diagnostic Test" subtitle="Labs, imaging, or referrals ordered.">
                <StaticAnswer value={form.recommendedDiagnosticTest} placeholder="None ordered." />
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
      </SectionCard>
    </div>
  );
}
