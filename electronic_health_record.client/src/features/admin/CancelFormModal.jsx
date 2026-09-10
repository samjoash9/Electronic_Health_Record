import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { fullName } from '../../lib/formatters';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';

/**
 * Confirms cancelling one form. Typing the form number is deliberate friction:
 * the forms list is a dense table and the rows look alike, so the id is the
 * only thing that proves the operator is cancelling the row they meant.
 */
export default function CancelFormModal({ form, onConfirm, onClose, isPending, error }) {
  // keyed on the form id by the caller, so opening a different row remounts
  // this and the two fields below start empty again
  const [reason, setReason] = useState('');
  const [typedId, setTypedId] = useState('');

  const idMatches = typedId.trim() === String(form.formID);
  const reasonValid = reason.trim().length >= 3;
  const canSubmit = idMatches && reasonValid && !isPending;

  return (
    <Modal
      open
      title="Cancel this form?"
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
            {isPending ? 'Cancelling…' : 'Cancel form'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-600" />
          <p className="text-sm text-rose-900">
            Form <strong>#{form.formID}</strong> for{' '}
            <strong>{fullName(form.patient) || 'this patient'}</strong> will be marked
            Cancelled and removed from every station queue. The record and its history
            are kept, and the cancellation is written to the activity log.
          </p>
        </div>

        <Field
          label="Reason for cancelling"
          htmlFor="cancel-reason"
          required
          hint="Recorded in the activity log."
        >
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Duplicate registration for this employee"
            maxLength={500}
            disabled={isPending}
          />
        </Field>

        <Field
          label={`Type ${form.formID} to confirm`}
          htmlFor="cancel-confirm-id"
          required
        >
          <Input
            id="cancel-confirm-id"
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
