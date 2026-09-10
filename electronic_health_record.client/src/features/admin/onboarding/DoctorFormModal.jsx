import { useForm } from 'react-hook-form';
import { KeyRound } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Field from '../../../components/ui/Field';
import Input from '../../../components/ui/Input';

/**
 * Register or edit a doctor. On registration the admin also sets the username
 * and the password they will hand over; editing leaves credentials alone, so
 * the account keeps working and a password change goes through Reset password.
 */
export default function DoctorFormModal({ doctor, isPending, error, onSubmit, onClose }) {
  const editing = Boolean(doctor);

  const {
    register, handleSubmit, formState: { errors },
  } = useForm({
    defaultValues: {
      surname: doctor?.surname ?? '',
      firstName: doctor?.firstName ?? '',
      middleName: doctor?.middleName ?? '',
      prcLicenseNo: doctor?.prcLicenseNo ?? '',
      contactNo: doctor?.contactNo ?? '',
      username: doctor?.username ?? '',
      password: '',
    },
  });

  return (
    <Modal
      open
      size="lg"
      title={editing ? `Edit Dr. ${doctor.firstName} ${doctor.surname}` : 'Register a Doctor'}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="doctor-form"
            variant="teal"
            size="md"
            disabled={isPending}
          >
            {isPending ? 'Saving…' : editing ? 'Save changes' : 'Register doctor'}
          </Button>
        </>
      }
    >
      <form id="doctor-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Field label="Surname" htmlFor="doctor-surname" required error={errors.surname?.message}>
            <Input
              id="doctor-surname"
              error={Boolean(errors.surname)}
              {...register('surname', { required: 'Surname is required.' })}
            />
          </Field>
          <Field label="First Name" htmlFor="doctor-firstName" required error={errors.firstName?.message}>
            <Input
              id="doctor-firstName"
              error={Boolean(errors.firstName)}
              {...register('firstName', { required: 'First name is required.' })}
            />
          </Field>
          <Field label="Middle Name" htmlFor="doctor-middleName">
            <Input id="doctor-middleName" {...register('middleName')} />
          </Field>

          <Field
            label="PRC License No."
            htmlFor="doctor-prc"
            required
            error={errors.prcLicenseNo?.message}
          >
            <Input
              id="doctor-prc"
              error={Boolean(errors.prcLicenseNo)}
              {...register('prcLicenseNo', { required: 'PRC License No. is required.' })}
            />
          </Field>
          <Field label="Contact No." htmlFor="doctor-contact" className="sm:col-span-2">
            <Input id="doctor-contact" {...register('contactNo')} />
          </Field>
        </div>

        <div className="rounded-xl border border-line bg-canvas p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-ink-700 uppercase">
            <KeyRound size={14} className="text-[#0e7d6b]" />
            Sign-in credentials
          </p>

          {editing ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Username" hint="Usernames cannot be changed after registration.">
                <Input value={doctor.username} disabled readOnly />
              </Field>
              <Field label="Password" hint="Use Reset password to issue a new one.">
                <Input value="••••••••" disabled readOnly />
              </Field>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field
                label="Username"
                htmlFor="doctor-username"
                required
                error={errors.username?.message}
              >
                <Input
                  id="doctor-username"
                  autoComplete="off"
                  error={Boolean(errors.username)}
                  {...register('username', { required: 'Username is required.' })}
                />
              </Field>
              <Field
                label="Temporary Password"
                htmlFor="doctor-password"
                required
                hint="The doctor is asked to change this the first time they sign in."
                error={errors.password?.message}
              >
                <Input
                  id="doctor-password"
                  type="text"
                  autoComplete="off"
                  error={Boolean(errors.password)}
                  {...register('password', {
                    required: 'A temporary password is required.',
                    minLength: { value: 8, message: 'Use at least 8 characters.' },
                  })}
                />
              </Field>
            </div>
          )}
        </div>

        {error && <p className="text-sm font-medium text-rose-600">{error.message}</p>}
      </form>
    </Modal>
  );
}
