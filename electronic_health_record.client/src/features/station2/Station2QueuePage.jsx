import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getQueue } from '../../api/forms.api';
import { FORM_STATUS } from '../../lib/constants';
import { fullName, formatDateTime } from '../../lib/formatters';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
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

const PAGE_SIZE = 10;

export default function Station2QueuePage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [previewRow, setPreviewRow] = useState(null);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['queue', FORM_STATUS.PENDING_ASSESSMENT],
    queryFn: () => getQueue(FORM_STATUS.PENDING_ASSESSMENT),
    refetchInterval: 15_000,
  });

  const allResults = data ?? [];
  const q = query.trim().toLowerCase();
  const results = q
    ? allResults.filter((row) => {
        const p = row.patient ?? {};
        return (
          fullName(p).toLowerCase().includes(q)
          || p.externalEmployeeId?.toLowerCase().includes(q)
          || p.agencyOffice?.toLowerCase().includes(q)
        );
      })
    : allResults;
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (value) => {
    setQuery(value);
    setPage(1);
  };

  return (
    <Card title="Waiting for Assessment">
      {isLoading && <Skeleton />}
      {error && <ErrorState error={error} onRetry={refetch} />}
      {!isLoading && !error && (
        <div className="flex flex-col gap-3">
          <SearchInput
            id="station2-search"
            value={query}
            onChange={handleSearch}
            placeholder="Search by name, employee ID, or agency"
          />

          <DataTable
            columns={COLUMNS}
            rows={pageRows}
            onRowClick={setPreviewRow}
            empty={q ? 'No patients match your search.' : 'No patients waiting. Forms submitted at Station 1 appear here automatically.'}
          />

          {results.length > 0 && (
            <div className="flex items-center justify-between text-sm text-ink-500">
              <span>
                Page {currentPage} of {totalPages} ({results.length} patients)
              </span>
              <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
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
