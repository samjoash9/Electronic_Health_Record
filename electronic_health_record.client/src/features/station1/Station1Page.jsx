import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { submitStation1 } from '../../api/forms.api';
import { calculateBMI, IDEAL_BMI } from '../../lib/bmi';
import { station1Schema } from '../../lib/schemas';
import { useAuth } from '../../auth/useAuth';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import EmployeeSearch from './EmployeeSearch';
import IdentityFields from './IdentityFields';
import VitalsFields from './VitalsFields';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import StationStepIndicator from '../../components/ui/StationStepIndicator';

const BLANK_VITALS = {
  weightKg: '', heightCm: '', bpSystolic: '', bpDiastolic: '',
  tempCelsius: '', heartRate: '', respRate: '',
};

const BLANK_VALUES = {
  externalEmployeeId: '', surname: '', firstName: '', middleName: '',
  birthdate: '', sex: '', civilStatus: '', address: '',
  agencyOffice: '', position: '', contactNo: '',
  ...BLANK_VITALS,
};

const STEPS = ['Search Employee', 'Confirm Information', 'Vital Signs'];

export default function Station1Page() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const debugResolver = async (values, context, options) => {
    console.log('[DEBUG] resolver values', values);
    try {
      const base = zodResolver(station1Schema);
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

  const mutation = useMutation({
    mutationFn: submitStation1,
    onSuccess: () => {
      toast.success('Submitted to Station 2.');
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      reset(BLANK_VALUES);
      setStep(1);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSelectEmployee = (employee) => {
    reset({ ...employee, ...BLANK_VITALS });
    setStep(2);
  };

  const onSubmit = (values) => {
    const {
      externalEmployeeId, surname, firstName, middleName, birthdate,
      sex, civilStatus, address, agencyOffice, position, contactNo,
      weightKg, heightCm, bpSystolic, bpDiastolic, tempCelsius, heartRate, respRate,
    } = values;

    mutation.mutate({
      adminID: user.id,
      patient: {
        externalEmployeeId, surname, firstName, middleName, birthdate,
        sex, civilStatus, address, agencyOffice, position, contactNo,
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
      {step === 2 && <IdentityFields register={register} watch={watch} control={control} />}
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
