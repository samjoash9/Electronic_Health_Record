import { useQuery } from '@tanstack/react-query';
import { listPatientAccounts } from '../../../api/patients.api';
import { useTableControls } from '../../../hooks/useTableControls';
import { formatDate, formatDateTime } from '../../../lib/formatters';
import Card from '../../../components/ui/Card';
import Skeleton from '../../../components/ui/Skeleton';
import ErrorState from '../../../components/ui/ErrorState';
import Badge from '../../../components/ui/Badge';
import DataTable from '../../../components/ui/DataTable';
import TableFooter from '../../../components/ui/TableFooter';
import SearchInput from '../../../components/ui/SearchInput';
import Select from '../../../components/ui/Select';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Patients' },
  { value: 'onboarded', label: 'Onboarded' },
  { value: 'never-signed-in', label: 'Never signed in' },
  { value: 'not-onboarded', label: 'Not onboarded' },
];

/**
 * Three states a row can be in, kept as one function so the Status column and
 * the filter dropdown can never disagree about what a row is:
 *
 *   not-onboarded   — a Patient row exists (HR sync) but Station 1 has never
 *                     registered them, so there is no login at all.
 *   never-signed-in — provisioned at Station 1, still on the default password.
 *   onboarded       — the patient has signed in and chosen their own password.
 */
function accountState(p) {
  if (!p.account) return 'not-onboarded';
  return p.account.mustChangePassword ? 'never-signed-in' : 'onboarded';
}

const COLUMNS = [
  {
    key: 'name',
    header: 'Name',
    render: (p) => `${p.firstName} ${p.middleName ? `${p.middleName} ` : ''}${p.surname}`,
  },
  { key: 'externalEmployeeId', header: 'Employee ID' },
  {
    key: 'username',
    header: 'Username',
    // The whole point of this panel: the handle the patient signs in with,
    // captured at Station 1 and not shown anywhere else.
    render: (p) => (p.account
      ? <span className="font-medium text-ink-900">{p.account.username}</span>
      : <span className="text-ink-400">—</span>),
  },
  { key: 'position', header: 'Position', render: (p) => p.position || '—' },
  {
    key: 'status',
    header: 'Account',
    render: (p) => {
      const state = accountState(p);
      if (state === 'not-onboarded') return <Badge dot>Not onboarded</Badge>;
      if (state === 'never-signed-in') return <Badge tone="warn" dot>Never signed in</Badge>;
      return <Badge tone="success" dot>Active</Badge>;
    },
  },
  {
    key: 'lastLoginAt',
    header: 'Last Sign-in',
    render: (p) => (p.account?.lastLoginAt ? formatDateTime(p.account.lastLoginAt) : '—'),
  },
  {
    key: 'provisionedAt',
    header: 'Registered',
    render: (p) => (p.account?.provisionedAt ? formatDate(p.account.provisionedAt) : '—'),
  },
];

const searchFields = (p) => [
  p.surname, p.firstName, p.middleName, p.externalEmployeeId, p.account?.username,
];

export default function PatientsPanel() {
  const { data: patients, isLoading, error, refetch } = useQuery({
    queryKey: ['patient-accounts'],
    queryFn: listPatientAccounts,
  });

  const table = useTableControls(patients, { searchFields, filterField: accountState });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <Card
      flush
      title="Patient Accounts"
      actions={
        <div className="flex items-center gap-2">
          <SearchInput
            id="patients-search"
            value={table.query}
            onChange={table.onSearch}
            placeholder="Search by name, employee ID, or username"
            className="w-80"
          />
          <Select
            value={table.filter}
            onChange={(e) => table.onFilter(e.target.value)}
            options={STATUS_FILTER_OPTIONS}
            className="w-52"
          />
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs text-ink-500">
          Portal sign-ins issued at Station 1. Usernames are read-only here — the handle is
          chosen with the patient during their first registration and cannot be changed
          afterwards.
        </p>

        <DataTable
          columns={COLUMNS}
          rows={table.pageRows.map((p) => ({ ...p, id: p.patientID }))}
          empty={table.isSearching || table.isFiltered
            ? 'No patients match your search.'
            : 'No patients registered yet.'}
        />

        <TableFooter
          page={table.page}
          totalPages={table.totalPages}
          total={table.total}
          noun="patient"
          onPageChange={table.setPage}
        />
      </div>
    </Card>
  );
}
