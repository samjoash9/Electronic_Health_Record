import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { fullName } from '../../lib/formatters';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';

/**
 * Confirms permanently deleting one form. Typing the form number is
 * deliberate friction, same as CancelFormModal -- except there is no undo
 * here: the form, its answers, and its own audit log are gone for good.
 */
export default function DeleteFormModal({ form, onConfirm, onClose, isPending, error }) {
  const [reason, setReason] = useState('');
  const [typedId, setTypedId] = useState('');

  const idMatches = typedId.trim() === String(form.formID);
  const reasonValid = reason.trim().length >= 3;
  const canSubmit = idMatches && reasonValid && !isPending;

  return (
    <Modal
      open
      title="Permanently delete this form?"
      size="lg"
      onClose={isPending ? undefined : onClose}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="mr-auto"
            onClick={onClose}
            disabled={isPending}
          >
            Keep form
          </Button>
          <Button
            type="button"
            variant="danger"
            size="lg"
            disabled={!canSubmit}
            onClick={() => onConfirm({ reason: reason.trim() })}
          >
            {isPending ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-600" />
          <p className="text-sm text-rose-900">
            Form <strong>#{form.formID}</strong> for{' '}
            <strong>{fullName(form.patient) || 'this patient'}</strong> and every answer,
            assessment, and audit entry attached to it will be permanently deleted.
            This cannot be undone. If you only need it out of the queues, use{' '}
            <strong>Cancel</strong> instead.
          </p>
        </div>

        <Field
          label="Reason for deleting"
          htmlFor="delete-reason"
          required
          hint="Written to the server log -- this is the only record of the deletion once the form's own audit trail is gone."
        >
          <Textarea
            id="delete-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Test record created by mistake"
            maxLength={500}
            disabled={isPending}
          />
        </Field>

        <Field
          label={`Type ${form.formID} to confirm`}
          htmlFor="delete-confirm-id"
          required
        >
          <Input
            id="delete-confirm-id"
            value={typedId}
            onChange={(e) => setTypedId(e.target.value)}
            placeholder={String(form.formID)}
            autoComplete="off"
            disabled={isPending}
          />
        </Field>

        {error && <p className="text-sm font-medium text-rose-600">{error.message}</p>}
      </div>
    </Modal>
  );
}
