import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, KeyRound } from 'lucide-react';
import { listAdmins, createAdmin } from '../../../api/admins.api';
import { useTableControls } from '../../../hooks/useTableControls';
import { ADMIN_ROLES } from '../../../lib/constants';
import Card from '../../../components/ui/Card';
import Skeleton from '../../../components/ui/Skeleton';
import ErrorState from '../../../components/ui/ErrorState';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import DataTable from '../../../components/ui/DataTable';
import TableFooter from '../../../components/ui/TableFooter';
import SearchInput from '../../../components/ui/SearchInput';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';
import AdminFormModal from './AdminFormModal';

const ROLE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Accounts' },
  { value: ADMIN_ROLES.ADMIN, label: 'Admins' },
  { value: ADMIN_ROLES.SUPERADMIN, label: 'Superadmins' },
];

const COLUMNS = [
  { key: 'fullName', header: 'Name' },
  { key: 'username', header: 'Username' },
  {
    key: 'role',
    header: 'Role',
    render: (a) => (a.role === ADMIN_ROLES.SUPERADMIN
      ? <Badge tone="info">Superadmin</Badge>
      : <Badge>Admin</Badge>),
  },
  { key: 'contactNo', header: 'Contact No.', render: (a) => a.contactNo || '—' },
  {
    key: 'status',
    header: 'Status',
    render: (a) => {
      if (!a.isActive) return <Badge tone="danger" dot>Deactivated</Badge>;
      if (a.mustChangePassword) return <Badge tone="warn" dot>Password not set</Badge>;
      return <Badge tone="success" dot>Active</Badge>;
    },
  },
];

const searchFields = (a) => [a.fullName, a.username, a.contactNo];
const filterField = (a) => a.role;

/**
 * Superadmin-only staff account roster. Creation is the only write here: the
 * server's provisioning endpoint does not edit or deactivate an existing
 * admin, so this panel deliberately offers no row actions.
 */
export default function AdminsPanel() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  // Holds the one-time temporary password until the superadmin dismisses it.
  // The server never returns it again, so it cannot be recovered from the list.
  const [issued, setIssued] = useState(null);

  const { data: admins, isLoading, error, refetch } = useQuery({
    queryKey: ['admins'],
    queryFn: listAdmins,
  });

  const createMutation = useMutation({
    mutationFn: createAdmin,
    onSuccess: (admin) => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setCreateOpen(false);
      setIssued(admin);
    },
  });

  const table = useTableControls(admins, { searchFields, filterField });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <Card
      flush
      title="Staff Accounts"
      actions={
        <div className="flex items-center gap-2">
          <SearchInput
            id="admins-search"
            value={table.query}
            onChange={table.onSearch}
            placeholder="Search by name or username"
            className="w-72"
          />
          <Select
            value={table.filter}
            onChange={(e) => table.onFilter(e.target.value)}
            options={ROLE_FILTER_OPTIONS}
            className="w-44"
          />
          <Button type="button" variant="teal" size="md" onClick={() => setCreateOpen(true)}>
            <UserPlus size={16} />
            Register Admin
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <DataTable
          columns={COLUMNS}
          rows={table.pageRows.map((a) => ({ ...a, id: a.adminID }))}
          empty={table.isSearching || table.isFiltered
            ? 'No accounts match your search.'
            : 'No staff accounts yet.'}
        />

        <TableFooter
          page={table.page}
          totalPages={table.totalPages}
          total={table.total}
          noun="account"
          onPageChange={table.setPage}
        />
      </div>

      {createOpen && (
        <AdminFormModal
          isPending={createMutation.isPending}
          error={createMutation.error}
          onSubmit={(values) => createMutation.mutate(values)}
          onClose={() => {
            createMutation.reset();
            setCreateOpen(false);
          }}
        />
      )}

      {issued && (
        <Modal
          open
          size="md"
          title="Admin registered"
          onClose={() => setIssued(null)}
          footer={
            <Button type="button" variant="teal" size="md" onClick={() => setIssued(null)}>
              Done
            </Button>
          }
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-700">
              <span className="font-semibold">{issued.fullName}</span> can now
              sign in as <span className="font-semibold">{issued.username}</span>.
            </p>

            <div className="rounded-xl border border-line bg-canvas p-4">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-ink-700 uppercase">
                <KeyRound size={14} className="text-[#0e7d6b]" />
                Temporary password
              </p>
              <p className="font-mono text-lg font-semibold text-ink-900">
                {issued.temporaryPassword}
              </p>
            </div>

            <p className="text-sm text-ink-500">
              Hand this over in person or through a channel you trust. It is not
              shown again, and the account is asked to replace it at first
              sign-in.
            </p>
          </div>
        </Modal>
      )}
    </Card>
  );
}
