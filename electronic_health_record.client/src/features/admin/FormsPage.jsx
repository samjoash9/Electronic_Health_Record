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
import Pagination from '../../components/ui/Pagination';
import SearchInput from '../../components/ui/SearchInput';
import Select from '../../components/ui/Select';

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

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

const PAGE_SIZE = 10;

export default function FormsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data: forms, isLoading, error, refetch } = useQuery({
    queryKey: ['forms'],
    queryFn: getAllForms,
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const byStatus = statusFilter === 'all' ? forms : forms.filter((f) => f.status === statusFilter);
  const q = query.trim().toLowerCase();
  const results = q
    ? byStatus.filter((f) => {
        const p = f.patient ?? {};
        return fullName(p).toLowerCase().includes(q) || p.externalEmployeeId?.toLowerCase().includes(q);
      })
    : byStatus;

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (value) => {
    setQuery(value);
    setPage(1);
  };

  return (
    <Card
      title="Forms"
      actions={
        <div className="flex items-center gap-2">
          <SearchInput
            id="forms-search"
            value={query}
            onChange={handleSearch}
            placeholder="Search by name or employee ID"
            className="w-72"
          />
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={STATUS_FILTER_OPTIONS}
            className="w-48"
          />
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <DataTable
          columns={COLUMNS}
          rows={pageRows}
          onRowClick={(row) => navigate(`/forms/${row.formID}`)}
          empty={q ? 'No forms match your search.' : 'No forms found.'}
        />

        {results.length > 0 && (
          <div className="flex items-center justify-between text-sm text-ink-500">
            <span>
              Page {currentPage} of {totalPages} ({results.length} forms)
            </span>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </Card>
  );
}
