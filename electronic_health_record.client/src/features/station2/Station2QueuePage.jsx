import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getQueue } from '../../api/forms.api';
import { FORM_STATUS } from '../../lib/constants';
import { fullName, formatDateTime } from '../../lib/formatters';
import { useTableControls } from '../../hooks/useTableControls';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import TableFooter from '../../components/ui/TableFooter';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import PatientPreviewModal from '../../components/ui/PatientPreviewModal';
import SearchInput from '../../components/ui/SearchInput';

const COLUMNS = [
  { key: 'name', header: 'Name', render: (row) => fullName(row.patient) },
  { key: 'employeeId', header: 'Employee ID', render: (row) => row.patient?.externalEmployeeId },
  { key: 'agency', header: 'Agency', render: (row) => row.patient?.agencyOffice },
  { key: 'submitted', header: 'Submitted', render: (row) => formatDateTime(row.station1SubmittedAt) },
];

const searchFields = (row) => {
  const p = row.patient ?? {};
  return [fullName(p), p.externalEmployeeId, p.agencyOffice];
};

export default function Station2QueuePage() {
  const navigate = useNavigate();
  const [previewRow, setPreviewRow] = useState(null);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['queue', FORM_STATUS.PENDING_ASSESSMENT],
    queryFn: () => getQueue(FORM_STATUS.PENDING_ASSESSMENT),
    refetchInterval: 15_000,
  });

  const table = useTableControls(data, { searchFields });

  return (
    <Card title="Waiting for Assessment">
      {isLoading && <Skeleton />}
      {error && <ErrorState error={error} onRetry={refetch} />}
      {!isLoading && !error && (
        <div className="flex flex-col gap-3">
          <SearchInput
            id="station2-search"
            value={table.query}
            onChange={table.onSearch}
            placeholder="Search by name, employee ID, or agency"
          />

          <DataTable
            columns={COLUMNS}
            rows={table.pageRows}
            onRowClick={setPreviewRow}
            empty={table.isSearching ? 'No patients match your search.' : 'No patients waiting. Forms submitted at Station 1 appear here automatically.'}
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

      <PatientPreviewModal
        patient={previewRow?.patient}
        confirmLabel="Hand to Patient"
        onClose={() => setPreviewRow(null)}
        onConfirm={() => navigate(`/station2/${previewRow.formID}/kiosk`)}
      />
    </Card>
  );
}
