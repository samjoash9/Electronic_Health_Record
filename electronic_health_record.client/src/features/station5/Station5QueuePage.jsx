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
import TableFooter from '../../components/ui/TableFooter';

const COLUMNS = [
  { key: 'name', header: 'Name', render: (row) => fullName(row.patient) },
  { key: 'age', header: 'Age', render: (row) => ageFrom(row.patient?.birthdate) },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status] ?? row.status}</Badge>,
  },
  { key: 'dental', header: 'Dental Done', render: (row) => formatDateTime(row.station4SubmittedAt) },
];

// Only what this desk still has to do. A vision visit that is finished (or
// cancelled) is history, not queue: it is read-only from here on and lives on
// the Forms page, so listing it here would invite a doctor to reopen work that
// is already signed.
const QUEUE_STATUSES = [FORM_STATUS.PENDING_VISION];

const searchFields = (row) => {
  const p = row.patient ?? {};
  return [fullName(p), p.externalEmployeeId, p.agencyOffice];
};

export default function Station5QueuePage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['queue', QUEUE_STATUSES],
    queryFn: () => getQueue(QUEUE_STATUSES),
    refetchInterval: 15_000,
  });

  const table = useTableControls(data, { searchFields });

  return (
    <div className="flex flex-col gap-4 p-5">
      <h1 className="text-lg font-semibold text-ink-900">Station 5: Vision</h1>

      <Card
      flush
      actions={!isLoading && !error && (
        <SearchInput
          id="station5-search"
          value={table.query}
          onChange={table.onSearch}
          placeholder="Search by name or agency"
          className="w-72"
        />
      )}
    >
      {isLoading && <Skeleton />}
      {error && <ErrorState error={error} onRetry={refetch} />}
      {!isLoading && !error && (
        <div className="flex flex-col gap-3">
          <DataTable
            columns={COLUMNS}
            rows={table.pageRows}
            onRowClick={(row) => navigate(`/station5/${row.formID}`)}
            empty={table.isSearching
              ? 'No patients match your search.'
              : 'No patients waiting. Forms signed at Station 4 appear here automatically.'}
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
    </div>
  );
}
