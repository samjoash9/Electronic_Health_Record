import { useQuery } from '@tanstack/react-query';
import { getActivityLogs } from '../../api/forms.api';
import { fullName, formatDateTime } from '../../lib/formatters';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import DataTable from '../../components/ui/DataTable';

const ACTION_LABEL = {
  Station1Submitted: 'Submitted Station 1 — Registration',
  Station2Submitted: 'Submitted Station 2 — Assessment',
  Station3Submitted: 'Submitted Station 3 — Consultation',
};

const COLUMNS = [
  { key: 'actorName', header: 'Actor', render: (log) => `${log.actorName} (${log.actorType})` },
  { key: 'action', header: 'Action', render: (log) => ACTION_LABEL[log.action] ?? log.action },
  { key: 'patient', header: 'Patient', render: (log) => (log.patient ? fullName(log.patient) : `Form #${log.formID}`) },
  { key: 'occurredAt', header: 'Date/Time', render: (log) => formatDateTime(log.occurredAt) },
];

export default function ActivityLogsPage() {
  const { data: logs, isLoading, error, refetch } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: getActivityLogs,
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const rows = logs.map((log) => ({ ...log, id: log.logID }));

  return (
    <Card title="Activity Logs">
      <DataTable columns={COLUMNS} rows={rows} empty="No activity recorded yet." />
    </Card>
  );
}
