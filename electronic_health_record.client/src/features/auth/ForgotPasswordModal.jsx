import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Mail, ShieldCheck, MailCheck } from 'lucide-react';
import { forgotPasswordSchema } from '../../lib/schemas';
import { delay } from '../../api/mock/delay';

// There is no real password-reset backend yet (no email column on any
// account table, no reset-token endpoint) -- login itself is still mock-only
// (see AUTH_USE_MOCK in api/auth.api.js). This modal is the UI-complete,
// backend-pending affordance: it mimics a request/confirmation round trip
// with the same fake delay the mock login uses, but never actually sends
// anything. Wire it to a real endpoint once one exists.
export default function ForgotPasswordModal({ open, onClose }) {
  const [step, setStep] = useState('request');

  const {
    register, handleSubmit, reset, formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: '' },
  });

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  // Close from any path (X, backdrop, "Back to login") lands the next open
  // back on the request step, whichever step it was left on.
  const handleClose = () => {
    onClose?.();
    setStep('request');
    reset();
  };

  const onSubmit = async () => {
    await delay(600);
    setStep('sent');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-title"
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink-500 transition hover:bg-gray-100 hover:text-ink-900"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>

        {step === 'request' ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-[#1fc8a8] to-[#0e7d6b] text-white">
              <ShieldCheck className="h-7 w-7" strokeWidth={1.5} />
            </div>

            <h2 id="forgot-password-title" className="mt-5 text-center text-2xl font-bold text-[#0e7d6b]">
              Forgot password?
            </h2>
            <p className="mt-1 text-center text-sm text-ink-500">
              Enter your username and we&apos;ll send reset instructions.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2 rounded-full bg-[#eef1fb] px-4 py-3">
                  <Mail className="h-4 w-4 shrink-0 text-ink-500" strokeWidth={1.5} />
                  <input
                    id="forgot-identifier"
                    autoComplete="username"
                    placeholder="Username or email"
                    autoFocus
                    className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-500"
                    {...register('identifier')}
                  />
                </div>
                {errors.identifier?.message && (
                  <p className="mt-1 pl-4 text-[11px] text-rose-600">{errors.identifier.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 h-12 w-full rounded-full bg-linear-to-r from-[#1fc8a8] to-[#14a690] text-sm font-semibold uppercase tracking-wide text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="text-center text-xs font-medium text-ink-500 transition hover:text-[#0e7d6b]"
              >
                Back to login
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-[#1fc8a8] to-[#0e7d6b] text-white">
              <MailCheck className="h-7 w-7" strokeWidth={1.5} />
            </div>

            <h2 id="forgot-password-title" className="mt-5 text-center text-2xl font-bold text-[#0e7d6b]">
              Check your inbox
            </h2>
            <p className="mt-1 text-center text-sm text-ink-500">
              If an account exists for that username, we&apos;ve sent reset instructions to its email.
            </p>

            <button
              type="button"
              onClick={handleClose}
              className="mt-6 h-12 w-full rounded-full bg-linear-to-r from-[#1fc8a8] to-[#14a690] text-sm font-semibold uppercase tracking-wide text-white transition hover:brightness-105"
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
