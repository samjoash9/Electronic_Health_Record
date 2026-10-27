import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  Landmark,
  Plus,
  CalendarRange,
  Users,
  Trash2,
} from 'lucide-react';
import { peso, formatDate } from '../../lib/formatters';
import { listBillingForms, getBillingForm, deleteBillingForm } from '../../api/billing.api';
import { useTableControls } from '../../hooks/useTableControls';
import { useCardLayout } from '../../hooks/useCardLayout';
import DataTable from '../../components/ui/DataTable';
import TableFooter from '../../components/ui/TableFooter';
import SearchInput from '../../components/ui/SearchInput';
import Button from '../../components/ui/Button';
import BillingFormModal from './BillingFormModal';
import BillingFormSlidePanel from './BillingFormSlidePanel';
import BillingCardList from './BillingCardList';
import BudgetStatusBadge from './BudgetStatusBadge';

// Panel width the six columns plus the delete button need side by side --
// the peso columns never wrap. Below it the periods show as cards.
const TABLE_MIN_WIDTH = 860;

/**
 * Station 6. The table lists budget periods, not visits: an admin allocates
 * capital to a date range, and every lab and medication recorded for a visit
 * inside that range is deducted from it.
 *
 * There is no approve step. Consumption is derived server-side from the
 * period's charges on every read, so a charge Station 3 adds later is counted
 * without anyone revisiting this screen. Over budget is reported, never
 * blocked -- the money is already spent by the time it shows up here.
 */
export default function Station6BillingPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [actionError, setActionError] = useState(null);
  const { ref: panelRef, isMobile, showCards } = useCardLayout(TABLE_MIN_WIDTH);

  const { data, isLoading, error: listError } = useQuery({
    queryKey: ['billing', 'forms'],
    queryFn: () => listBillingForms(),
  });

  const { data: detail, error: detailError } = useQuery({
    queryKey: ['billing', 'form', selectedId],
    queryFn: () => getBillingForm(selectedId),
    enabled: selectedId != null,
  });

  const rows = data?.data ?? [];
  const loadError = actionError ?? listError?.message ?? detailError?.message;

  const table = useTableControls(rows, {
    searchFields: (r) => [r.title, formatDate(r.startDate), formatDate(r.endDate)],
  });

  const totalCapital = rows.reduce((sum, r) => sum + r.capital, 0);
  const totalConsumed = rows.reduce((sum, r) => sum + r.consumed, 0);
  const overBudgetCount = rows.filter((r) => r.isOverBudget).length;

  function refreshAll() {
    queryClient.invalidateQueries({ queryKey: ['billing'] });
  }

  function openAdd() {
    setActionError(null);
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(billingForm) {
    setActionError(null);
    setEditing(billingForm);
    setModalOpen(true);
  }

  async function handleDelete(row) {
    // Deleting a period discards only the budget envelope -- the visits and
    // their charges are untouched -- but the amount is worth naming, since
    // "delete" next to a money figure reads as deleting the money.
    const confirmed = window.confirm(
      `Delete "${row.title}"?\n\n`
      + `Its ${peso(row.capital)} allocation is removed. The visits and charges `
      + `dated in this period are not deleted.`,
    );
    if (!confirmed) return;

    setActionError(null);
    try {
      await deleteBillingForm(row.billingFormID);
      if (selectedId === row.billingFormID) setSelectedId(null);
      refreshAll();
    } catch (err) {
      setActionError(err.message);
    }
  }

  const COLUMNS = [
    {
      key: 'title',
      header: 'Billing Period',
      width: '24%',
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-gray-900">{r.title}</div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
            <CalendarRange size={11} className="shrink-0 text-gray-400" />
            <span className="truncate">{formatDate(r.startDate)} – {formatDate(r.endDate)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'employeeCount',
      header: 'Employees',
      width: '10%',
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-gray-700">
          <Users size={13} className="shrink-0 text-gray-400" />
          {r.employeeCount}
        </span>
      ),
    },
    {
      key: 'capital',
      header: 'Capital',
      width: '14%',
      render: (r) => <span className="whitespace-nowrap font-medium text-gray-900">{peso(r.capital)}</span>,
    },
    {
      key: 'consumed',
      header: 'Consumed',
      width: '14%',
      render: (r) => (
        <div className="whitespace-nowrap">
          <span className="font-medium text-gray-900">{peso(r.consumed)}</span>
          {r.unpricedCount > 0 && (
            <div className="text-[11px] text-amber-600">
              {r.unpricedCount} unpriced
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'remaining',
      header: 'Remaining',
      width: '14%',
      render: (r) => (
        <span className={`whitespace-nowrap font-semibold ${r.isOverBudget ? 'text-rose-600' : 'text-[#0A594D]'}`}>
          {r.isOverBudget ? `-${peso(Math.abs(r.remaining))}` : peso(r.remaining)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '16%',
      render: (r) => <BudgetStatusBadge isOverBudget={r.isOverBudget} />,
    },
  ];

  const emptyMessage = table.isSearching
    ? 'No billing periods match your search.'
    : 'No billing periods yet. Use "Add Billing" to allocate capital to a date range.';

  return (
    // From md up the page fills the shell and only the list scrolls, keeping
    // the stats and pagination in view. A phone has no room for that fixed
    // frame -- the list was squeezed to a sliver -- so there the page flows
    // and the shell scrolls it, with no side padding: the shell's own gutter
    // is enough, and the cards need every pixel of width.
    <div className="flex flex-col gap-4 pb-4 font-['Geist',sans-serif] md:h-full md:overflow-hidden md:p-5">
      <h1 className="text-lg font-semibold text-ink-900">Station 6: Billing</h1>

      {loadError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} />
          <span>{loadError}</span>
        </div>
      )}

      {/* Below `tab` the two peso cards take the full row, where their amounts
          fit untruncated, and dense flow pulls the two counts up to share the
          first row instead of each taking a row of its own. */}
      <div className="grid grid-flow-row-dense grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-gray-500">Billing Periods</span>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{rows.length}</span>
            <span className="text-xs text-gray-400">Total</span>
          </div>
        </div>

        <div className="col-span-2 rounded-xl border-2 border-[#37AF9B]/50 bg-linear-to-br tab:col-span-1 from-[#f0faf8] via-[#e6f7f4] to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0A594D]">
              Total Capital
            </span>
            <Landmark size={16} className="text-[#37AF9B]" />
          </div>
          <div className="mt-1.5 overflow-hidden">
            <span className="block truncate text-2xl font-extrabold tracking-tight text-[#0A594D]">
              {peso(totalCapital)}
            </span>
          </div>
        </div>

        <div className="col-span-2 overflow-hidden rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-xs tab:col-span-1">
          <span className="text-xs font-medium text-amber-700">Total Consumed</span>
          <div className="mt-1.5 flex items-baseline justify-between overflow-hidden">
            <span className="truncate text-2xl font-bold text-amber-700">{peso(totalConsumed)}</span>
          </div>
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
            <span className="text-xs text-gray-400">of {rows.length} period{rows.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      </div>

      {/* On a phone the panel goes bare -- no border, fill or padding -- since
          the cards inside are bordered already (as Card's `bare` does). */}
      <div
        ref={panelRef}
        className="flex min-w-0 flex-col md:flex-1 md:overflow-hidden md:rounded-2xl md:border md:border-gray-200 md:bg-white md:shadow-sm"
      >
        <div className="flex items-center justify-between gap-2 pb-3 md:gap-3 md:border-b md:border-gray-100 md:p-4">
          <SearchInput
            id="billing-search"
            value={table.query}
            onChange={table.onSearch}
            placeholder="Search by period name or date…"
            className="min-w-0 flex-1 sm:w-80 sm:flex-none"
          />

          {/* lg on a phone, to stand as tall as the search box beside it. */}
          <Button type="button" variant="teal" size={isMobile ? 'lg' : 'md'} className="shrink-0" onClick={openAdd}>
            <Plus size={16} />
            <span>Add Billing</span>
          </Button>
        </div>

        <div className="md:flex-1 md:overflow-auto md:p-4">
          {isLoading && <p className="py-12 text-center text-sm text-gray-400">Loading…</p>}
          {!isLoading && showCards && (
            <BillingCardList
              periods={table.pageRows}
              onOpen={(r) => setSelectedId(r.billingFormID)}
              onDelete={handleDelete}
              empty={emptyMessage}
            />
          )}
          {!isLoading && !showCards && (
            <DataTable
              columns={COLUMNS}
              rows={table.pageRows.map((r) => ({ ...r, id: r.billingFormID }))}
              onRowClick={(r) => setSelectedId(r.billingFormID)}
              variant="plain"
              empty={emptyMessage}
              rowActions={(r) => (
                <button
                  type="button"
                  onClick={() => handleDelete(r)}
                  title="Delete billing period"
                  aria-label={`Delete ${r.title}`}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={15} />
                </button>
              )}
            />
          )}
        </div>

        <div className="pt-3 md:border-t md:border-gray-100 md:bg-gray-50/60 md:px-5 md:py-3">
          <TableFooter
            page={table.page}
            totalPages={table.totalPages}
            total={table.total}
            noun="billing period"
            onPageChange={table.setPage}
            compact={isMobile}
          />
        </div>
      </div>

      <BillingFormModal
        open={modalOpen}
        billingForm={editing}
        onClose={() => setModalOpen(false)}
        onSaved={refreshAll}
      />

      {detail && (
        <BillingFormSlidePanel
          detail={detail}
          onClose={() => setSelectedId(null)}
          onEdit={() => openEdit(detail)}
        />
      )}
    </div>
  );
}
