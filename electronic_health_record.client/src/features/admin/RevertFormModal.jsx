import { useState } from 'react';
import { Undo2 } from 'lucide-react';
import { fullName } from '../../lib/formatters';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';

// What each station is called on the floor. Kept here rather than in
// lib/constants because this is the only screen that has to name a station as
// a destination -- everywhere else renders the status badge instead.
const STATION_LABEL = {
  1: 'Station 1 — Vitals',
  2: 'Station 2 — Assessment',
  3: 'Station 3 — Consultation',
  4: 'Station 4 — Dental',
  5: 'Station 5 — Vision',
};

/**
 * Confirms sending one form back to an earlier station.
 *
 * Unlike CancelFormModal this asks for no typed confirmation: a revert keeps
 * every value the stations captured and can be undone by walking the form
 * forward again, so the friction the destructive actions need would only be in
 * the way here. The reason is still required -- it is what the audit log shows
 * the station that lost the record.
 */
export default function RevertFormModal({ form, onConfirm, onClose, isPending, error }) {
  // Only stations the form has already passed. The server enforces this too
  // (a target at or ahead of the current station is a 400); offering just the
  // valid ones keeps the operator from discovering that by being refused.
  const targets = Object.keys(STATION_LABEL)
    .map(Number)
    .filter((station) => station < form.currentStation);

  // keyed on the form id by the caller, so opening a different row remounts
  // this and both fields start fresh
  const [targetStation, setTargetStation] = useState(String(targets.at(-1) ?? ''));
  const [reason, setReason] = useState('');

  const reasonValid = reason.trim().length >= 3;
  const canSubmit = Boolean(targetStation) && reasonValid && !isPending;

  return (
    <Modal
      open
      title="Send this form back?"
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
            Keep at Station {form.currentStation}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={!canSubmit}
            onClick={() => onConfirm({
              targetStation: Number(targetStation),
              reason: reason.trim(),
            })}
          >
            {isPending ? 'Sending back…' : 'Send back'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <Undo2 size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-900">
            Form <strong>#{form.formID}</strong> for{' '}
            <strong>{fullName(form.patient) || 'this patient'}</strong> leaves
            Station {form.currentStation} and re-enters the queue of the station you pick.
            Everything already recorded is kept — the station overwrites its own entries
            when it submits again. The change is written to the activity log.
          </p>
        </div>

        <Field
          label="Send back to"
          htmlFor="revert-target-station"
          required
        >
          <Select
            id="revert-target-station"
            value={targetStation}
            onChange={(e) => setTargetStation(e.target.value)}
            options={targets.map((station) => ({
              value: String(station),
              label: STATION_LABEL[station],
            }))}
            disabled={isPending}
          />
        </Field>

        <Field
          label="Reason for sending back"
          htmlFor="revert-reason"
          required
          hint="Recorded in the activity log."
        >
          <Textarea
            id="revert-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Consultation recorded against the wrong complaint"
            maxLength={500}
            disabled={isPending}
          />
        </Field>

        {error && <p className="text-sm font-medium text-rose-600">{error.message}</p>}
      </div>
    </Modal>
  );
}
