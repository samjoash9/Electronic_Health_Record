import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Ban, Trash2, Undo2 } from 'lucide-react';
import { getAllForms, cancelForm, deleteForm, revertStation } from '../../api/forms.api';
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
import DateRangePicker from '../../components/ui/DateRangePicker';
import { isoDate, manilaToday } from './dashboardPeriod';
import CancelFormModal from './CancelFormModal';
import DeleteFormModal from './DeleteFormModal';
import RevertFormModal from './RevertFormModal';

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
  const [formToRevert, setFormToRevert] = useState(null);
  // A patient now goes through the station workflow repeatedly (monthly,
  // six-monthly), so "every visit on this date" is a real question this
  // list needs to answer -- these two dates are inclusive on both ends.
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  // The picker's presets count back from the clinic's day, as FormDate does.
  const manila = manilaToday();
  const todayIso = isoDate(manila.year, manila.month, manila.day);

  const { data: forms, isLoading, error, refetch } = useQuery({
    queryKey: ['forms'],
    queryFn: getAllForms,
  });

  // FormDate is a plain "date" column server-side (no time component), so a
  // string compare against the picker's yyyy-MM-dd values is exact -- no
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

  const revertMutation = useMutation({
    mutationFn: ({ formID, targetStation, reason, rowVersion }) =>
      revertStation({ formID, targetStation, reason, rowVersion }),
    onSuccess: () => {
      // the station queues read the same ['forms'] query, and the form is
      // moving between two of them; the revert is audited too
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      setFormToRevert(null);
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
    <div className="flex flex-col gap-4 p-5">
      <h1 className="text-lg font-semibold text-ink-900">Forms</h1>

      <Card
        flush
        actions={
          /*
           * The three controls need ~780px to sit on one row (288 search + 224
           * status + ~250 date + gaps), so the single-row layout starts at @4xl
           * (56rem/896px) -- not @2xl (42rem/672px), which the card still clears
           * with a collapsed sidebar and which therefore let the row engage at a
           * width where it could only wrap, orphaning the date box on its own
           * line. Below that: a 2-column grid, search spanning the full width on
           * top, status and date range sharing the row beneath it.
           */
          <div className="grid w-full grid-cols-2 items-center gap-2 @4xl:flex @4xl:flex-wrap">
            <SearchInput
              id="forms-search"
              value={table.query}
              onChange={table.onSearch}
              placeholder="Search by name or username"
              className="col-span-2 w-full @4xl:w-72"
            />
            <Select
              value={table.filter}
              onChange={(e) => table.onFilter(e.target.value)}
              options={STATUS_FILTER_OPTIONS}
              className="w-full @4xl:w-56"
            />
            <DateRangePicker
              label="Visit date"
              from={dateFrom}
              to={dateTo}
              today={todayIso}
              onChange={({ from, to }) => { setDateFrom(from); setDateTo(to); }}
              className="min-w-0 @4xl:w-72"
            />
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <DataTable
            columns={COLUMNS}
            rows={table.pageRows}
            onRowClick={(row) => navigate(`/forms/${row.formID}`)}
            evenColumns
            rowActionsHeader={canCancel ? 'Actions' : undefined}
            // Fits all three buttons on one line; a row missing Send Back or
            // Cancel centres what is left under the header.
            rowActionsWidth={canCancel ? '22rem' : undefined}
            rowActions={canCancel ? (row) => (
              <div className="flex items-center justify-center gap-1">
                {/*
                * Hidden at Station 1 as well as on cancelled forms: there is no
                * earlier station to send those back to, so the modal would open
                * with an empty destination list.
                */}
                {row.status !== FORM_STATUS.CANCELLED && row.currentStation > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-amber-700 hover:bg-amber-50"
                    title={`Send form #${row.formID} back to an earlier station`}
                    onClick={() => setFormToRevert(row)}
                  >
                    <Undo2 size={16} />
                    Send Back
                  </Button>
                )}
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

        {formToRevert && (
          <RevertFormModal
            key={formToRevert.formID}
            form={formToRevert}
            isPending={revertMutation.isPending}
            error={revertMutation.error}
            onConfirm={({ targetStation, reason }) => revertMutation.mutate({
              formID: formToRevert.formID,
              targetStation,
              reason,
              rowVersion: formToRevert.rowVersion,
            })}
            onClose={() => {
              revertMutation.reset();
              setFormToRevert(null);
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
    </div>
  );
}
