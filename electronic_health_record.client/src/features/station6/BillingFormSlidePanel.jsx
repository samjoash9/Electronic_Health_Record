import { useState } from 'react';
import {
  X,
  Printer,
  Building2,
  Calendar,
  Landmark,
  ArrowDownRight,
  AlertTriangle,
  ChevronDown,
  Users,
  Pencil,
} from 'lucide-react';
import { peso } from '../../lib/formatters';
import ChargeLineItems from './ChargeLineItems';

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

/**
 * One employee's consumption inside the period, collapsed by default: a
 * month-long period can cover dozens of people, and the question this panel
 * answers first is "who consumed the budget", not "which exact tests".
 */
function PatientRow({ patient }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-xs">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50/70"
      >
        <div className="min-w-0">
          <div className="truncate font-semibold text-gray-900">{patient.patientName}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
            {patient.agencyOffice && (
              <span className="inline-flex items-center gap-1">
                <Building2 size={11} className="text-gray-400" />
                {patient.agencyOffice}
              </span>
            )}
            <span>
              {patient.formCount} visit{patient.formCount === 1 ? '' : 's'}
              {' · '}
              {patient.itemCount} item{patient.itemCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="font-semibold text-gray-900">{peso(patient.subtotal)}</span>
          <ChevronDown
            size={15}
            className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-gray-100 px-4 py-4">
          {patient.visits.map((visit) => (
            <div key={visit.formID}>
              <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#0A594D]">
                  FORM-{visit.formID}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar size={11} />
                  {formatDate(visit.formDate)}
                </span>
              </div>
              <ChargeLineItems charges={visit.charges} />
            </div>
          ))}

          {patient.unpricedCount > 0 && (
            <p className="text-xs text-amber-600">
              {patient.unpricedCount} item{patient.unpricedCount > 1 ? 's' : ''} still
              {patient.unpricedCount > 1 ? ' need' : ' needs'} a quoted price and
              {patient.unpricedCount > 1 ? ' are' : ' is'} excluded from this subtotal.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * A billing period's detail: the capital, what has been drawn against it, and
 * every employee whose labs and medications did the drawing.
 *
 * There is no approve action anywhere here. Charges consume the period's
 * capital the moment Station 3 records them, so this panel reports rather than
 * decides -- over budget is shown, never blocked.
 */
export default function BillingFormSlidePanel({ detail, onClose, onEdit }) {
  const isOverBudget = detail.isOverBudget;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-300">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 flex h-full w-full max-w-xl flex-col bg-[#f4f6f8] shadow-2xl transition-transform duration-300 sm:rounded-l-3xl">
        <div className="flex items-start justify-between border-b border-gray-200/80 bg-white px-6 py-5 sm:rounded-tl-3xl">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <Calendar size={12} className="text-gray-400" />
              <span>
                {formatDate(detail.startDate)} – {formatDate(detail.endDate)}
              </span>
            </div>
            <h2 className="mt-1 truncate text-xl font-extrabold tracking-tight text-gray-900">
              {detail.title}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                <Users size={11} className="text-gray-500" />
                {detail.patients.length} employee{detail.patients.length === 1 ? '' : 's'}
              </span>
              {isOverBudget && (
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
            aria-label="Close billing period panel"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Landmark size={14} className="text-gray-400" />
                  <span>Capital Allocation</span>
                </span>
                <span className="font-medium text-gray-800">{peso(detail.capital)}</span>
              </div>

              <div className="flex items-center justify-between text-rose-600">
                <span className="flex items-center gap-1.5">
                  <ArrowDownRight size={14} />
                  <span>Less: Labs &amp; Medications</span>
                </span>
                <span className="font-semibold">- {peso(detail.consumed)}</span>
              </div>
            </div>

            <div className={`mt-3 rounded-xl border p-4 shadow-xs ${
              isOverBudget
                ? 'border-rose-300 bg-linear-to-r from-rose-50 via-rose-50/60 to-white'
                : 'border-[#37AF9B]/40 bg-linear-to-r from-[#e6f7f4] via-[#f0faf8] to-white'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${isOverBudget ? 'text-rose-700' : 'text-[#0A594D]'}`}>
                    {isOverBudget ? 'Over Capital By' : 'Remaining Capital'}
                  </span>
                  <p className={`text-[11px] ${isOverBudget ? 'text-rose-600/80' : 'text-[#0A594D]/75'}`}>
                    {isOverBudget
                      ? 'Charges in this period exceed its allocation.'
                      : 'Still available for visits dated in this period.'}
                  </p>
                </div>
                <span className={`text-2xl font-black tracking-tight ${isOverBudget ? 'text-rose-700' : 'text-[#0A594D]'}`}>
                  {peso(Math.abs(detail.remaining))}
                </span>
              </div>
            </div>

            {detail.unpricedCount > 0 && (
              <p className="mt-3 text-xs text-amber-600">
                {detail.unpricedCount} item{detail.unpricedCount > 1 ? 's' : ''} across this period
                {detail.unpricedCount > 1 ? ' have' : ' has'} no quoted price and
                {detail.unpricedCount > 1 ? ' are' : ' is'} excluded from the consumed total.
              </p>
            )}
          </div>

          <div>
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Employees Covered
            </h3>

            {detail.patients.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center">
                <p className="text-sm font-medium text-gray-600">No charges in this period yet</p>
                <p className="mt-1 text-xs text-gray-400">
                  Labs and medications recorded at Station 3 for visits dated
                  {' '}{formatDate(detail.startDate)} – {formatDate(detail.endDate)} will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {detail.patients.map((patient) => (
                  <PatientRow key={patient.patientID} patient={patient} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4 sm:rounded-bl-3xl">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 shadow-2xs transition hover:bg-gray-50"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              Close
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-2 rounded-xl bg-linear-to-r from-[#0A594D] to-[#37AF9B] px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:opacity-95 active:scale-[0.98]"
            >
              <Pencil size={14} />
              <span>Edit Period</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
