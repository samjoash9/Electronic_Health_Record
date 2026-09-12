import { AtSign, KeyRound } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

/**
 * Shown once, straight after the Station 1 submission that provisioned a
 * patient's portal login — the only moment the admin has both the username they
 * agreed with the patient and the default password in front of them.
 *
 * Deliberately a modal rather than a toast: the admin has to read these out to
 * the patient, which takes longer than a toast stays up.
 */
export default function AccountCreatedModal({ username, patientName, defaultPassword, onClose }) {
  return (
    <Modal
      open
      size="lg"
      title="Patient account created"
      onClose={onClose}
      footer={
        <Button type="button" variant="teal" size="lg" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-600">
          {patientName} can now sign in to the patient portal. Give them these details — the
          password must be changed on their first sign-in.
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#e9fbf6] text-[#0e7d6b]">
              <AtSign size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Username</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-ink-900">{username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#e9fbf6] text-[#0e7d6b]">
              <KeyRound size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                Temporary password
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-ink-900">{defaultPassword}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-ink-500">
          The username cannot be changed later. You can look it up again under Onboarding →
          Patients.
        </p>
      </div>
    </Modal>
  );
}
