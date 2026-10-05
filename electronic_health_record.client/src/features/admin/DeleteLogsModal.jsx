import { AlertTriangle } from 'lucide-react';
import { formatDateTime } from '../../lib/formatters';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

/**
 * Confirms permanently deleting one or more audit log entries. Nothing
 * records the deletion, so the warning says so plainly.
 */
export default function DeleteLogsModal({ logs, actionLabel, onConfirm, onClose, isPending, error }) {
  const single = logs.length === 1 ? logs[0] : null;
  const noun = single ? 'this log entry' : `${logs.length} log entries`;

  return (
    <Modal
      open
      title={`Delete ${noun}?`}
      onClose={isPending ? undefined : onClose}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="mr-auto"
            onClick={onClose}
            disabled={isPending}
          >
            Keep
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-600" />
          <p className="text-sm text-rose-900">
            {single ? (
              <>
                <strong>{actionLabel(single.action)}</strong> by{' '}
                <strong>{single.actorName}</strong> on {formatDateTime(single.occurredAt)} will be
                permanently deleted.
              </>
            ) : (
              <>The <strong>{logs.length}</strong> selected entries will be permanently deleted.</>
            )}{' '}
            Nothing records the deletion, and it cannot be undone.
          </p>
        </div>

        {error && <p className="text-sm font-medium text-rose-600">{error.message}</p>}
      </div>
    </Modal>
  );
}
