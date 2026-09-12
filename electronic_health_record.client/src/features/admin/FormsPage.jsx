import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Ban, Trash2 } from 'lucide-react';
import { getAllForms, cancelForm, deleteForm } from '../../api/forms.api';
import { FORM_STATUS, isSuperAdmin } from '../../lib/constants';
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

const STATUS_LABEL = {
  [FORM_STATUS.PENDING_ASSESSMENT]: 'Pending Assessment',
  [FORM_STATUS.PENDING_CONSULTATION]: 'Pending Consultation',
  [FORM_STATUS.COMPLETED]: 'Completed',
  [FORM_STATUS.CANCELLED]: 'Cancelled',
};

const STATUS_TONE = {
  [FORM_STATUS.PENDING_ASSESSMENT]: 'info',
  [FORM_STATUS.PENDING_CONSULTATION]: 'warn',
  [FORM_STATUS.COMPLETED]: 'success',
  [FORM_STATUS.CANCELLED]: 'danger',
};

const COLUMNS = [
  { key: 'name', header: 'Name', render: (f) => fullName(f.patient) },
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
  return [fullName(p), p.externalEmployeeId];
};

const filterField = (f) => f.status;

export default function FormsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canCancel = isSuperAdmin(user);
  const [formToCancel, setFormToCancel] = useState(null);
  const [formToDelete, setFormToDelete] = useState(null);

  const { data: forms, isLoading, error, refetch } = useQuery({
    queryKey: ['forms'],
    queryFn: getAllForms,
  });

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

  const table = useTableControls(forms, { searchFields, filterField });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <Card
      title="Forms"
      actions={
        <div className="flex items-center gap-2">
          <SearchInput
            id="forms-search"
            value={table.query}
            onChange={table.onSearch}
            placeholder="Search by name"
            className="w-72"
          />
          <Select
            value={table.filter}
            onChange={(e) => table.onFilter(e.target.value)}
            options={STATUS_FILTER_OPTIONS}
            className="w-56"
          />
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
          empty={table.isSearching || table.isFiltered ? 'No forms match your search.' : 'No forms found.'}
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
