import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchEmployees } from '../../api/patients.api';
import { fullName } from '../../lib/formatters';
import Field from '../../components/ui/Field';
import Input from '../../components/ui/Input';

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function EmployeeSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const containerRef = useRef(null);
  const debounced = useDebouncedValue(query, 300);

  const { data: results = [] } = useQuery({
    queryKey: ['employees', debounced],
    queryFn: () => searchEmployees(debounced),
    enabled: debounced.trim().length >= 2,
  });

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const choose = (employee) => {
    onSelect(employee);
    setQuery('');
    setOpen(false);
    setHighlight(-1);
  };

  const onKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault();
      choose(results[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Field label="Search Employee" htmlFor="employee-search" hint="Search by name or employee ID">
        <Input
          id="employee-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="e.g. Santos or PHO-1001"
          autoComplete="off"
        />
      </Field>

      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded border border-line bg-surface shadow-lg">
          {results.map((employee, i) => (
            <li key={employee.externalEmployeeId}>
              <button
                type="button"
                onClick={() => choose(employee)}
                className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm ${
                  i === highlight ? 'bg-brand-50' : 'hover:bg-gray-50'
                }`}
              >
                <span className="font-medium text-ink-900">{fullName(employee)}</span>
                <span className="text-xs text-ink-500">{employee.externalEmployeeId}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
