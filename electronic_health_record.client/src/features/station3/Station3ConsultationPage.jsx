import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { getAssessmentTemplate } from '../../api/assessment.api';
import { submitStation3 } from '../../api/forms.api';
import { useWellnessForm } from '../../hooks/useWellnessForm';
import { useAuth } from '../../auth/useAuth';
import { fullName, ageFrom } from '../../lib/formatters';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';
import ConflictModal from '../../components/ui/ConflictModal';
import PriorStationsPanel from './PriorStationsPanel';
import FamilyHistorySection from './FamilyHistorySection';
import PastMedicalHistorySection from './PastMedicalHistorySection';
import SocialHistorySection from './SocialHistorySection';
import AssessmentPlanSection from './AssessmentPlanSection';
import PhysicianSignature from './PhysicianSignature';

const BLANK_PMH_ROW = {
  conditionOther: '', yearDiagnosed: '',
  maintenanceDrugGeneric: '', dosage: '', frequency: '',
};

const DEFAULT_VALUES = {
  familyHistory: { none: false, conditions: {}, other: { checked: false, conditionOther: '', familyMembers: '' } },
  pastMedicalHistory: [{ ...BLANK_PMH_ROW }],
  socialHistory: {
    smokingSticksPerDay: '', exerciseFrequency: '', exerciseType: '',
    alcoholType: '', drinkFrequency: '', drinksPerSession: '',
    hasBeenDrunk: false, drunkFrequency: '',
  },
  recommendedDiagnosticTest: '',
  impressionClinical: '',
  managementTreatment: '',
};

function buildFamilyHistory(values) {
  const fh = values.familyHistory;
  if (fh.none) return [{ conditionID: 1, isNone: true, familyMembers: null }];

  const rows = [];
  for (const [conditionID, entry] of Object.entries(fh.conditions ?? {})) {
    if (!entry?.checked) continue;
    rows.push({
      conditionID: Number(conditionID),
      isNone: false,
      familyMembers: entry.familyMembers || null,
    });
  }
  if (fh.other?.checked) {
    rows.push({
      conditionID: null,
      conditionOther: fh.other.conditionOther || null,
      isNone: false,
      familyMembers: fh.other.familyMembers || null,
    });
  }
  return rows;
}

function buildPastMedicalHistory(values) {
  return (values.pastMedicalHistory ?? [])
    .filter((row) => row.conditionOther?.trim())
    .map((row) => ({
      conditionID: null,
      conditionOther: row.conditionOther.trim(),
      yearDiagnosed: row.yearDiagnosed ? Number(row.yearDiagnosed) : null,
      maintenanceDrugGeneric: row.maintenanceDrugGeneric || null,
      dosage: row.dosage || null,
      frequency: row.frequency || null,
    }));
}

export default function Station3ConsultationPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [signature, setSignature] = useState(null);
  const [conflictOpen, setConflictOpen] = useState(false);

  const { data: form, isLoading, error, refetch } = useWellnessForm(formId);
  const { data: categories } = useQuery({
    queryKey: ['assessment-template'],
    queryFn: getAssessmentTemplate,
    staleTime: Infinity,
  });

  const {
    register, control, watch, setValue, handleSubmit,
  } = useForm({ defaultValues: DEFAULT_VALUES });

  const mutation = useMutation({
    mutationFn: (values) => submitStation3({
      formID: Number(formId),
      physicianID: user.id,
      rowVersion: form.rowVersion,
      consultation: {
        familyMedicalHistory: buildFamilyHistory(values),
        pastMedicalHistory: buildPastMedicalHistory(values),
        socialHistory: {
          ...values.socialHistory,
          smokingSticksPerDay: values.socialHistory.smokingSticksPerDay
            ? Number(values.socialHistory.smokingSticksPerDay) : null,
          drunkFrequency: values.socialHistory.hasBeenDrunk
            ? values.socialHistory.drunkFrequency : null,
        },
        recommendedDiagnosticTest: values.recommendedDiagnosticTest || null,
        impressionClinical: values.impressionClinical || null,
        managementTreatment: values.managementTreatment || null,
        signature,
      },
    }),
    onSuccess: () => {
      toast.success('Form signed and completed.');
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      navigate('/station3');
    },
    onError: (error) => {
      if (error.status === 409) setConflictOpen(true);
      else toast.error(error.message);
    },
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const patient = form.patient;

  const handleReload = () => {
    setConflictOpen(false);
    queryClient.invalidateQueries({ queryKey: ['form', Number(formId)] });
  };

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4 pb-20">
      <div className="rounded border border-line bg-surface px-4 py-3">
        <p className="text-lg font-semibold text-ink-900">{fullName(patient)}</p>
        <p className="text-sm text-ink-500">
          {patient?.externalEmployeeId} · Age {ageFrom(patient?.birthdate)} · {patient?.sex} · {patient?.agencyOffice}
        </p>
      </div>

      <PriorStationsPanel form={form} categories={categories} />

      <FamilyHistorySection register={register} watch={watch} setValue={setValue} />
      <PastMedicalHistorySection control={control} register={register} />
      <SocialHistorySection register={register} watch={watch} />
      <AssessmentPlanSection register={register} />
      <PhysicianSignature
        physicianName={user?.name}
        prcLicenseNo={user?.prcLicenseNo}
        value={signature}
        onChange={setSignature}
      />

      <div className="sticky bottom-0 -mx-4 -mb-4 flex items-center justify-end gap-3 border-t border-line bg-surface px-4 py-3">
        {!signature && (
          <span className="text-xs text-rose-600">A signature is required before submitting.</span>
        )}
        <Button type="submit" disabled={!signature || mutation.isPending}>
          {mutation.isPending ? 'Submitting…' : 'Sign and Complete'}
        </Button>
      </div>

      <ConflictModal open={conflictOpen} onReload={handleReload} onClose={() => setConflictOpen(false)} />
    </form>
  );
}
