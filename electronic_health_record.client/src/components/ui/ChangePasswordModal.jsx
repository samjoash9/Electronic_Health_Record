import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { toast } from 'react-toastify';
import { changePasswordSchema } from '../../lib/schemas';
import Modal from './Modal';
import Button from './Button';
import Field from './Field';
import Input from './Input';

const BLANK_VALUES = { currentPassword: '', newPassword: '', confirmPassword: '' };

function PasswordField({ id, label, register, error, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} htmlFor={id} error={error}>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className="pr-10"
          error={Boolean(error)}
          {...register}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          title={visible ? 'Hide password' : 'Show password'}
          className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-500 transition hover:bg-gray-100 hover:text-ink-900"
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </Field>
  );
}

export default function ChangePasswordModal({ open, onClose }) {
  const {
    register, handleSubmit, reset, formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: BLANK_VALUES,
  });

  const handleClose = () => {
    reset(BLANK_VALUES);
    onClose();
  };

  const onSubmit = async () => {
    // Not implemented yet: no auth endpoint exists for this.
    toast.info('Change password is not implemented yet.');
    handleClose();
  };

  return (
    <Modal
      open={open}
      title="Change Password"
      size="lg"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="secondary" size="lg" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="change-password-form" variant="teal" size="lg" disabled={isSubmitting}>
            Change Password
          </Button>
        </>
      }
    >
      <form id="change-password-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-lg bg-[#f3fdfb] p-3 text-sm text-[#0e7d6b]">
          <KeyRound size={18} className="shrink-0" />
          Choose a new password with at least 8 characters.
        </div>

        <PasswordField
          id="currentPassword"
          label="Current Password"
          register={register('currentPassword')}
          error={errors.currentPassword?.message}
          autoComplete="current-password"
        />
        <PasswordField
          id="newPassword"
          label="New Password"
          register={register('newPassword')}
          error={errors.newPassword?.message}
          autoComplete="new-password"
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm New Password"
          register={register('confirmPassword')}
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
        />
      </form>
    </Modal>
  );
}
