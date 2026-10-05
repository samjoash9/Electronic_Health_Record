import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Trash2 } from 'lucide-react';
import { getActivityLogs, deleteActivityLogs } from '../../api/forms.api';
import { fullName, formatDateTime } from '../../lib/formatters';
import { useTableControls } from '../../hooks/useTableControls';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import SearchInput from '../../components/ui/SearchInput';
import Select from '../../components/ui/Select';
import TableFooter from '../../components/ui/TableFooter';
import ActivityLogDetailModal from './ActivityLogDetailModal';
import DeleteLogsModal from './DeleteLogsModal';

// One entry per Action the server writes (see the WellnessFormAuditLogs.Add
// calls in WellnessFormsController). Anything missing from here still shows
// readably through actionLabel's fallback, but only listed actions can be
// picked in the filter.
const ACTION_LABEL = {
  Station1Submitted: 'Submitted Station 1 — Registration',
  Station2Submitted: 'Submitted Station 2 — Assessment',
  Station3Submitted: 'Submitted Station 3 — Consultation',
  Station4Submitted: 'Submitted Station 4 — Dental',
  Station5Submitted: 'Submitted Station 5 — Vision',
  FormEdited: 'Edited Form',
  FormReverted: 'Reverted Form',
  FormCancelled: 'Cancelled Form',
};

// "Station6Submitted" -> "Station 6 Submitted", so an action added on the
// server before it gets a label here never shows as one run-together word.
const actionLabel = (action) =>
  ACTION_LABEL[action]
  ?? String(action ?? '')
    .replace(/([a-z])([A-Z0-9])/g, '$1 $2')
    .replace(/([0-9])([A-Za-z])/g, '$1 $2');

const ACTION_FILTER_OPTIONS = [
  { value: 'all', label: 'All Actions' },
  ...Object.entries(ACTION_LABEL).map(([value, label]) => ({ value, label })),
];

// The rendered patient cell falls back to the form number, so that is what the
// query should match on for a log with no patient attached.
const searchFields = (log) => [
  log.actorName,
  log.actorType,
  actionLabel(log.action),
  log.patient ? fullName(log.patient) : `Form #${log.formID}`,
];

const filterField = (log) => log.action;

// Keeps a click or Space on a checkbox from reaching the row, which would
// otherwise open the detail modal as well.
const stopRowClick = (e) => e.stopPropagation();

export default function ActivityLogsPage() {
  const queryClient = useQueryClient();
  const [selectedLog, setSelectedLog] = useState(null);
  const [checkedIds, setCheckedIds] = useState(() => new Set());
  const [logsToDelete, setLogsToDelete] = useState(null);

  const { data: logs, isLoading, error, refetch } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: getActivityLogs,
  });

  const deleteMutation = useMutation({
    mutationFn: (targets) => deleteActivityLogs(targets.map((l) => l.logID)),
    onSuccess: ({ deleted }, targets) => {
      const goneIds = new Set(targets.map((l) => l.logID));
      setCheckedIds((prev) => new Set([...prev].filter((id) => !goneIds.has(id))));
      if (selectedLog && goneIds.has(selectedLog.logID)) setSelectedLog(null);
      setLogsToDelete(null);
      toast.success(`Deleted ${deleted} log ${deleted === 1 ? 'entry' : 'entries'}.`);
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });

  const rows = logs?.map((log) => ({ ...log, id: log.logID }));
  const table = useTableControls(rows, { searchFields, filterField });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  // Only ticked rows on the current page count: a bulk delete never reaches
  // rows the reader cannot see, even if they ticked them on another page or
  // before changing the search.
  const checkedOnPage = table.pageRows.filter((row) => checkedIds.has(row.logID));
  const allOnPageChecked = table.pageRows.length > 0 && checkedOnPage.length === table.pageRows.length;

  const toggle = (logID) => setCheckedIds((prev) => {
    const next = new Set(prev);
    if (next.has(logID)) next.delete(logID);
    else next.add(logID);
    return next;
  });

  const togglePage = () => setCheckedIds((prev) => {
    const next = new Set(prev);
    for (const row of table.pageRows) {
      if (allOnPageChecked) next.delete(row.logID);
      else next.add(row.logID);
    }
    return next;
  });

  const openDelete = (targets) => {
    deleteMutation.reset();
    setLogsToDelete(targets);
  };

  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          aria-label="Select all entries on this page"
          checked={allOnPageChecked}
          ref={(el) => {
            if (el) el.indeterminate = checkedOnPage.length > 0 && !allOnPageChecked;
          }}
          onChange={togglePage}
          className="h-4 w-4 accent-[#129883]"
        />
      ),
      render: (log) => (
        <input
          type="checkbox"
          aria-label={`Select entry #${log.logID}`}
          checked={checkedIds.has(log.logID)}
          onChange={() => toggle(log.logID)}
          onClick={stopRowClick}
          onKeyDown={stopRowClick}
          className="h-4 w-4 accent-[#129883]"
        />
      ),
    },
    { key: 'actorName', header: 'Actor', render: (log) => `${log.actorName} (${log.actorType})` },
    { key: 'action', header: 'Action', render: (log) => actionLabel(log.action) },
    { key: 'patient', header: 'Patient', render: (log) => (log.patient ? fullName(log.patient) : `Form #${log.formID}`) },
    { key: 'occurredAt', header: 'Date/Time', render: (log) => formatDateTime(log.occurredAt) },
  ];

  return (
    <div className="flex flex-col gap-4 p-5">
      <h1 className="text-lg font-semibold text-ink-900">Activity Logs</h1>

      <Card
      flush
      actions={
        /* Both controls split the row evenly at every width, stacking only on a
           phone-width card where an even split would leave each too narrow. */
        <div className="grid w-full grid-cols-1 items-center gap-2 @md:grid-cols-2">
          <SearchInput
            id="activity-logs-search"
            value={table.query}
            onChange={table.onSearch}
            placeholder="Search by actor, action, or patient"
            className="w-full min-w-0"
          />
          <Select
            value={table.filter}
            onChange={(e) => table.onFilter(e.target.value)}
            options={ACTION_FILTER_OPTIONS}
            className="w-full min-w-0"
            triggerClassName="h-12 rounded-full px-4"
          />
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {checkedOnPage.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-2.5">
            <span className="text-sm font-medium text-ink-800">
              {checkedOnPage.length} selected
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => setCheckedIds(new Set())}>
                Clear
              </Button>
              <Button type="button" variant="danger" onClick={() => openDelete(checkedOnPage)}>
                <Trash2 size={16} />
                Delete selected
              </Button>
            </div>
          </div>
        )}

        <DataTable
          columns={columns}
          rows={table.pageRows}
          onRowClick={setSelectedLog}
          rowActions={(log) => (
            <Button
              type="button"
              variant="ghost"
              className="text-rose-600 hover:bg-rose-50"
              aria-label={`Delete entry #${log.logID}`}
              title="Permanently delete this entry"
              onClick={() => openDelete([log])}
            >
              <Trash2 size={16} />
            </Button>
          )}
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
        actionLabel={actionLabel}
        onClose={() => setSelectedLog(null)}
      />

      {logsToDelete && (
        <DeleteLogsModal
          logs={logsToDelete}
          actionLabel={actionLabel}
          onConfirm={() => deleteMutation.mutate(logsToDelete)}
          onClose={() => setLogsToDelete(null)}
          isPending={deleteMutation.isPending}
          error={deleteMutation.error}
        />
      )}
      </Card>
    </div>
  );
}
