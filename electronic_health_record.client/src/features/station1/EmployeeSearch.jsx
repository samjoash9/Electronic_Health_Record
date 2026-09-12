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
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    width: '28%',
    render: (e) => fullName(e),
    sortValue: (e) => `${e.surname ?? ''}, ${e.firstName ?? ''}`.toLowerCase(),
  },
  {
    key: 'position', header: 'Position', sortable: true, width: '27%', sortValue: (e) => (e.position ?? '').toLowerCase(),
  },
  {
    key: 'agencyOffice', header: 'Agency/Office', sortable: true, width: '27%', sortValue: (e) => (e.agencyOffice ?? '').toLowerCase(),
  },
  {
    key: 'contactNo',
    header: 'Contact No.',
    sortable: true,
    width: '18%',
    render: (e) => e.contactNo || '—',
    sortValue: (e) => (e.contactNo ?? '').toLowerCase(),
  },
];

const PAGE_SIZE = 10;

export default function EmployeeSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [previewEmployee, setPreviewEmployee] = useState(null);
  const [sortKey, setSortKey] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const debounced = useDebouncedValue(query, 300);

  const { data: rawResults = [], isFetching } = useQuery({
    queryKey: ['employees', debounced],
    queryFn: () => searchEmployees(debounced),
  });

  const sortColumn = COLUMNS.find((c) => c.key === sortKey);
  const results = sortColumn
    ? [...rawResults].sort((a, b) => {
      const va = sortColumn.sortValue(a);
      const vb = sortColumn.sortValue(b);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDirection === 'desc' ? -cmp : cmp;
    })
    : rawResults;

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setPage(1);
  };

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
          placeholder="Search by name or agency, e.g. Santos"
        />

        <DataTable
          columns={COLUMNS}
          rows={pageRows}
          onRowClick={setPreviewEmployee}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
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
