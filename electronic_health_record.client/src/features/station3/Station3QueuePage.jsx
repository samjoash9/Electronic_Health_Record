import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getQueue } from '../../api/forms.api';
import { FORM_STATUS, STATUS_LABEL, STATUS_TONE } from '../../lib/constants';
import { fullName, formatDateTime, ageFrom } from '../../lib/formatters';
import { useTableControls } from '../../hooks/useTableControls';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import SearchInput from '../../components/ui/SearchInput';
import Select from '../../components/ui/Select';
import TableFooter from '../../components/ui/TableFooter';

const COLUMNS = [
  { key: 'name', header: 'Name', render: (row) => fullName(row.patient) },
  { key: 'employeeId', header: 'Employee ID', render: (row) => row.patient?.externalEmployeeId },
  { key: 'age', header: 'Age', render: (row) => ageFrom(row.patient?.birthdate) },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status] ?? row.status}</Badge>,
  },
  { key: 'assessed', header: 'Assessed', render: (row) => formatDateTime(row.station2SubmittedAt) },
];

// The statuses a consultation can be in once station 2 has handed it over. A
// queue of only PendingConsultation would leave the status filter with a single
// option, so completed and cancelled consultations are listed too.
const QUEUE_STATUSES = [
  FORM_STATUS.PENDING_CONSULTATION,
  FORM_STATUS.COMPLETED,
  FORM_STATUS.CANCELLED,
];

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  ...QUEUE_STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] })),
];

const searchFields = (row) => {
  const p = row.patient ?? {};
  return [fullName(p), p.externalEmployeeId, p.agencyOffice];
};

const filterField = (row) => row.status;

export default function Station3QueuePage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['queue', QUEUE_STATUSES],
    queryFn: () => getQueue(QUEUE_STATUSES),
    refetchInterval: 15_000,
  });

  const table = useTableControls(data, { searchFields, filterField });

  return (
    <Card
      title="Waiting for Consultation"
      actions={!isLoading && !error && (
        <div className="flex items-center gap-2">
          <SearchInput
            id="station3-search"
            value={table.query}
            onChange={table.onSearch}
            placeholder="Search by name, employee ID, or agency"
            className="w-72"
          />
          <Select
            value={table.filter}
            onChange={(e) => table.onFilter(e.target.value)}
            options={STATUS_FILTER_OPTIONS}
            className="w-56"
          />
        </div>
      )}
    >
      {isLoading && <Skeleton />}
      {error && <ErrorState error={error} onRetry={refetch} />}
      {!isLoading && !error && (
        <div className="flex flex-col gap-3">
          <DataTable
            columns={COLUMNS}
            rows={table.pageRows}
            onRowClick={(row) => navigate(`/station3/${row.formID}`)}
            empty={table.isSearching || table.isFiltered
              ? 'No patients match your search.'
              : 'No patients waiting. Forms submitted at Station 2 appear here automatically.'}
          />

          <TableFooter
            page={table.page}
            totalPages={table.totalPages}
            total={table.total}
            noun="patient"
            onPageChange={table.setPage}
          />
        </div>
      )}
    </Card>
  );
}
