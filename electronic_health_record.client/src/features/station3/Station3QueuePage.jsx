import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getQueue } from '../../api/forms.api';
import { FORM_STATUS } from '../../lib/constants';
import { fullName, formatDateTime, ageFrom } from '../../lib/formatters';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';

const COLUMNS = [
  { key: 'name', header: 'Name', render: (row) => fullName(row.patient) },
  { key: 'employeeId', header: 'Employee ID', render: (row) => row.patient?.externalEmployeeId },
  { key: 'age', header: 'Age', render: (row) => ageFrom(row.patient?.birthdate) },
  { key: 'assessed', header: 'Assessed', render: (row) => formatDateTime(row.station2SubmittedAt) },
];

export default function Station3QueuePage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['queue', FORM_STATUS.PENDING_CONSULTATION],
    queryFn: () => getQueue(FORM_STATUS.PENDING_CONSULTATION),
    refetchInterval: 15_000,
  });

  return (
    <Card title="Waiting for Consultation">
      {isLoading && <Skeleton />}
      {error && <ErrorState error={error} onRetry={refetch} />}
      {!isLoading && !error && (
        <DataTable
          columns={COLUMNS}
          rows={data}
          onRowClick={(row) => navigate(`/station3/${row.formID}`)}
          empty="No patients waiting. Forms submitted at Station 2 appear here automatically."
        />
      )}
    </Card>
  );
}
