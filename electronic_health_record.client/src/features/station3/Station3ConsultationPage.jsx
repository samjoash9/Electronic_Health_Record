import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { getAssessmentTemplate } from '../../api/assessment.api';
import { submitStation3 } from '../../api/forms.api';
import { listPhysicians } from '../../api/onboarding.api';
import { useWellnessForm } from '../../hooks/useWellnessForm';
import { useStationFormGuard } from '../../hooks/useStationFormGuard';
import { useMarkStationStarted } from '../../hooks/useMarkStationStarted';
import { useAuth } from '../../auth/useAuth';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { useAutosaveDraft } from '../../hooks/useAutosaveDraft';
import { useRevealFirstInvalid } from '../../hooks/useRevealFirstInvalid';
import { fullName, ageFrom, formatDate, formatDateTime } from '../../lib/formatters';
import { saveDraft, loadDraft, clearDraft } from '../../lib/station3Draft';
import {
  DEFAULT_CONSULTATION_VALUES as DEFAULT_VALUES,
  buildCharges, buildExercise, buildFamilyHistory, buildManagementTreatment,
  buildPastMedicalHistory, buildSocialHistory,
} from '../../lib/station3Payload';
import { visitYear } from '../../lib/consultationRecord';
import { yearBounds } from '../../lib/yearBounds';
import { ROLES, STATIONS } from '../../lib/constants';
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

// `wide` facts run long, so below `tab` they take a full row of the two-column
// grid and the short ones pair up beside each other.
const PATIENT_FIELDS = [
  { key: 'position', label: 'Position', icon: Briefcase, wide: true },
  { key: 'agencyOffice', label: 'Agency/Office', icon: Building2, wide: true },
  { key: 'birthdate', label: 'Birthdate', icon: Cake, render: (p) => formatDate(p.birthdate) },
  { key: 'sex', label: 'Sex', icon: VenusAndMars },
  { key: 'civilStatus', label: 'Civil Status', icon: HeartHandshake },
  { key: 'address', label: 'Address', icon: MapPin, wide: true },
  { key: 'contactNo', label: 'Contact No.', icon: Phone },
];

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
  const formRef = useRef(null);
  const revealFirstInvalid = useRevealFirstInvalid(formRef);

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

  const physicianOptions = activePhysicianOptions(physicians, STATIONS.THREE);

  // A form this desk has already finished is read-only: bounce a typed or
  // bookmarked URL to the Forms view rather than reopening the editable page.
  const formDone = useStationFormGuard(form, STATIONS.THREE);
  // Shows this form as in progress in every Station 3 queue.
  useMarkStationStarted(form, STATIONS.THREE);
  const selectedPhysician = findPhysician(physicians, physicianID);

  const {
    register, control, watch, setValue, handleSubmit, getValues,
    formState: { isDirty },
  } = useForm({
    defaultValues: restoredDraft?.values ?? DEFAULT_VALUES,
    // A year outside the patient's lifetime is flagged while it is typed, not
    // only once Sign and Complete is pressed.
    mode: 'onChange',
    // Focus is moved by revealFirstInvalid instead, in page order.
    shouldFocusError: false,
  });

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
        socialHistory: buildSocialHistory(values),
        recommendedDiagnosticTest: values.recommendedDiagnosticTest || null,
        impressionClinical: values.impressionClinical || null,
        managementTreatment: buildManagementTreatment(values),
        charges: buildCharges(values),
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
  // The redirect above fires from an effect, so skip one render rather than
  // briefly showing an editable form for work that is already signed.
  if (formDone) return <Skeleton />;

  const patient = form.patient;
  // Every "year started" / "year diagnosed" must fall within the patient's life
  // up to this visit; the server enforces the same range.
  const bounds = yearBounds(patient?.birthdate, visitYear(form));

  const handleReload = () => {
    setConflictOpen(false);
    queryClient.invalidateQueries({ queryKey: ['form', Number(formId)] });
  };

  const submitBlocker = !physicianID
    ? 'Select the attending physician.'
    : !signature && 'A signature is required before submitting.';

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit((values) => {
        // The picker is a submitted field, so it is validated here rather than
        // only leaned on through a disabled button.
        if (!physicianID) {
          setPhysicianError('Select the attending physician.');
          return;
        }
        mutation.mutate(values);
      }, () => {
        // The only field rules on this form are the year bounds.
        toast.error('Fix the highlighted year before submitting.');
        revealFirstInvalid();
      })}
    >
      <div className="flex flex-col gap-4 pb-4">
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          <div className="flex items-center gap-3 bg-linear-to-r from-[#e9fbf6] to-[#f3fdfb] p-4 tab:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#14a690] to-[#0e7d6b] text-lg font-bold text-white shadow-sm ring-4 ring-white tab:h-16 tab:w-16 tab:text-xl">
              {fullName(patient).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-ink-900">{fullName(patient)}</p>
              <p className="text-sm text-ink-500">Age {ageFrom(patient?.birthdate)} · {patient?.position} · {patient?.agencyOffice}</p>
            </div>
          </div>

          {/* Seven full-width tiles made a phone scroll a screen and a half
              before the first field, so below `tab` the short facts pair up
              (dense, so Contact No. fills the gap Address leaves) and every
              value wraps rather than truncates. */}
          <dl className="grid grid-cols-2 gap-2 p-3 max-tab:grid-flow-row-dense tab:gap-3 tab:p-4 xl:grid-cols-4">
            {PATIENT_FIELDS.map(({ key, label, icon: Icon, render, wide }) => (
              <div
                key={key}
                className={`flex items-start gap-2.5 rounded-lg border border-line bg-canvas p-2.5 tab:gap-3 tab:p-3 ${wide ? 'max-tab:col-span-2' : ''}`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#e9fbf6] text-[#0e7d6b]">
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</dt>
                  <dd className={`mt-0.5 text-sm font-medium text-ink-900 ${key === 'address' ? 'wrap-break-word' : 'truncate max-tab:whitespace-normal max-tab:wrap-break-word'}`}>
                    {render ? render(patient) : patient?.[key] || '—'}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <PriorStationsPanel form={form} categories={categories} />

        <FamilyHistorySection register={register} watch={watch} setValue={setValue} control={control} />
        <PastMedicalHistorySection control={control} register={register} yearBounds={bounds} />
        <SocialHistorySection control={control} watch={watch} yearBounds={bounds} />
        <AssessmentPlanSection register={register} watch={watch} setValue={setValue} control={control} />
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

      {/* On a phone the notes get a line of their own above the buttons --
          squeezed between them they wrapped a word per line -- and Back keeps
          only its arrow so Sign and Complete can take the rest of the row.
          From md up the wrappers dissolve (`contents`) back into one row. */}
      <div className="sticky bottom-0 z-10 -mx-4 grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2 border-t border-line bg-surface px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] md:flex md:justify-between md:gap-3">
        <Button type="button" variant="secondary" size="lg" onClick={() => navigate('/station3')}>
          <ArrowLeft size={16} strokeWidth={2.25} />
          <span className="max-md:sr-only">Back to Patient List</span>
        </Button>
        <div className="contents md:flex md:items-center md:gap-3">
          {(draftSavedAt || submitBlocker) && (
            <p className="order-first col-span-2 flex flex-wrap gap-x-3 gap-y-0.5 md:contents">
              {draftSavedAt && (
                <span className="text-xs text-ink-500">
                  Draft saved {formatDateTime(draftSavedAt)}
                </span>
              )}
              {submitBlocker && <span className="text-xs text-rose-600">{submitBlocker}</span>}
            </p>
          )}
          <Button
            type="submit"
            variant="teal"
            size="lg"
            className="max-md:w-full"
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
