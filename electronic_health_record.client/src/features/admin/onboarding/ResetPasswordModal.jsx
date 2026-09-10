import { useForm } from 'react-hook-form';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Field from '../../../components/ui/Field';
import Input from '../../../components/ui/Input';

/**
 * Issues a replacement temporary password. The doctor is put back on a forced
 * change, so a password read out over the phone cannot stay in place.
 */
export default function ResetPasswordModal({ doctor, isPending, error, onSubmit, onClose }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { password: '' },
  });

  return (
    <Modal
      open
      title={`Reset password — Dr. ${doctor.firstName} ${doctor.surname}`}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="reset-password-form" variant="teal" size="md" disabled={isPending}>
            {isPending ? 'Resetting…' : 'Issue password'}
          </Button>
        </>
      }
    >
      <form
        id="reset-password-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <p className="text-sm text-ink-600">
          The current password stops working immediately. Hand the new one over directly —
          Dr. {doctor.surname} is asked to change it at the next sign-in.
        </p>

        <Field
          label="New Temporary Password"
          htmlFor="reset-password"
          required
          error={errors.password?.message}
        >
          <Input
            id="reset-password"
            type="text"
            autoComplete="off"
            error={Boolean(errors.password)}
            {...register('password', {
              required: 'A temporary password is required.',
              minLength: { value: 8, message: 'Use at least 8 characters.' },
            })}
          />
        </Field>

        {error && <p className="text-sm font-medium text-rose-600">{error.message}</p>}
      </form>
    </Modal>
  );
}
