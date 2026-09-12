import { useForm } from 'react-hook-form';
import { KeyRound } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Field from '../../../components/ui/Field';
import Input from '../../../components/ui/Input';

/**
 * Register a station admin. Unlike DoctorFormModal there is no password field:
 * the server issues the temporary password itself and returns it once, so the
 * superadmin reads it off the confirmation rather than choosing it here.
 *
 * Create-only by design. Editing an existing admin's details is not part of
 * the server's account-provisioning endpoint.
 */
export default function AdminFormModal({ isPending, error, onSubmit, onClose }) {
  const {
    register, handleSubmit, formState: { errors },
  } = useForm({
    defaultValues: { username: '', fullName: '', contactNo: '' },
    // Submit-only validation: react-hook-form otherwise re-runs the rules on
    // every keystroke once a submit has failed.
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  return (
    <Modal
      open
      size="lg"
      title="Register an Admin"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="admin-form"
            variant="teal"
            size="md"
            disabled={isPending}
          >
            {isPending ? 'Saving…' : 'Register admin'}
          </Button>
        </>
      }
    >
      <form id="admin-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Field
            label="Full Name"
            htmlFor="admin-fullName"
            required
            error={errors.fullName?.message}
          >
            <Input
              id="admin-fullName"
              error={Boolean(errors.fullName)}
              {...register('fullName', { required: 'Full name is required.' })}
            />
          </Field>
          <Field label="Contact No." htmlFor="admin-contact">
            <Input
              id="admin-contact"
              inputMode="numeric"
              {...register('contactNo', {
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\D/g, '');
                },
              })}
            />
          </Field>
        </div>

        <div className="rounded-xl border border-line bg-canvas p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-ink-700 uppercase">
            <KeyRound size={14} className="text-[#0e7d6b]" />
            Sign-in credentials
          </p>

          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field
              label="Username"
              htmlFor="admin-username"
              required
              hint="Cannot be changed after registration."
              error={errors.username?.message}
            >
              <Input
                id="admin-username"
                autoComplete="off"
                error={Boolean(errors.username)}
                {...register('username', { required: 'Username is required.' })}
              />
            </Field>
            <Field
              label="Temporary Password"
              hint="Issued by the server and shown once after registration."
            >
              <Input value="Set automatically" disabled readOnly />
            </Field>
          </div>
        </div>

        <p className="text-sm text-ink-500">
          The new account works stations 1 and 2. Only a superadmin can create
          another admin, and the account is asked to change its password the
          first time it signs in.
        </p>

        {error && <p className="text-sm font-medium text-rose-600">{error.message}</p>}
      </form>
    </Modal>
  );
}
