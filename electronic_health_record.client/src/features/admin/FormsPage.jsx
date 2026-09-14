import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Ban, Trash2, CalendarRange, X } from 'lucide-react';
import { getAllForms, cancelForm, deleteForm } from '../../api/forms.api';
import { FORM_STATUS, STATUS_LABEL, STATUS_TONE, isSuperAdmin } from '../../lib/constants';
import { fullName, formatDate } from '../../lib/formatters';
import { useAuth } from '../../auth/useAuth';
import { useTableControls } from '../../hooks/useTableControls';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import TableFooter from '../../components/ui/TableFooter';
import SearchInput from '../../components/ui/SearchInput';
import Select from '../../components/ui/Select';
import CancelFormModal from './CancelFormModal';
import DeleteFormModal from './DeleteFormModal';

// This file used to keep its own STATUS_LABEL/STATUS_TONE, copied before
// Station 4 and 5 existed -- they never gained PendingDental/PendingVision,
// so a form sitting at either station rendered its raw status string
// ("PendingDental") instead of a label. Now imported from lib/constants,
// the one place every other screen (PriorStationsPanel, MyRecordPage, the
// station queues) already reads these from.

const COLUMNS = [
  { key: 'name', header: 'Name', render: (f) => fullName(f.patient) },
  {
    key: 'username',
    header: 'Username',
    // The portal handle issued at Station 1. Absent only for forms whose patient
    // predates account provisioning.
    render: (f) => (f.patientAccount?.username
      ? <span className="font-medium text-ink-900">{f.patientAccount.username}</span>
      : <span className="text-ink-400">—</span>),
  },
  {
    key: 'status',
    header: 'Status',
    render: (f) => <Badge tone={STATUS_TONE[f.status]}>{STATUS_LABEL[f.status] ?? f.status}</Badge>,
  },
  { key: 'currentStation', header: 'Station', render: (f) => `Station ${f.currentStation}` },
  { key: 'formDate', header: 'Date', render: (f) => formatDate(f.formDate) },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

const searchFields = (f) => {
  const p = f.patient ?? {};
  return [fullName(p), p.externalEmployeeId, f.patientAccount?.username];
};

const filterField = (f) => f.status;

export default function FormsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canCancel = isSuperAdmin(user);
  const [formToCancel, setFormToCancel] = useState(null);
  const [formToDelete, setFormToDelete] = useState(null);
  // A patient now goes through the station workflow repeatedly (monthly,
  // six-monthly), so "every visit on this date" is a real question this
  // list needs to answer -- these two dates are inclusive on both ends.
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: forms, isLoading, error, refetch } = useQuery({
    queryKey: ['forms'],
    queryFn: getAllForms,
  });

  // FormDate is a plain "date" column server-side (no time component), so a
  // string compare against the <input type="date"> value is exact -- no
  // timezone conversion to get wrong.
  const dateFiltered = useMemo(() => {
    if (!forms) return forms;
    if (!dateFrom && !dateTo) return forms;
    return forms.filter((f) => {
      const d = f.formDate?.slice(0, 10);
      if (!d) return false;
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  }, [forms, dateFrom, dateTo]);

  const hasDateFilter = Boolean(dateFrom || dateTo);
  const clearDateFilter = () => { setDateFrom(''); setDateTo(''); };

  const cancelMutation = useMutation({
    mutationFn: ({ formID, reason, rowVersion }) =>
      cancelForm({ formID, reason, rowVersion, adminID: user?.id }),
    onSuccess: () => {
      // the dashboard reads the same ['forms'] query; cancelling also writes an
      // audit entry, so the activity log is stale too
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      setFormToCancel(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ formID, reason, rowVersion }) =>
      deleteForm({ formID, reason, rowVersion }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      setFormToDelete(null);
    },
  });

  const table = useTableControls(dateFiltered, { searchFields, filterField });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <Card
      title="Forms"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            id="forms-search"
            value={table.query}
            onChange={table.onSearch}
            placeholder="Search by name or username"
            className="w-72"
          />
          <Select
            value={table.filter}
            onChange={(e) => table.onFilter(e.target.value)}
            options={STATUS_FILTER_OPTIONS}
            className="w-56"
          />
          <div className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5">
            <CalendarRange size={15} className="text-ink-400" />
            <input
              type="date"
              aria-label="Visit date from"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={dateTo || undefined}
              className="h-7 rounded border-none bg-transparent text-sm text-ink-900 outline-none"
            />
            <span className="text-ink-400">–</span>
            <input
              type="date"
              aria-label="Visit date to"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              className="h-7 rounded border-none bg-transparent text-sm text-ink-900 outline-none"
            />
            {hasDateFilter && (
              <button
                type="button"
                onClick={clearDateFilter}
                aria-label="Clear date filter"
                className="flex h-5 w-5 items-center justify-center rounded-full text-ink-400 hover:bg-gray-100 hover:text-ink-700"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <DataTable
          columns={COLUMNS}
          rows={table.pageRows}
          onRowClick={(row) => navigate(`/forms/${row.formID}`)}
          rowActions={canCancel ? (row) => (
            <div className="flex items-center gap-1">
              {row.status !== FORM_STATUS.CANCELLED && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-rose-600 hover:bg-rose-50"
                  title={`Cancel form #${row.formID}`}
                  onClick={() => setFormToCancel(row)}
                >
                  <Ban size={16} />
                  Cancel
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                className="text-rose-600 hover:bg-rose-50"
                title={`Permanently delete form #${row.formID}`}
                onClick={() => setFormToDelete(row)}
              >
                <Trash2 size={16} />
                Delete
              </Button>
            </div>
          ) : undefined}
          empty={table.isSearching || table.isFiltered || hasDateFilter
            ? 'No forms match your search.'
            : 'No forms found.'}
        />

        <TableFooter
          page={table.page}
          totalPages={table.totalPages}
          total={table.total}
          noun="form"
          onPageChange={table.setPage}
        />
      </div>

      {formToCancel && (
      <CancelFormModal
        key={formToCancel.formID}
        form={formToCancel}
        isPending={cancelMutation.isPending}
        error={cancelMutation.error}
        onConfirm={({ reason }) => cancelMutation.mutate({
          formID: formToCancel.formID,
          reason,
          rowVersion: formToCancel.rowVersion,
        })}
        onClose={() => {
          cancelMutation.reset();
          setFormToCancel(null);
        }}
      />
      )}

      {formToDelete && (
      <DeleteFormModal
        key={formToDelete.formID}
        form={formToDelete}
        isPending={deleteMutation.isPending}
        error={deleteMutation.error}
        onConfirm={({ reason }) => deleteMutation.mutate({
          formID: formToDelete.formID,
          reason,
          rowVersion: formToDelete.rowVersion,
        })}
        onClose={() => {
          deleteMutation.reset();
          setFormToDelete(null);
        }}
      />
      )}
    </Card>
  );
}
