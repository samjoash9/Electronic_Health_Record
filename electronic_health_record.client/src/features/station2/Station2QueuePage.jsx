import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { getQueue } from '../../api/forms.api';
import { FORM_STATUS } from '../../lib/constants';
import { fullName, formatDateTime } from '../../lib/formatters';
import { useTableControls } from '../../hooks/useTableControls';
import { useCardLayout } from '../../hooks/useCardLayout';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import RecordCardList from '../../components/ui/RecordCardList';
import TableFooter from '../../components/ui/TableFooter';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import PatientPreviewModal from '../../components/ui/PatientPreviewModal';
import SearchInput from '../../components/ui/SearchInput';

// station2StartedAt is stamped when the kiosk first opens for this form
// (see KioskPage), so other desks can tell who already has a tablet.
const statusBadge = (row) => (row.station2StartedAt
  ? <Badge tone="warn" dot>Answering</Badge>
  : <Badge dot>Not yet answered</Badge>);

const COLUMNS = [
  { key: 'name', header: 'Name', render: (row) => fullName(row.patient) },
  { key: 'agency', header: 'Agency', render: (row) => row.patient?.agencyOffice },
  { key: 'submitted', header: 'Submitted', render: (row) => formatDateTime(row.station1SubmittedAt) },
  { key: 'status', header: 'Status', render: statusBadge },
];

// Card width the four columns need side by side -- agency names run long;
// below it the queue shows as cards.
const TABLE_MIN_WIDTH = 640;

const searchFields = (row) => {
  const p = row.patient ?? {};
  return [fullName(p), p.externalEmployeeId, p.agencyOffice];
};

export default function Station2QueuePage() {
  const navigate = useNavigate();
  const [previewRow, setPreviewRow] = useState(null);
  const { ref: cardRef, isMobile, showCards } = useCardLayout(TABLE_MIN_WIDTH);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['queue', FORM_STATUS.PENDING_ASSESSMENT],
    queryFn: () => getQueue(FORM_STATUS.PENDING_ASSESSMENT),
    refetchInterval: 15_000,
  });

  const table = useTableControls(data, { searchFields });
  const emptyMessage = table.isSearching
    ? 'No patients match your search.'
    : 'No patients waiting. Forms submitted at Station 1 appear here automatically.';

  return (
    // No side padding on a phone: the shell's own gutter is enough, and the
    // cards need every pixel of width.
    <div className="flex flex-col gap-4 pb-4 md:p-5">
      <h1 className="text-lg font-semibold text-ink-900">Station 2: Assessment</h1>

      <Card ref={cardRef} flush bare={isMobile}>
      {isLoading && <Skeleton />}
      {error && <ErrorState error={error} onRetry={refetch} />}
      {!isLoading && !error && (
        <div className="flex flex-col gap-3">
          <SearchInput
            id="station2-search"
            value={table.query}
            onChange={table.onSearch}
            placeholder="Search by name or agency"
          />

          {showCards ? (
            <RecordCardList
              rows={table.pageRows}
              rowKey={(row) => row.formID}
              onOpen={setPreviewRow}
              empty={emptyMessage}
              card={(row) => {
                const name = fullName(row.patient);
                return {
                  avatarName: name,
                  title: name,
                  // The agency gets the fact line rather than the subtitle:
                  // office names run long, and a subtitle truncates.
                  subtitle: `Submitted ${formatDateTime(row.station1SubmittedAt)}`,
                  badges: statusBadge(row),
                  meta: row.patient?.agencyOffice
                    ? [{ icon: Building2, label: row.patient.agencyOffice }]
                    : [],
                };
              }}
            />
          ) : (
            <DataTable
              columns={COLUMNS}
              evenColumns
              rows={table.pageRows}
              onRowClick={setPreviewRow}
              empty={emptyMessage}
            />
          )}

          <TableFooter
            page={table.page}
            totalPages={table.totalPages}
            total={table.total}
            noun="patient"
            onPageChange={table.setPage}
            compact={isMobile}
          />
        </div>
      )}

      <PatientPreviewModal
        patient={previewRow?.patient}
        confirmLabel="Hand to Patient"
        onClose={() => setPreviewRow(null)}
        onConfirm={() => navigate(`/station2/${previewRow.formID}/kiosk`)}
      />
      </Card>
    </div>
  );
}
