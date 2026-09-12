import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { getAssessmentTemplate } from '../../api/assessment.api';
import { submitStation3 } from '../../api/forms.api';
import { listPhysicians } from '../../api/onboarding.api';
import { useWellnessForm } from '../../hooks/useWellnessForm';
import { useAuth } from '../../auth/useAuth';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { useAutosaveDraft } from '../../hooks/useAutosaveDraft';
import { fullName, ageFrom, formatDate, formatDateTime } from '../../lib/formatters';
import { saveDraft, loadDraft, clearDraft } from '../../lib/station3Draft';
import { ROLES } from '../../lib/constants';
import { ArrowLeft, Briefcase, Building2, Cake, VenusAndMars, HeartHandshake, MapPin, Phone, Save } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConflictModal from '../../components/ui/ConflictModal';
import PriorStationsPanel from './PriorStationsPanel';
import FamilyHistorySection from './FamilyHistorySection';
import PastMedicalHistorySection from './PastMedicalHistorySection';
import SocialHistorySection from './SocialHistorySection';
import AssessmentPlanSection from './AssessmentPlanSection';
import PhysicianSignature from './PhysicianSignature';
import { activePhysicianOptions, findPhysician } from './physicianOptions';

const PATIENT_FIELDS = [
  { key: 'position', label: 'Position', icon: Briefcase },
  { key: 'agencyOffice', label: 'Agency/Office', icon: Building2 },
  { key: 'birthdate', label: 'Birthdate', icon: Cake, render: (p) => formatDate(p.birthdate) },
  { key: 'sex', label: 'Sex', icon: VenusAndMars },
  { key: 'civilStatus', label: 'Civil Status', icon: HeartHandshake },
  { key: 'address', label: 'Address', icon: MapPin },
  { key: 'contactNo', label: 'Contact No.', icon: Phone },
];

const BLANK_PMH_ROW = {
  conditionOther: '', yearDiagnosed: '',
  maintenanceDrugGeneric: '', dosage: '', frequency: '',
};

const DEFAULT_VALUES = {
  familyHistory: {
    none: false,
    conditions: {},
    other: { checked: false, entries: [{ conditionOther: '', conditionType: '' }] },
  },
  pastMedicalHistory: [{ ...BLANK_PMH_ROW }],
  socialHistory: {
    // null means unanswered, so the Yes/No pair starts with neither selected.
    smokes: null,
    smokesCigarette: false,
    cigaretteSticksPerDay: '', cigaretteFrequency: '', cigaretteYearStarted: '', cigarettePuffsPerDay: '',
    smokesEcig: false,
    ecigPodsPerMonth: '', ecigFrequency: '', ecigYearStarted: '', ecigPuffsPerDay: '',
    alcoholType: '', drinkFrequency: '', drinksPerSession: '',
  },
  exercise: [{ exerciseType: '', exerciseFrequency: '', exerciseYearStarted: '' }],
  recommendedDiagnosticTest: '',
  impressionClinical: '',
  managementTreatment: '',
};

function buildFamilyHistory(values) {
  const fh = values.familyHistory;
  if (fh.none) return [{ conditionID: 1, isNone: true, conditionType: null }];

  const rows = [];
  for (const [conditionID, entry] of Object.entries(fh.conditions ?? {})) {
    if (!entry?.checked) continue;
    rows.push({
      conditionID: Number(conditionID),
      isNone: false,
      conditionType: entry.conditionType || null,
    });
  }
  if (fh.other?.checked) {
    for (const entry of fh.other.entries ?? []) {
      if (!entry.conditionOther?.trim()) continue;
      rows.push({
        conditionID: null,
        conditionOther: entry.conditionOther.trim(),
        isNone: false,
        conditionType: entry.conditionType || null,
      });
    }
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

function buildExercise(values) {
  return (values.exercise ?? [])
    .filter((row) => row.exerciseType?.trim())
    .map((row) => ({
      exerciseType: row.exerciseType.trim(),
      exerciseFrequency: row.exerciseFrequency || null,
      exerciseYearStarted: row.exerciseYearStarted || null,
    }));
}

export default function Station3ConsultationPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // Read the draft once during the first render so the form and the signature
  // can be seeded from it directly, instead of set from an effect afterwards.
  const [restoredDraft] = useState(() => loadDraft(formId));
  const [signature, setSignature] = useState(restoredDraft?.signature ?? null);
  // The attending physician is chosen per consultation, so a doctor working
  // their own queue starts on themselves and anyone else starts empty.
  const [physicianID, setPhysicianID] = useState(
    restoredDraft?.physicianID ?? (user?.role === ROLES.DOCTOR ? user.id : null),
  );
  const [physicianError, setPhysicianError] = useState(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(restoredDraft?.savedAt ?? null);
  // Mirrors mutation.isSuccess but updates synchronously, so the blocker
  // (read at navigate() time, not at next render) can't see a stale value.
  const submittedRef = useRef(false);

  const { data: form, isLoading, error, refetch } = useWellnessForm(formId);
  const { data: categories } = useQuery({
    queryKey: ['assessment-template'],
    queryFn: getAssessmentTemplate,
    staleTime: Infinity,
  });
  const { data: physicians } = useQuery({
    queryKey: ['physicians'],
    queryFn: listPhysicians,
  });

  const physicianOptions = activePhysicianOptions(physicians);
  const selectedPhysician = findPhysician(physicians, physicianID);

  const {
    register, control, watch, setValue, handleSubmit, getValues,
    formState: { isDirty },
  } = useForm({ defaultValues: restoredDraft?.values ?? DEFAULT_VALUES });

  // Notify only; the values themselves were seeded above during the first render.
  useEffect(() => {
    if (restoredDraft) toast.info('Restored your saved draft.');
  }, [restoredDraft]);

  const handleSaveDraft = () => {
    const savedAt = saveDraft(formId, { values: getValues(), signature, physicianID });
    if (!savedAt) {
      toast.error('Could not save the draft. Browser storage may be full or disabled.');
      return false;
    }
    setDraftSavedAt(savedAt);
    toast.success('Draft saved on this device.');
    return true;
  };

  // Autosaves a short idle period after any field, the signature, or the
  // physician selection changes -- so a reload or crash never loses more
  // than a few seconds of work, without needing the leave-flow's own
  // manual "Save as draft" button. Silent on success (no toast) since it
  // runs continuously in the background; draftSavedAt still updates so the
  // existing "Draft saved ..." label reflects it.
  useAutosaveDraft(
    () => saveDraft(formId, { values: getValues(), signature, physicianID }),
    { values: watch(), signature, physicianID },
    { stoppedRef: submittedRef, onSaved: setDraftSavedAt },
  );

  const mutation = useMutation({
    mutationFn: (values) => submitStation3({
      formID: Number(formId),
      physicianID,
      rowVersion: form.rowVersion,
      consultation: {
        familyMedicalHistory: buildFamilyHistory(values),
        pastMedicalHistory: buildPastMedicalHistory(values),
        exercise: buildExercise(values),
        socialHistory: {
          ...values.socialHistory,
          // Unanswered stays null; only an explicit Yes carries the rest.
          smokes: values.socialHistory.smokes ?? null,
          smokesCigarette: values.socialHistory.smokes === true
            ? Boolean(values.socialHistory.smokesCigarette) : false,
          smokesEcig: values.socialHistory.smokes === true
            ? Boolean(values.socialHistory.smokesEcig) : false,
          // Each sub-block's fields are cleared unless its own checkbox is on,
          // so an unchecked block can't submit stale values left over from
          // when it was checked.
          ...(values.socialHistory.smokes === true && values.socialHistory.smokesCigarette
            ? {
              cigaretteSticksPerDay: values.socialHistory.cigaretteSticksPerDay || null,
              cigaretteFrequency: values.socialHistory.cigaretteFrequency || null,
              cigaretteYearStarted: values.socialHistory.cigaretteYearStarted || null,
              cigarettePuffsPerDay: values.socialHistory.cigarettePuffsPerDay || null,
            }
            : {
              cigaretteSticksPerDay: null, cigaretteFrequency: null,
              cigaretteYearStarted: null, cigarettePuffsPerDay: null,
            }),
          ...(values.socialHistory.smokes === true && values.socialHistory.smokesEcig
            ? {
              ecigPodsPerMonth: values.socialHistory.ecigPodsPerMonth || null,
              ecigFrequency: values.socialHistory.ecigFrequency || null,
              ecigYearStarted: values.socialHistory.ecigYearStarted || null,
              ecigPuffsPerDay: values.socialHistory.ecigPuffsPerDay || null,
            }
            : {
              ecigPodsPerMonth: null, ecigFrequency: null,
              ecigYearStarted: null, ecigPuffsPerDay: null,
            }),
        },
        recommendedDiagnosticTest: values.recommendedDiagnosticTest || null,
        impressionClinical: values.impressionClinical || null,
        managementTreatment: values.managementTreatment || null,
        signature,
      },
    }),
    onSuccess: () => {
      // Set synchronously so the blocker (which reads this ref at nav time,
      // not at next render) never sees a stale unsubmitted state and
      // re-blocks the navigate() below.
      submittedRef.current = true;
      // The consultation is final now; a stale draft would restore over it.
      clearDraft(formId);
      toast.success('Form signed and completed.');
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      navigate('/station3');
    },
    onError: (error) => {
      if (error.status === 409) setConflictOpen(true);
      else toast.error(error.message);
    },
  });

  const blocker = useUnsavedChangesGuard(
    () => (isDirty || Boolean(signature)) && !submittedRef.current,
  );

  const handleSaveDraftAndLeave = () => {
    handleSaveDraft();
    // Leave either way: a failed save already surfaced a toast, and blocking
    // here would trap the physician in the modal with no way out.
    blocker.proceed?.();
  };

  const handleDiscard = () => {
    clearDraft(formId);
    blocker.proceed?.();
  };

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const patient = form.patient;

  const handleReload = () => {
    setConflictOpen(false);
    queryClient.invalidateQueries({ queryKey: ['form', Number(formId)] });
  };

  return (
    <form onSubmit={handleSubmit((values) => {
      // The picker is a submitted field, so it is validated here rather than
      // only leaned on through a disabled button.
      if (!physicianID) {
        setPhysicianError('Select the attending physician.');
        return;
      }
      mutation.mutate(values);
    })}>
      <div className="flex flex-col gap-4 pb-4">
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          <div className="flex items-center gap-4 bg-linear-to-r from-[#e9fbf6] to-[#f3fdfb] p-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#14a690] to-[#0e7d6b] text-xl font-bold text-white shadow-sm ring-4 ring-white">
              {fullName(patient).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-ink-900">{fullName(patient)}</p>
              <p className="text-sm text-ink-500">Age {ageFrom(patient?.birthdate)} · {patient?.position} · {patient?.agencyOffice}</p>
            </div>
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

        <FamilyHistorySection register={register} watch={watch} setValue={setValue} control={control} />
        <PastMedicalHistorySection control={control} register={register} />
        <SocialHistorySection control={control} watch={watch} />
        <AssessmentPlanSection register={register} watch={watch} setValue={setValue} />
        <PhysicianSignature
          physicianOptions={physicianOptions}
          physicianID={physicianID}
          onPhysicianChange={(next) => {
            setPhysicianID(Number(next));
            setPhysicianError(null);
          }}
          physicianError={physicianError}
          physicianName={selectedPhysician
            ? `Dr. ${selectedPhysician.firstName} ${selectedPhysician.surname}`
            : null}
          prcLicenseNo={selectedPhysician?.prcLicenseNo}
          value={signature}
          onChange={setSignature}
        />
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-3 border-t border-line bg-surface px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        <Button type="button" variant="secondary" size="lg" onClick={() => navigate('/station3')}>
          <ArrowLeft size={16} strokeWidth={2.25} />
          Back to Patient List
        </Button>
        <div className="flex items-center gap-3">
          {draftSavedAt && (
            <span className="text-xs text-ink-500">
              Draft saved {formatDateTime(draftSavedAt)}
            </span>
          )}
          {!physicianID ? (
            <span className="text-xs text-rose-600">Select the attending physician.</span>
          ) : !signature && (
            <span className="text-xs text-rose-600">A signature is required before submitting.</span>
          )}
          <Button
            type="submit"
            variant="teal"
            size="lg"
            disabled={!physicianID || !signature || mutation.isPending}
          >
            {mutation.isPending ? 'Submitting…' : 'Sign and Complete'}
          </Button>
        </div>
      </div>

      <ConflictModal open={conflictOpen} onReload={handleReload} onClose={() => setConflictOpen(false)} />

      <Modal
        open={blocker.state === 'blocked'}
        title="Leave without submitting?"
        size="lg"
        onClose={() => blocker.reset?.()}
        footer={
          <>
            {/* mr-auto pins this to the far left of the footer's justify-end row,
                keeping the leave actions grouped on the right. */}
            <Button type="button" variant="secondary" size="lg" className="mr-auto" onClick={() => blocker.reset?.()}>
              Back
            </Button>
            <Button type="button" variant="teal" size="lg" onClick={handleSaveDraftAndLeave}>
              <Save size={16} strokeWidth={2.25} />
              Save as draft &amp; leave
            </Button>
            <Button type="button" variant="danger" size="lg" onClick={handleDiscard}>
              Discard changes
            </Button>
          </>
        }
      >
        This consultation has not been signed and submitted yet. You can save it as a draft
        on this device and finish later, or discard what you&apos;ve entered.
      </Modal>
    </form>
  );
}
