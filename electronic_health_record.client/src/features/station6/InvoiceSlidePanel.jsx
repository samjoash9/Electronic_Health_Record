import { useState } from 'react';
import {
  X,
  CheckCircle2,
  Printer,
  ExternalLink,
  Building2,
  Calendar,
  Landmark,
  ArrowDownRight,
  AlertTriangle,
} from 'lucide-react';
import { peso } from '../../lib/formatters';
import ChargeLineItems from './ChargeLineItems';
import OverrideDialog from './OverrideDialog';
import { approveBilling } from '../../api/billing.api';

/**
 * Station 6's invoice detail. Unlike the mock this replaced, there is no
 * shared fund here (decision 1): every number below is this one patient's
 * own allotment, drawn from the invoice the server already computed.
 */
export default function InvoiceSlidePanel({ invoice, onClose, onApproved }) {
  const [overage, setOverage] = useState(null); // { totalCharged, allotment, overage } | null
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isPending = invoice.status === 'Pending';

  async function submitApproval(overrideReason) {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await approveBilling(invoice.formID, {
        rowVersion: invoice.rowVersion,
        overrideReason,
      });
      setOverage(null);
      onApproved(updated);
    } catch (err) {
      if (err.isOverage) {
        setOverage({ totalCharged: err.totalCharged, allotment: err.allotment, overage: err.overage });
      } else {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-300">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 flex h-full w-full max-w-xl flex-col bg-[#f4f6f8] shadow-2xl transition-transform duration-300 sm:rounded-l-3xl">
        <div className="flex items-start justify-between border-b border-gray-200/80 bg-white px-6 py-5 sm:rounded-tl-3xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">
                {new Date(invoice.formDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
              <span className="text-gray-300">•</span>
              <span className="font-mono text-xs font-semibold text-gray-500">FORM-{invoice.formID}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold tracking-tight text-gray-900">
                {peso(invoice.totalCharged)}
              </span>
              {!isPending ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 size={12} />
                  Deducted
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  Pending Deduction
                </span>
              )}
              {invoice.isOverBudget && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                  <AlertTriangle size={11} />
                  Over Budget
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close invoice panel"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between border-b border-gray-100 pb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 sm:text-xl">{invoice.patientName}</h2>
                <div className="mt-0.5 flex items-center gap-1 font-mono text-xs font-medium text-[#2f6fb5]">
                  <span>FORM-{invoice.formID}</span>
                  <ExternalLink size={12} />
                </div>
              </div>

              <div className="text-right">
                {invoice.agencyOffice && (
                  <div className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                    <Building2 size={12} className="text-gray-500" />
                    <span>{invoice.agencyOffice}</span>
                  </div>
                )}
                <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-gray-400">
                  <Calendar size={11} />
                  <span>{new Date(invoice.formDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <ChargeLineItems charges={invoice.charges} />
              {invoice.unpricedCount > 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  {invoice.unpricedCount} item{invoice.unpricedCount > 1 ? 's' : ''} still need a quoted price
                  and {invoice.unpricedCount > 1 ? 'are' : 'is'} excluded from the total below.
                </p>
              )}
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
              {isPending ? (
                <div className="space-y-3">
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Landmark size={14} className="text-gray-400" />
                        <span>Patient Allotment</span>
                      </span>
                      <span className="font-medium text-gray-800">{peso(invoice.allotment)}</span>
                    </div>

                    <div className="flex items-center justify-between text-rose-600">
                      <span className="flex items-center gap-1.5">
                        <ArrowDownRight size={14} />
                        <span>Less: Total Charged</span>
                      </span>
                      <span className="font-semibold">- {peso(invoice.totalCharged)}</span>
                    </div>
                  </div>

                  <div className={`rounded-xl border p-4 shadow-xs ${
                    invoice.isOverBudget
                      ? 'border-rose-300 bg-linear-to-r from-rose-50 via-rose-50/60 to-white'
                      : 'border-[#37AF9B]/40 bg-linear-to-r from-[#e6f7f4] via-[#f0faf8] to-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${invoice.isOverBudget ? 'text-rose-700' : 'text-[#0A594D]'}`}>
                          {invoice.isOverBudget ? 'Over Allotment By' : 'Remaining Allotment'}
                        </span>
                        <p className={`text-[11px] ${invoice.isOverBudget ? 'text-rose-600/80' : 'text-[#0A594D]/75'}`}>
                          {invoice.isOverBudget
                            ? 'Approving requires an override reason.'
                            : "Remaining balance after deducting this bill."}
                        </p>
                      </div>
                      <span className={`text-2xl font-black tracking-tight ${invoice.isOverBudget ? 'text-rose-700' : 'text-[#0A594D]'}`}>
                        {peso(Math.abs(invoice.remaining))}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Total Charged</span>
                    <span className="font-semibold text-gray-900">{peso(invoice.totalCharged)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Patient Allotment</span>
                    <span className="font-medium text-[#0A594D]">{peso(invoice.allotment)}</span>
                  </div>
                  {invoice.overrideReason && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
                      <span className="font-semibold">Override reason: </span>
                      {invoice.overrideReason}
                    </div>
                  )}
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-emerald-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-600" />
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wide">Processed & Deducted</span>
                        {invoice.approvedByAdminName && (
                          <p className="text-[11px] text-emerald-700">
                            Approved by {invoice.approvedByAdminName}
                            {invoice.approvedAt ? ` on ${new Date(invoice.approvedAt).toLocaleDateString('en-PH')}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex rounded-md bg-emerald-200/80 px-2.5 py-1 text-xs font-bold text-emerald-900">
                      Processed
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4 sm:rounded-bl-3xl">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 shadow-2xs transition hover:bg-gray-50"
          >
            <Printer size={15} />
            <span>Print Invoice</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              Cancel
            </button>

            {isPending ? (
              <button
                type="button"
                disabled={submitting}
                onClick={() => submitApproval(undefined)}
                className="flex items-center gap-2 rounded-xl bg-linear-to-r from-[#0A594D] to-[#37AF9B] px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 size={16} />
                <span>{submitting ? 'Approving…' : 'Approve & Deduct'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={15} />
                <span>Processed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {overage && (
        <OverrideDialog
          overage={overage}
          submitting={submitting}
          onCancel={() => setOverage(null)}
          onConfirm={(reason) => submitApproval(reason)}
        />
      )}
    </div>
  );
}
