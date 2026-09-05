import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActivityLogs } from '../../api/forms.api';
import { fullName, formatDateTime } from '../../lib/formatters';
import { useTableControls } from '../../hooks/useTableControls';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import DataTable from '../../components/ui/DataTable';
import SearchInput from '../../components/ui/SearchInput';
import Select from '../../components/ui/Select';
import TableFooter from '../../components/ui/TableFooter';
import ActivityLogDetailModal from './ActivityLogDetailModal';

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

const ACTION_FILTER_OPTIONS = [
  { value: 'all', label: 'All Actions' },
  ...Object.entries(ACTION_LABEL).map(([value, label]) => ({ value, label })),
];

// The rendered patient cell falls back to the form number, so that is what the
// query should match on for a log with no patient attached.
const searchFields = (log) => [
  log.actorName,
  log.actorType,
  ACTION_LABEL[log.action] ?? log.action,
  log.patient ? fullName(log.patient) : `Form #${log.formID}`,
];

const filterField = (log) => log.action;

export default function ActivityLogsPage() {
  const [selectedLog, setSelectedLog] = useState(null);
  const { data: logs, isLoading, error, refetch } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: getActivityLogs,
  });

  const rows = logs?.map((log) => ({ ...log, id: log.logID }));
  const table = useTableControls(rows, { searchFields, filterField });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <Card
      title="Activity Logs"
      actions={
        <div className="flex items-center gap-2">
          <SearchInput
            id="activity-logs-search"
            value={table.query}
            onChange={table.onSearch}
            placeholder="Search by actor, action, or patient"
            className="w-72"
          />
          <Select
            value={table.filter}
            onChange={(e) => table.onFilter(e.target.value)}
            options={ACTION_FILTER_OPTIONS}
            className="w-64"
          />
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <DataTable
          columns={COLUMNS}
          rows={table.pageRows}
          onRowClick={setSelectedLog}
          empty={table.isSearching || table.isFiltered
            ? 'No activity matches your search.'
            : 'No activity recorded yet.'}
        />

        <TableFooter
          page={table.page}
          totalPages={table.totalPages}
          total={table.total}
          noun="entry"
          plural="entries"
          onPageChange={table.setPage}
        />
      </div>

      <ActivityLogDetailModal
        log={selectedLog}
        actionLabel={ACTION_LABEL}
        onClose={() => setSelectedLog(null)}
      />
    </Card>
  );
}
