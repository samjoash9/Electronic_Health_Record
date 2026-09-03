import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchEmployees } from '../../api/patients.api';
import { fullName } from '../../lib/formatters';
import Field from '../../components/ui/Field';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';

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
  const debounced = useDebouncedValue(query, 300);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['employees', debounced],
    queryFn: () => searchEmployees(debounced),
  });

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">
      <Field label="Search Employee" htmlFor="employee-search" hint="Search by name or employee ID">
        <Input
          id="employee-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Santos or PHO-1001"
          autoComplete="off"
        />
      </Field>

      <DataTable
        columns={COLUMNS}
        rows={pageRows}
        onRowClick={onSelect}
        empty={isFetching ? 'Searching…' : 'No matching employees.'}
      />

      {results.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-ink-500">
          <span>
            Page {currentPage} of {totalPages} ({results.length} employees)
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
