import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { UserPlus, Pencil } from 'lucide-react';
import { listEmployees, createEmployee, updateEmployee } from '../../../api/onboarding.api';
import { listPatientAccounts } from '../../../api/patients.api';
import { useTableControls } from '../../../hooks/useTableControls';
import { formatDate } from '../../../lib/formatters';
import Card from '../../../components/ui/Card';
import Skeleton from '../../../components/ui/Skeleton';
import ErrorState from '../../../components/ui/ErrorState';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import DataTable from '../../../components/ui/DataTable';
import TableFooter from '../../../components/ui/TableFooter';
import SearchInput from '../../../components/ui/SearchInput';
import EmployeeFormModal from './EmployeeFormModal';

const COLUMNS = [
  { key: 'name', header: 'Name', render: (e) => `${e.firstName} ${e.middleName ? `${e.middleName} ` : ''}${e.surname}` },
  { key: 'externalEmployeeId', header: 'Employee ID' },
  {
    key: 'username',
    header: 'Portal Account',
    // Employees and patients are separate tables joined on externalEmployeeId:
    // an employee only has a username once Station 1 has registered them.
    render: (e) => (e.username
      ? <span className="font-medium text-ink-900">{e.username}</span>
      : <span className="text-ink-400">Not onboarded</span>),
  },
  { key: 'position', header: 'Position', render: (e) => e.position || '—' },
  { key: 'agencyOffice', header: 'Agency/Office', render: (e) => e.agencyOffice || '—' },
  { key: 'birthdate', header: 'Birthdate', render: (e) => formatDate(e.birthdate) },
  {
    key: 'source',
    header: 'Source',
    render: (e) => (e.isLocallyAdded
      ? <Badge tone="info">Added here</Badge>
      : <Badge>HR record</Badge>),
  },
];

const searchFields = (e) => [e.surname, e.firstName, e.middleName, e.externalEmployeeId, e.position, e.username];

export default function EmployeesPanel() {
  const queryClient = useQueryClient();
  const [formTarget, setFormTarget] = useState(null);

  const { data: employees, isLoading, error, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: listEmployees,
  });

  // The portal usernames Station 1 issued, keyed by employee ID. Kept as its own
  // query rather than folded into /employees: the directory is the HR mirror and
  // knows nothing about logins, and a failure here must not blank the table --
  // hence no error branch, the column just reads "Not onboarded".
  const { data: patientAccounts } = useQuery({
    queryKey: ['patient-accounts'],
    queryFn: listPatientAccounts,
  });

  const usernameByEmployeeId = useMemo(() => Object.fromEntries(
    (patientAccounts ?? [])
      .filter((p) => p.account)
      .map((p) => [p.externalEmployeeId, p.account.username]),
  ), [patientAccounts]);

  const employeeRows = useMemo(() => (employees ?? []).map((e) => ({
    ...e,
    username: usernameByEmployeeId[e.externalEmployeeId] ?? null,
  })), [employees, usernameByEmployeeId]);

  // Prefix match, so Station 1's own ['employees', query] searches go stale too.
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['employees'] });

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: (employee) => {
      invalidate();
      setFormTarget(null);
      toast.success(`${employee.firstName} ${employee.surname} can now be found at Station 1.`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ externalEmployeeId, values }) => updateEmployee(externalEmployeeId, values),
    onSuccess: () => {
      invalidate();
      setFormTarget(null);
      toast.success('Employee record updated.');
    },
  });

  const table = useTableControls(employeeRows, { searchFields });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const editing = formTarget && formTarget !== 'create' ? formTarget : null;

  return (
    <Card
      flush
      title="Employee Directory"
      actions={
        <div className="flex items-center gap-2">
          <SearchInput
            id="employees-search"
            value={table.query}
            onChange={table.onSearch}
            placeholder="Search by name, employee ID, position, or username"
            className="w-80"
          />
          <Button type="button" variant="teal" size="md" onClick={() => setFormTarget('create')}>
            <UserPlus size={16} />
            Add Employee
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs text-ink-500">
          The list Station 1 searches when registering a patient. An employee has no sign-in
          until Station 1 registers them — the username issued there shows under Portal Account.
        </p>

        <DataTable
          columns={COLUMNS}
          rows={table.pageRows.map((e) => ({ ...e, id: e.externalEmployeeId }))}
          rowActions={(row) => (
            <Button
              type="button"
              variant="ghost"
              title="Edit record"
              onClick={() => setFormTarget(row)}
            >
              <Pencil size={15} />
            </Button>
          )}
          empty={table.isSearching
            ? 'No employees match your search.'
            : 'The directory is empty.'}
        />

        <TableFooter
          page={table.page}
          totalPages={table.totalPages}
          total={table.total}
          noun="employee"
          onPageChange={table.setPage}
        />
      </div>

      {formTarget && (
        <EmployeeFormModal
          key={editing?.externalEmployeeId ?? 'create'}
          employee={editing}
          isPending={createMutation.isPending || updateMutation.isPending}
          error={editing ? updateMutation.error : createMutation.error}
          onSubmit={(values) => (editing
            ? updateMutation.mutate({
              externalEmployeeId: editing.externalEmployeeId, values,
            })
            : createMutation.mutate(values))}
          onClose={() => {
            createMutation.reset();
            updateMutation.reset();
            setFormTarget(null);
          }}
        />
      )}
    </Card>
  );
}
