import { useMemo, useState } from 'react';

export const DEFAULT_PAGE_SIZE = 10;

/**
 * Search + filter + pagination for a client-side table, shared by every list
 * screen so they page and reset identically.
 *
 * `searchFields` maps a row to the strings the query is matched against;
 * `filterField` maps a row to the value the filter's selected value is compared
 * with. Both filters are skipped when not supplied.
 *
 * Changing the query or the filter resets to page 1: staying on page 4 of a
 * result set that just shrank to one page shows an empty table.
 */
export function useTableControls(rows, {
  searchFields,
  filterField,
  pageSize = DEFAULT_PAGE_SIZE,
  initialFilter = 'all',
} = {}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(initialFilter);
  const [page, setPage] = useState(1);

  const allRows = rows ?? [];
  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    const byFilter = filterField && filter !== 'all'
      ? allRows.filter((row) => filterField(row) === filter)
      : allRows;
    if (!q || !searchFields) return byFilter;
    return byFilter.filter((row) =>
      searchFields(row).some((field) => String(field ?? '').toLowerCase().includes(q)),
    );
    // allRows is a fresh array on every render when `rows` is undefined, so key
    // the memo on the incoming reference instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, filter, filterField, searchFields]);

  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  // Clamp rather than reset: a refetch that shrinks the list should not throw
  // the reader off the end of it.
  const currentPage = Math.min(page, totalPages);
  const pageRows = results.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearch = (value) => {
    setQuery(value);
    setPage(1);
  };

  const handleFilter = (value) => {
    setFilter(value);
    setPage(1);
  };

  return {
    query,
    onSearch: handleSearch,
    filter,
    onFilter: handleFilter,
    page: currentPage,
    totalPages,
    setPage,
    pageRows,
    total: results.length,
    isSearching: q.length > 0,
    isFiltered: Boolean(filterField) && filter !== 'all',
  };
}
