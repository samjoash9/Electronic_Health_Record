import { useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil } from 'lucide-react';
import { listPhysicians } from '../../api/onboarding.api';
import { useWellnessForm } from '../../hooks/useWellnessForm';
import { useEditForm } from '../../hooks/useEditForm';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { FORM_STATUS } from '../../lib/constants';
import { fullName, ageFrom } from '../../lib/formatters';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import FormEditPanel from './FormEditPanel';

const STATUS_LABEL = {
  [FORM_STATUS.PENDING_ASSESSMENT]: 'Pending Assessment',
  [FORM_STATUS.PENDING_CONSULTATION]: 'Pending Consultation',
  [FORM_STATUS.PENDING_DENTAL]: 'Pending Dental',
  [FORM_STATUS.PENDING_VISION]: 'Pending Vision',
  [FORM_STATUS.COMPLETED]: 'Completed',
  [FORM_STATUS.CANCELLED]: 'Cancelled',
};

const STATUS_TONE = {
  [FORM_STATUS.PENDING_ASSESSMENT]: 'info',
  [FORM_STATUS.PENDING_CONSULTATION]: 'warn',
  [FORM_STATUS.PENDING_DENTAL]: 'warn',
  [FORM_STATUS.PENDING_VISION]: 'warn',
  [FORM_STATUS.COMPLETED]: 'success',
  [FORM_STATUS.CANCELLED]: 'danger',
};

/**
 * Superadmin correction of one form, on its own route.
 *
 * Deliberately a page rather than a panel under the read-only detail view: a
 * correction is a distinct act with its own exit (back, browser back, or a
 * saved change), and running it on its own URL means the browser's own history
 * matches what the operator sees. The record stays one click away at
 * /forms/:formId, so nothing is lost by not rendering it underneath.
 *
 * The identity strip is the detail page's header, minus the field grid: enough
 * to confirm whose record this is while editing, without reprinting values the
 * editor below is about to show as inputs.
 */
export default function FormEditPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { data: form, isLoading, error, refetch } = useWellnessForm(formId);

  const { data: physicians } = useQuery({
    queryKey: ['physicians'],
    queryFn: listPhysicians,
  });

  const editMutation = useEditForm(formId);

  // Read synchronously by the navigation blocker, so it has to be a ref: a
  // state update would still be the previous render's value when the router
  // evaluates the predicate in the same tick as a keystroke-then-navigate.
  const isDirtyRef = useRef(false);
  const handleDirtyChange = useCallback((dirty) => { isDirtyRef.current = dirty; }, []);

  const blocker = useUnsavedChangesGuard(() => isDirtyRef.current);

  const backToRecord = () => navigate(`/forms/${formId}`);

  const handleSave = ({ changes, reason }) => {
    editMutation.mutate(
      { changes, reason, rowVersion: form.rowVersion },
      {
        onSuccess: () => {
          // Saved is no longer dirty, and the flag is cleared here rather than
          // waiting for the panel's next render: navigate() runs in this same
          // tick, and the blocker would otherwise stop the operator leaving a
          // change they just committed.
          isDirtyRef.current = false;
          backToRecord();
        },
      }
    );
  };

  const handleDiscardAndLeave = () => {
    isDirtyRef.current = false;
    blocker.proceed?.();
  };

  const backButton = (
    <Button
      type="button"
      variant="secondary"
      size="md"
      className="self-start"
      onClick={backToRecord}
    >
      <ArrowLeft size={16} strokeWidth={2.25} />
      Back to record
    </Button>
  );

  if (isLoading || error) {
    return (
      <div className="flex flex-col gap-3 pb-6">
        {backButton}
        {isLoading ? <Skeleton /> : <ErrorState error={error} onRetry={refetch} />}
      </div>
    );
  }

  const patient = form.patient;

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex flex-wrap items-center gap-3">
        {backButton}
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <div className="flex items-center gap-4 bg-linear-to-r from-[#e9fbf6] to-[#f3fdfb] p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#14a690] to-[#0e7d6b] text-lg font-bold text-white shadow-sm ring-4 ring-white">
            {fullName(patient).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-[#0e7d6b] uppercase">
              <Pencil size={12} strokeWidth={2.5} />
              Editing form #{form.formID}
            </p>
            <p className="truncate text-lg font-semibold text-ink-900">{fullName(patient)}</p>
            <p className="truncate text-sm text-ink-500">
              Age {ageFrom(patient?.birthdate)} · {patient?.position} · {patient?.agencyOffice}
            </p>
          </div>
          <Badge tone={STATUS_TONE[form.status]}>{STATUS_LABEL[form.status] ?? form.status}</Badge>
        </div>
      </div>

      <FormEditPanel
        // Remounts when the server hands back a new row version, so a saved
        // edit leaves the draft holding the persisted values rather than the
        // ones the operator started from.
        key={form.rowVersion}
        form={form}
        physicians={(physicians ?? []).filter((p) => p.isActive)}
        onSave={handleSave}
        onCancel={backToRecord}
        onDirtyChange={handleDirtyChange}
        isPending={editMutation.isPending}
        error={editMutation.error}
      />

      <Modal
        open={blocker.state === 'blocked'}
        title="Leave without saving?"
        size="lg"
        onClose={() => blocker.reset?.()}
        footer={
          <>
            {/* mr-auto pins this to the far left of the footer's justify-end
                row, keeping the leave action on the right. */}
            <Button type="button" variant="secondary" size="lg" className="mr-auto" onClick={() => blocker.reset?.()}>
              Keep editing
            </Button>
            <Button type="button" variant="danger" size="lg" onClick={handleDiscardAndLeave}>
              Discard changes
            </Button>
          </>
        }
      >
        This correction has not been saved. Leaving now discards it — nothing is
        written to the record or to the activity log.
      </Modal>
    </div>
  );
}
