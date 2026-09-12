import { LogOut } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

/**
 * Confirms signing out. Same shape as the station pages' "Leave without
 * submitting?" prompt -- lg modal, cancel pinned left with mr-auto, danger
 * button for the action that loses work.
 */
export default function SignOutModal({ open, onConfirm, onClose, pending = false }) {
  return (
    <Modal
      open={open}
      title="Log out?"
      size="lg"
      // Not dismissable mid-request: closing here would leave the sign-out
      // running with no way to see it finish.
      onClose={pending ? undefined : onClose}
      footer={
        <>
          {/* mr-auto pins Cancel to the far left of the footer's justify-end
              row, keeping the leave action on the right. */}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="mr-auto"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="button" variant="danger" size="lg" onClick={onConfirm} disabled={pending}>
            <LogOut size={16} strokeWidth={2.25} />
            {pending ? 'Logging out…' : 'Log Out'}
          </Button>
        </>
      }
    >
      You will be returned to the login screen. Any unsaved work on this screen
      will be lost.
    </Modal>
  );
}
