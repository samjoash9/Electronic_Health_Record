import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  Ban, CircleCheck, Clock, FileText, Pencil, Trash2, Undo2,
} from 'lucide-react';
import { getActivityLogs, deleteActivityLogs } from '../../api/forms.api';
import { fullName, formatDateTime } from '../../lib/formatters';
import { useTableControls } from '../../hooks/useTableControls';
import { useCardLayout } from '../../hooks/useCardLayout';
import Card from '../../components/ui/Card';
import RecordCardList from '../../components/ui/RecordCardList';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import Badge from '../../components/ui/Badge';
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

// The action badge on a card. Send Back and Cancel keep the amber and rose
// they wear on the Forms page; an action without an entry shows a plain pill.
const ACTION_BADGE = {
  Station1Submitted: { tone: 'success', icon: CircleCheck },
  Station2Submitted: { tone: 'success', icon: CircleCheck },
  Station3Submitted: { tone: 'success', icon: CircleCheck },
  Station4Submitted: { tone: 'success', icon: CircleCheck },
  Station5Submitted: { tone: 'success', icon: CircleCheck },
  FormEdited: { tone: 'info', icon: Pencil },
  FormReverted: { tone: 'warn', icon: Undo2 },
  FormCancelled: { tone: 'danger', icon: Ban },
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

// Card width the checkbox, the four text columns and the delete button need
// side by side; below it the log shows as cards.
const TABLE_MIN_WIDTH = 800;

const patientLabel = (log) => (log.patient ? fullName(log.patient) : `Form #${log.formID}`);

// The rendered patient cell falls back to the form number, so that is what the
// query should match on for a log with no patient attached.
const searchFields = (log) => [
  log.actorName,
  log.actorType,
  actionLabel(log.action),
  patientLabel(log),
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
  const { ref: cardRef, isMobile, showCards } = useCardLayout(TABLE_MIN_WIDTH);

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

  // The table's header box, or the first thing in the cards' toolbar.
  const pageCheckbox = (
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
  );

  const bulkActions = (
    <div className="flex items-center gap-2">
      <Button type="button" variant="ghost" onClick={() => setCheckedIds(new Set())}>
        Clear
      </Button>
      <Button type="button" variant="danger" onClick={() => openDelete(checkedOnPage)}>
        <Trash2 size={16} />
        Delete selected
      </Button>
    </div>
  );

  const columns = [
    {
      key: 'select',
      header: pageCheckbox,
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
    { key: 'patient', header: 'Patient', render: patientLabel },
    { key: 'occurredAt', header: 'Date/Time', render: (log) => formatDateTime(log.occurredAt) },
  ];

  const emptyMessage = table.isSearching || table.isFiltered
    ? 'No activity matches your search.'
    : 'No activity recorded yet.';

  return (
    // No side padding on a phone: the shell's own gutter is enough, and the
    // cards need every pixel of width.
    <div className="flex flex-col gap-4 pb-4 md:p-5">
      <h1 className="text-lg font-semibold text-ink-900">Activity Logs</h1>

      <Card
        ref={cardRef}
        flush
        bare={isMobile}
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
          {showCards ? (
            <>
              {/* Cards have no header row to hold the select-all box, so it
                  leads this strip, which turns into the bulk-delete bar once
                  anything is ticked. */}
              {table.pageRows.length > 0 && (
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5 ${
                    checkedOnPage.length > 0 ? 'border-rose-200 bg-rose-50/60' : 'border-line bg-surface'
                  }`}
                >
                  <label className="flex min-h-9 cursor-pointer items-center gap-3 text-sm font-medium text-ink-800">
                    {pageCheckbox}
                    {checkedOnPage.length > 0 ? `${checkedOnPage.length} selected` : 'Select all on this page'}
                  </label>
                  {checkedOnPage.length > 0 && bulkActions}
                </div>
              )}

              <RecordCardList
                rows={table.pageRows}
                rowKey={(log) => log.logID}
                onOpen={setSelectedLog}
                empty={emptyMessage}
                card={(log) => ({
                  selection: {
                    checked: checkedIds.has(log.logID),
                    onChange: () => toggle(log.logID),
                    label: `Select entry #${log.logID}`,
                  },
                  avatarName: log.actorName,
                  title: log.actorName,
                  subtitle: log.actorType,
                  badges: (
                    <Badge tone={ACTION_BADGE[log.action]?.tone} icon={ACTION_BADGE[log.action]?.icon}>
                      {actionLabel(log.action)}
                    </Badge>
                  ),
                  meta: [
                    { icon: FileText, label: patientLabel(log) },
                    { icon: Clock, label: formatDateTime(log.occurredAt) },
                  ],
                  actions: [{
                    key: 'delete',
                    label: 'Delete',
                    icon: Trash2,
                    tone: 'text-rose-600 hover:bg-rose-50',
                    title: `Delete entry #${log.logID}`,
                    onSelect: () => openDelete([log]),
                  }],
                })}
              />
            </>
          ) : (
            <>
              {checkedOnPage.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-2.5">
                  <span className="text-sm font-medium text-ink-800">
                    {checkedOnPage.length} selected
                  </span>
                  {bulkActions}
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
                empty={emptyMessage}
              />
            </>
          )}

          <TableFooter
            page={table.page}
            totalPages={table.totalPages}
            total={table.total}
            noun="entry"
            plural="entries"
            onPageChange={table.setPage}
            compact={isMobile}
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
