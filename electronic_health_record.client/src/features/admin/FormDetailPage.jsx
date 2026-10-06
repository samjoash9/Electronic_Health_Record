import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Briefcase, Building2, Cake, VenusAndMars, HeartHandshake, MapPin, Phone, AtSign,
  Pencil,
} from 'lucide-react';
import { getAssessmentTemplate } from '../../api/assessment.api';
import { useWellnessForm } from '../../hooks/useWellnessForm';
import { useAuth } from '../../auth/useAuth';
import { FORM_STATUS, isSuperAdmin } from '../../lib/constants';
import { fullName, ageFrom, formatDate } from '../../lib/formatters';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PriorStationsPanel from '../station3/PriorStationsPanel';
import StationCollapsible from '../station3/StationCollapsible';
import { consultationHeader, dentalHeader, visionHeader } from '../station3/stationHeaders';
import Station3ConsultationDetail from '../station3/Station3ConsultationDetail';
import DentalAssessmentDetail from '../station3/DentalAssessmentDetail';
import VisionAssessmentDetail from '../station3/VisionAssessmentDetail';

const STATUS_LABEL = {
  [FORM_STATUS.PENDING_ASSESSMENT]: 'Pending Assessment',
  [FORM_STATUS.PENDING_CONSULTATION]: 'Pending Consultation',
  [FORM_STATUS.PENDING_DENTAL]: 'Pending Dental',
  [FORM_STATUS.PENDING_VISION]: 'Pending Vision',
  [FORM_STATUS.COMPLETED]: 'Completed',
  [FORM_STATUS.CANCELLED]: 'Cancelled',
};

const STATUS_TONE = {
  [FORM_STATUS.PENDING_ASSESSMENT]: 'info',
  [FORM_STATUS.PENDING_CONSULTATION]: 'warn',
  [FORM_STATUS.PENDING_DENTAL]: 'warn',
  [FORM_STATUS.PENDING_VISION]: 'warn',
  [FORM_STATUS.COMPLETED]: 'success',
  [FORM_STATUS.CANCELLED]: 'danger',
};

// Mirrors Station3ConsultationPage's PATIENT_FIELDS — the physician sees this
// same identity grid when they open the record, so the admin's copy reads as
// the same document rather than a lighter substitute.
const PATIENT_FIELDS = [
  { key: 'position', label: 'Position', icon: Briefcase },
  { key: 'agencyOffice', label: 'Agency/Office', icon: Building2 },
  { key: 'birthdate', label: 'Birthdate', icon: Cake, render: (p) => formatDate(p.birthdate) },
  { key: 'sex', label: 'Sex', icon: VenusAndMars },
  { key: 'civilStatus', label: 'Civil Status', icon: HeartHandshake },
  { key: 'address', label: 'Address', icon: MapPin },
  { key: 'contactNo', label: 'Contact No.', icon: Phone },
];

export default function FormDetailPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: form, isLoading, error, refetch } = useWellnessForm(formId);
  const { data: categories } = useQuery({
    queryKey: ['assessment-template'],
    queryFn: getAssessmentTemplate,
    staleTime: Infinity,
  });

  // Correction happens on its own route (/forms/:formId/edit), which is itself
  // superadmin-gated -- this only decides whether the button is worth showing.
  const canEdit = isSuperAdmin(user);

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
  const account = form.patientAccount;

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex flex-wrap items-center gap-3">
        {backButton}
        {canEdit && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="ml-auto"
            onClick={() => navigate(`/forms/${formId}/edit`)}
          >
            <Pencil size={16} strokeWidth={2.25} />
            Edit form
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <div className="flex items-center gap-4 bg-linear-to-r from-[#e9fbf6] to-[#f3fdfb] p-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#14a690] to-[#0e7d6b] text-xl font-bold text-white shadow-sm ring-4 ring-white">
            {fullName(patient).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-ink-900">{fullName(patient)}</p>
            <p className="text-sm text-ink-500">Age {ageFrom(patient?.birthdate)} · {patient?.position} · {patient?.agencyOffice}</p>
            {account?.username && (
              // The portal handle issued at Station 1, sat with the name rather than
              // in the field grid below: it identifies the person, it is not a
              // clinical detail of the visit.
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
                <AtSign size={13} strokeWidth={2.25} className="text-[#0e7d6b]" />
                <span className="font-medium text-ink-700">{account.username}</span>
                {account.mustChangePassword && (
                  <span className="text-ink-400">· has not signed in yet</span>
                )}
              </p>
            )}
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

      <StationCollapsible {...consultationHeader(form)} flush>
        <Station3ConsultationDetail form={form} />
      </StationCollapsible>

      <StationCollapsible {...dentalHeader(form)} signOffInBody>
        <DentalAssessmentDetail form={form} />
      </StationCollapsible>

      <StationCollapsible {...visionHeader(form)} signOffInBody>
        <VisionAssessmentDetail form={form} />
      </StationCollapsible>
    </div>
  );
}
