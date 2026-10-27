import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Building2, Phone } from 'lucide-react';
import { searchEmployees } from '../../api/patients.api';
import { fullName } from '../../lib/formatters';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useCardLayout } from '../../hooks/useCardLayout';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PatientPreviewModal from '../../components/ui/PatientPreviewModal';
import RecordCardList from '../../components/ui/RecordCardList';
import SearchInput from '../../components/ui/SearchInput';
import TableFooter from '../../components/ui/TableFooter';

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

// Card width the four columns need side by side -- position and agency names
// run long; below it the results show as cards.
const TABLE_MIN_WIDTH = 720;

export default function EmployeeSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [previewEmployee, setPreviewEmployee] = useState(null);
  const [sortKey, setSortKey] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const debounced = useDebouncedValue(query, 300);
  const { ref: cardRef, isMobile, showCards } = useCardLayout(TABLE_MIN_WIDTH);

  const { data: rawResults = [], isFetching } = useQuery({
    queryKey: ['employees', debounced],
    queryFn: () => searchEmployees(debounced),
  });

  const searchTerms = debounced.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const filteredList = searchTerms.length > 0
    ? rawResults.filter((emp) => {
      const fullName = `${emp.surname ?? ''} ${emp.firstName ?? ''} ${emp.middleName ?? ''} ${emp.externalEmployeeId ?? ''}`.toLowerCase();
      return searchTerms.every((term) => fullName.includes(term));
    })
    : rawResults;

  const sortColumn = COLUMNS.find((c) => c.key === sortKey);
  const results = sortColumn
    ? [...filteredList].sort((a, b) => {
      const va = sortColumn.sortValue(a);
      const vb = sortColumn.sortValue(b);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDirection === 'desc' ? -cmp : cmp;
    })
    : filteredList;

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
  const emptyMessage = isFetching ? 'Searching…' : 'No matching employees.';

  return (
    <Card ref={cardRef} flush={isMobile} bare={isMobile}>
      <div className="flex flex-col gap-3">
        <SearchInput
          id="employee-search"
          label="Search Employee"
          value={query}
          onChange={setQuery}
          placeholder="Search by name e.g. Santos"
        />

        {showCards ? (
          <RecordCardList
            rows={pageRows}
            rowKey={(e) => e.externalEmployeeId}
            onOpen={setPreviewEmployee}
            empty={emptyMessage}
            card={(e) => ({
              avatarName: `${e.firstName ?? ''} ${e.surname ?? ''}`,
              title: fullName(e),
              meta: [
                e.position && { icon: Briefcase, label: e.position },
                e.agencyOffice && { icon: Building2, label: e.agencyOffice },
                e.contactNo && { icon: Phone, label: e.contactNo },
              ].filter(Boolean),
            })}
          />
        ) : (
          <DataTable
            columns={COLUMNS}
            rows={pageRows}
            onRowClick={setPreviewEmployee}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            empty={emptyMessage}
          />
        )}

        <TableFooter
          page={currentPage}
          totalPages={totalPages}
          total={results.length}
          noun="employee"
          onPageChange={setPage}
          compact={isMobile}
        />
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
