import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchEmployees } from '../../api/patients.api';
import { fullName } from '../../lib/formatters';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import PatientPreviewModal from '../../components/ui/PatientPreviewModal';
import SearchInput from '../../components/ui/SearchInput';

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

const COLUMNS = [
  { key: 'name', header: 'Name', render: (e) => fullName(e) },
  { key: 'externalEmployeeId', header: 'Employee ID' },
  { key: 'position', header: 'Position' },
  { key: 'agencyOffice', header: 'Agency/Office' },
];

const PAGE_SIZE = 10;

export default function EmployeeSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [previewEmployee, setPreviewEmployee] = useState(null);
  const debounced = useDebouncedValue(query, 300);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['employees', debounced],
    queryFn: () => searchEmployees(debounced),
  });

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <Card>
      <div className="flex flex-col gap-3">
        <SearchInput
          id="employee-search"
          label="Search Employee"
          value={query}
          onChange={setQuery}
          placeholder="Search by name or employee ID, e.g. Santos or PHO-1001"
        />

        <DataTable
          columns={COLUMNS}
          rows={pageRows}
          onRowClick={setPreviewEmployee}
          empty={isFetching ? 'Searching…' : 'No matching employees.'}
        />

        {results.length > 0 && (
          <div className="flex items-center justify-between text-sm text-ink-500">
            <span>
              Page {currentPage} of {totalPages} ({results.length} employees)
            </span>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <PatientPreviewModal
        patient={previewEmployee}
        confirmLabel="Select Employee"
        onClose={() => setPreviewEmployee(null)}
        onConfirm={() => {
          onSelect(previewEmployee);
          setPreviewEmployee(null);
        }}
      />
    </Card>
  );
}
