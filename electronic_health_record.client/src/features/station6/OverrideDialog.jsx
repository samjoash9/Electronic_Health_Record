import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { peso } from '../../lib/formatters';

/**
 * Decision 3 (warn, then allow): shown when approve comes back 409 with an
 * overage. Taking a reason here is what turns the resubmit into a deliberate
 * override rather than a second blind attempt -- the server refuses to
 * deduct past the allotment without one (see ApproveAndDeduct rule 3).
 */
export default function OverrideDialog({ overage, onCancel, onConfirm, submitting }) {
  const [reason, setReason] = useState('');
  const canSubmit = reason.trim().length > 0 && !submitting;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900">This bill exceeds the allotment</h3>
            <p className="mt-1 text-sm text-gray-500">
              Approving anyway will deduct the full amount and flag this record as over budget.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Total charged</span>
            <span className="font-semibold text-gray-900">{peso(overage.totalCharged)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Allotment</span>
            <span className="font-medium text-gray-700">{peso(overage.allotment)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-amber-200 pt-2">
            <span className="font-semibold text-amber-800">Exceeds by</span>
            <span className="text-base font-extrabold text-amber-700">{peso(overage.overage)}</span>
          </div>
        </div>

        <label htmlFor="override-reason" className="mt-4 block text-xs font-semibold text-gray-600">
          Reason for override <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="override-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={200}
          rows={3}
          placeholder="e.g. Emergency medication, approved by department head"
          className="mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
        />

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onConfirm(reason.trim())}
            className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Approving…' : 'Approve Anyway'}
          </button>
        </div>
      </div>
    </div>
  );
}
