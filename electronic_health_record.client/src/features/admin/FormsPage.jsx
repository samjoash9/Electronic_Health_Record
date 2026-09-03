import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAllForms } from '../../api/forms.api';
import { FORM_STATUS } from '../../lib/constants';
import { fullName, formatDate } from '../../lib/formatters';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';

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
  { key: 'externalEmployeeId', header: 'Employee ID', render: (f) => f.patient?.externalEmployeeId },
  {
    key: 'status',
    header: 'Status',
    render: (f) => <Badge tone={STATUS_TONE[f.status]}>{STATUS_LABEL[f.status] ?? f.status}</Badge>,
  },
  { key: 'currentStation', header: 'Station', render: (f) => `Station ${f.currentStation}` },
  { key: 'formDate', header: 'Date', render: (f) => formatDate(f.formDate) },
];

export default function FormsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const { data: forms, isLoading, error, refetch } = useQuery({
    queryKey: ['forms'],
    queryFn: getAllForms,
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const rows = statusFilter === 'all' ? forms : forms.filter((f) => f.status === statusFilter);

  return (
    <Card
      title="Forms"
      actions={
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-line px-2 py-1 text-sm"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      }
    >
      <DataTable
        columns={COLUMNS}
        rows={rows}
        onRowClick={(row) => navigate(`/forms/${row.formID}`)}
        empty="No forms found."
      />
    </Card>
  );
}
