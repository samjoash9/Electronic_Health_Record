import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { submitStation1 } from '../../api/forms.api';
import { hasPatientAccount } from '../../api/patients.api';
import { calculateBMI, IDEAL_BMI } from '../../lib/bmi';
import { station1Schema, newAccountUsernameSchema } from '../../lib/schemas';
import { DEFAULT_PATIENT_PASSWORD } from '../../lib/constants';
import { useAuth } from '../../auth/useAuth';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { useAutosaveDraft } from '../../hooks/useAutosaveDraft';
import { saveDraft, loadDraft, clearDraft } from '../../lib/station1Draft';
import EmployeeSearch from './EmployeeSearch';
import IdentityFields from './IdentityFields';
import VitalsFields from './VitalsFields';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import StationStepIndicator from '../../components/ui/StationStepIndicator';
import AccountCreatedModal from './AccountCreatedModal';

const BLANK_VITALS = {
  weightKg: '', heightCm: '', bpSystolic: '', bpDiastolic: '',
  tempCelsius: '', heartRate: '', respRate: '',
};

const BLANK_VALUES = {
  externalEmployeeId: '', surname: '', firstName: '', middleName: '',
  birthdate: '', sex: '', civilStatus: '', address: '',
  agencyOffice: '', position: '', contactNo: '', username: '',
  ...BLANK_VITALS,
};

const STEPS = ['Search Employee', 'Confirm Information', 'Vital Signs'];

export default function Station1Page() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  // Set only when the submission just provisioned a login, so the admin can read
  // the credentials out to the patient. Holds { username, patientName } rather
  // than a boolean because the form is reset before this renders.
  const [createdAccount, setCreatedAccount] = useState(null);
  // Mirrors mutation.isSuccess but updates synchronously, matching the
  // pattern in the later stations' submittedRef -- autosave must stop the
  // instant a submit succeeds so it can't resurrect a just-cleared draft.
  const submittedRef = useRef(false);

  // needsUsername is read from a ref, not the outer closure variable, because
  // this resolver is captured once by useForm and never recreated -- see
  // needsUsernameRef below.
  const needsUsernameRef = useRef(false);

  const debugResolver = async (values, context, options) => {
    console.log('[DEBUG] resolver values', values);
    try {
      const schema = needsUsernameRef.current
        ? station1Schema.and(newAccountUsernameSchema)
        : station1Schema;
      const base = zodResolver(schema);
      const result = await base(values, context, options);
      console.log('[DEBUG] resolver result', result);
      return result;
    } catch (err) {
      console.error('[DEBUG] resolver threw', err);
      throw err;
    }
  };

  const {
    register, handleSubmit, watch, reset, control, formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: debugResolver,
    defaultValues: BLANK_VALUES,
  });

  const hasSelectedEmployee = Boolean(watch('externalEmployeeId'));
  const unlockedUpTo = hasSelectedEmployee ? STEPS.length : 1;

  // Once an employee is picked, find out whether they already have a patient
  // portal account. If not, the admin must ask them for a desired username
  // (IdentityFields renders that field only in this case) -- there is no
  // auto-derived fallback any more.
  const externalEmployeeId = watch('externalEmployeeId');
  const { data: hasAccount } = useQuery({
    queryKey: ['patientHasAccount', externalEmployeeId],
    queryFn: () => hasPatientAccount(externalEmployeeId),
    enabled: hasSelectedEmployee,
  });
  const needsUsername = hasSelectedEmployee && hasAccount === false;
  needsUsernameRef.current = needsUsername;

  const mutation = useMutation({
    mutationFn: submitStation1,
    onSuccess: (form, variables) => {
      submittedRef.current = true;
      clearDraft(variables.patient.externalEmployeeId);
      toast.success('Submitted to Station 2.');
      queryClient.invalidateQueries({ queryKey: ['queue'] });

      // accountProvisioned is true only on the submission that created this
      // patient's login -- re-registering an existing patient has no credentials
      // to hand over. Captured before reset(), which clears the form values.
      if (form?.accountProvisioned && form?.patientAccount?.username) {
        setCreatedAccount({
          username: form.patientAccount.username,
          patientName: `${variables.patient.firstName} ${variables.patient.surname}`.trim(),
        });
      }

      // The Patients panel and the Employee Directory's Portal Account column
      // both read this, and a new registration has just changed it.
      queryClient.invalidateQueries({ queryKey: ['patient-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['patientHasAccount'] });

      reset(BLANK_VALUES);
      setStep(1);
      submittedRef.current = false;
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Autosaves a short idle period after any field or step changes, once an
  // employee is selected (nothing worth persisting exists before then).
  // Silent on success -- there is no "Draft saved ..." label on this page
  // to update, unlike station3/4/5.
  useAutosaveDraft(
    () => saveDraft(hasSelectedEmployee ? watch('externalEmployeeId') : null, { values: watch(), step }),
    { values: watch(), step },
    { stoppedRef: submittedRef },
  );

  const onSelectEmployee = (employee) => {
    // A draft from an earlier visit to this same employee (crash, reload,
    // or just navigating away) takes over instead of starting blank, the
    // same "restore on selection" shape station3/4/5 use at page load.
    const restoredDraft = loadDraft(employee.externalEmployeeId);
    if (restoredDraft) {
      reset(restoredDraft.values);
      setStep(restoredDraft.step ?? 2);
      toast.info('Restored your saved draft.');
    } else {
      reset({ ...employee, username: '', ...BLANK_VITALS });
      setStep(2);
    }
  };

  const onSubmit = (values) => {
    const {
      externalEmployeeId, surname, firstName, middleName, birthdate,
      sex, civilStatus, address, agencyOffice, position, contactNo, username,
      weightKg, heightCm, bpSystolic, bpDiastolic, tempCelsius, heartRate, respRate,
    } = values;

    mutation.mutate({
      adminID: user.id,
      patient: {
        externalEmployeeId, surname, firstName, middleName, birthdate,
        sex, civilStatus, address, agencyOffice, position, contactNo,
        // Only meaningful (and only validated as required) when needsUsername
        // was true -- omitted as '' otherwise, which the server ignores since
        // it only reads Username on the no-account-yet branch.
        username: needsUsername ? username : undefined,
      },
      vitals: {
        weightKg, heightCm, bpSystolic, bpDiastolic, tempCelsius, heartRate, respRate,
        bmi: calculateBMI(weightKg, heightCm),
        idealBMI: IDEAL_BMI,
      },
    });
  };

  const blocker = useUnsavedChangesGuard(isDirty && !mutation.isSuccess);

  const goToStep = (target) => {
    if (target <= unlockedUpTo) setStep(target);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mb-4 border border-gray-200 shadow-lg rounded-2xl flex flex-col bg-white">
      <Card>
        <StationStepIndicator
          steps={STEPS}
          current={step}
          unlockedUpTo={unlockedUpTo}
          onSelect={goToStep}
        />
      </Card>

      {step === 1 && <EmployeeSearch onSelect={onSelectEmployee} />}
      {step === 2 && (
        <IdentityFields
          register={register}
          watch={watch}
          control={control}
          errors={errors}
          needsUsername={needsUsername}
        />
      )}
      {step === 3 && <VitalsFields register={register} watch={watch} errors={errors} />}

      <div className="flex justify-between gap-2 rounded-lg bg-surface px-4 py-3">
        <div>
          {step > 1 && (
            <Button type="button" variant="secondary" size="lg" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {step > 1 && step < 3 && (
            <Button
              type="button"
              variant="teal"
              size="lg"
              disabled={!hasSelectedEmployee}
              onClick={() => setStep(step + 1)}
            >
              Next
            </Button>
          )}
          {step === 3 && (
            <>
              <Button type="button" variant="secondary" size="lg" onClick={() => setResetModalOpen(true)}>
                Reset
              </Button>
              <Button type="submit" variant="teal" size="lg" disabled={isSubmitting || mutation.isPending}>
                {mutation.isPending ? 'Submitting…' : 'Submit to Station 2'}
              </Button>
            </>
          )}
        </div>
      </div>

      {createdAccount && (
        <AccountCreatedModal
          username={createdAccount.username}
          patientName={createdAccount.patientName}
          defaultPassword={DEFAULT_PATIENT_PASSWORD}
          onClose={() => setCreatedAccount(null)}
        />
      )}

      <Modal
        open={blocker.state === 'blocked'}
        title="Discard unsaved changes?"
        size="lg"
        onClose={() => blocker.reset?.()}
        footer={
          <>
            <Button type="button" variant="secondary" size="lg" onClick={() => blocker.reset?.()}>
              Keep editing
            </Button>
            <Button type="button" variant="danger" size="lg" onClick={() => blocker.proceed?.()}>
              Discard changes
            </Button>
          </>
        }
      >
        This registration has not been submitted yet. Leaving now will discard what you&apos;ve entered.
      </Modal>

      <Modal
        open={resetModalOpen}
        title="Reset progress?"
        size="lg"
        onClose={() => setResetModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" size="lg" onClick={() => setResetModalOpen(false)}>
              Back
            </Button>
            <Button
              type="button"
              variant="danger"
              size="lg"
              onClick={() => {
                if (hasSelectedEmployee) clearDraft(watch('externalEmployeeId'));
                reset(BLANK_VALUES);
                setStep(1);
                setResetModalOpen(false);
              }}
            >
              Reset Progress
            </Button>
          </>
        }
      >
        This will clear everything you&apos;ve entered and take you back to the first step. This cannot be undone.
      </Modal>
    </form>
  );
}
