import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Search,
  ExternalLink,
  ShieldCheck,
  Building2,
  AlertCircle,
  AlertTriangle,
  Landmark,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { peso } from '../../lib/formatters';
import { getBillingQueue, getBillingSettings, updateBillingSettings, getInvoice } from '../../api/billing.api';
import InvoiceSlidePanel from './InvoiceSlidePanel';

/**
 * Station 6. Every patient carries their own allotment for a visit (decision
 * 1) -- there is no shared fund here, unlike the mock this replaced, so the
 * summary cards report on the queue and the configured default rather than
 * on a pool balance that no longer exists.
 *
 * Data loading goes through react-query (as every other list screen does --
 * see AdminsPanel), not a raw useEffect fetch: query keys carry the
 * search/filter state, so refetching on a change is automatic and there is
 * no manual loading/error state to hand-roll.
 */
export default function Station6BillingPage() {
  const queryClient = useQueryClient();
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingAllotment, setEditingAllotment] = useState(false);
  const [allotmentInput, setAllotmentInput] = useState('');
  const [savingAllotment, setSavingAllotment] = useState(false);
  const [actionError, setActionError] = useState(null);

  const {
    data: queueData,
    isLoading: queueLoading,
    error: queueError,
  } = useQuery({
    queryKey: ['billing', 'queue', statusFilter, searchQuery],
    queryFn: () => getBillingQueue({ status: statusFilter, q: searchQuery }),
  });

  const { data: settings } = useQuery({
    queryKey: ['billing', 'settings'],
    queryFn: getBillingSettings,
  });

  const {
    data: invoice,
    error: invoiceError,
  } = useQuery({
    queryKey: ['billing', 'invoice', selectedFormId],
    queryFn: () => getInvoice(selectedFormId),
    enabled: selectedFormId != null,
  });

  const rows = queueData?.data ?? [];
  const loadError = actionError ?? queueError?.message ?? invoiceError?.message;

  function openInvoice(formId) {
    setActionError(null);
    setSelectedFormId(formId);
  }

  function closeInvoice() {
    setSelectedFormId(null);
  }

  function handleApproved(updatedInvoice) {
    // approveBilling's response is the fresh invoice -- write it straight
    // into the cache so the open panel reflects it immediately, then let the
    // queue row catch up in the background rather than block on a refetch.
    queryClient.setQueryData(['billing', 'invoice', selectedFormId], updatedInvoice);
    queryClient.invalidateQueries({ queryKey: ['billing', 'queue'] });
  }

  function startEditingAllotment() {
    setAllotmentInput(String(settings?.defaultAllotment ?? ''));
    setEditingAllotment(true);
  }

  async function saveAllotment() {
    const value = Number(allotmentInput);
    if (!Number.isFinite(value) || value < 0) return;

    setSavingAllotment(true);
    setActionError(null);
    try {
      await updateBillingSettings(value);
      await queryClient.invalidateQueries({ queryKey: ['billing', 'settings'] });
      setEditingAllotment(false);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSavingAllotment(false);
    }
  }

  const totalInQueue = rows.length;
  const pendingCount = rows.filter((r) => r.status === 'Pending').length;
  const deductedCount = totalInQueue - pendingCount;
  const overBudgetCount = rows.filter((r) => r.isOverBudget).length;

  const filteredRecords = rows;
  const loading = queueLoading;

  return (
    <div className="flex h-full flex-col overflow-hidden font-['Geist',sans-serif]">
      <div className="mb-4 flex flex-col justify-between gap-3 border-b border-gray-200/80 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-[#0A594D] to-[#37AF9B] text-white shadow-sm">
            <Receipt size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Station 6: Billing
            </h1>
            <p className="text-xs text-gray-500">
              Per-patient allotments and visit charge deductions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-[#37AF9B]/30 bg-[#e6f7f4] px-3 py-1 text-xs font-semibold text-[#0A594D]">
          <ShieldCheck size={14} className="text-[#37AF9B]" />
          <span>Superadmin Access</span>
        </div>
      </div>

      {loadError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} />
          <span>{loadError}</span>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-gray-500">Station Queue</span>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{totalInQueue}</span>
            <span className="text-xs text-gray-400">Total Visits</span>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-xs">
          <span className="text-xs font-medium text-amber-700">Pending Deductions</span>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-700">{pendingCount}</span>
            <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
              Pending
            </span>
          </div>
        </div>

        <div className="rounded-xl border-2 border-[#37AF9B]/50 bg-linear-to-br from-[#f0faf8] via-[#e6f7f4] to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0A594D]">
              Default Allotment
            </span>
            <Landmark size={16} className="text-[#37AF9B]" />
          </div>
          {editingAllotment ? (
            <div className="mt-1.5 flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                step="0.01"
                autoFocus
                value={allotmentInput}
                onChange={(e) => setAllotmentInput(e.target.value)}
                className="w-full rounded-lg border border-[#37AF9B]/40 px-2 py-1 text-sm font-bold text-[#0A594D] outline-none focus:ring-2 focus:ring-[#37AF9B]/30"
              />
              <button
                type="button"
                onClick={saveAllotment}
                disabled={savingAllotment}
                aria-label="Save"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0A594D] text-white hover:opacity-90 disabled:opacity-50"
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={() => setEditingAllotment(false)}
                aria-label="Cancel"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold tracking-tight text-[#0A594D]">
                {peso(settings?.defaultAllotment ?? 0)}
              </span>
              <button
                type="button"
                onClick={startEditingAllotment}
                title="Edit default allotment"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#0A594D]/60 transition hover:bg-[#37AF9B]/10 hover:text-[#0A594D]"
              >
                <Pencil size={13} />
              </button>
            </div>
          )}
        </div>

        <div className={`rounded-xl border p-4 shadow-xs ${overBudgetCount > 0 ? 'border-rose-200 bg-rose-50/50' : 'border-gray-200/80 bg-white'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${overBudgetCount > 0 ? 'text-rose-700' : 'text-gray-500'}`}>
              Over Budget
            </span>
            {overBudgetCount > 0 && <AlertTriangle size={14} className="text-rose-500" />}
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${overBudgetCount > 0 ? 'text-rose-700' : 'text-gray-400'}`}>
              {overBudgetCount}
            </span>
            <span className="text-xs text-gray-400">of {deductedCount} deducted</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col items-center justify-between gap-3 border-b border-gray-100 p-4 sm:flex-row">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient, or office..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#37AF9B] focus:bg-white focus:ring-2 focus:ring-[#37AF9B]/20"
            />
          </div>

          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <div className="flex rounded-xl bg-gray-100 p-0.5 text-xs font-medium text-gray-600">
              {[
                { key: 'All', label: 'All' },
                { key: 'Pending', label: 'Pending' },
                { key: 'Deducted', label: 'Deducted' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setStatusFilter(opt.key)}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    statusFilter === opt.key
                      ? 'bg-white font-semibold text-gray-900 shadow-xs'
                      : 'hover:text-gray-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/90 text-xs font-semibold uppercase tracking-wider text-gray-500 backdrop-blur-xs">
              <tr>
                <th className="px-5 py-3.5">Form</th>
                <th className="px-5 py-3.5">Patient Details</th>
                <th className="px-5 py-3.5 text-center">Items</th>
                <th className="px-5 py-3.5 text-right">Total Charged</th>
                <th className="px-5 py-3.5 text-right">Remaining</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">Loading…</td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <AlertCircle className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    <p className="font-medium text-gray-600">No billing records found</p>
                    <p className="text-xs text-gray-400">Try adjusting your search query or filter criteria</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => {
                  const isDeducted = row.status === 'Deducted';
                  const isSelected = selectedFormId === row.formID;

                  return (
                    <tr
                      key={row.formID}
                      onClick={() => openInvoice(row.formID)}
                      className={`cursor-pointer transition-colors duration-150 hover:bg-[#0A594D]/5 ${
                        isSelected ? 'bg-[#37AF9B]/10 font-medium' : ''
                      }`}
                    >
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-[#0A594D]">
                        <div className="flex items-center gap-1">
                          <span>FORM-{row.formID}</span>
                          <ExternalLink size={12} className="text-gray-400" />
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{row.patientName}</div>
                        {row.agencyOffice && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Building2 size={12} className="text-gray-400" />
                            <span>{row.agencyOffice}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                          {row.itemCount}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-gray-900">
                        {peso(row.totalCharged)}
                      </td>

                      <td className={`px-5 py-4 text-right font-medium ${row.isOverBudget ? 'text-rose-600' : 'text-gray-700'}`}>
                        {row.isOverBudget ? `-${peso(Math.abs(row.remaining))}` : peso(row.remaining)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isDeducted ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              Deducted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              Pending
                            </span>
                          )}
                          {row.isOverBudget && (
                            <span title="Over budget" className="text-rose-500">
                              <AlertTriangle size={13} />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openInvoice(row.formID);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-2xs transition hover:border-[#37AF9B] hover:bg-[#37AF9B]/5 hover:text-[#0A594D]"
                        >
                          <span>View Invoice</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-5 py-3 text-xs text-gray-500">
          <span>
            Showing <strong className="font-semibold text-gray-700">{filteredRecords.length}</strong> patient visit
            {filteredRecords.length === 1 ? '' : 's'}
          </span>
          <span className="italic">Click any row to open the invoice and deduct from the patient's allotment</span>
        </div>
      </div>

      {invoice && (
        <InvoiceSlidePanel
          invoice={invoice}
          onClose={closeInvoice}
          onApproved={handleApproved}
        />
      )}
    </div>
  );
}
