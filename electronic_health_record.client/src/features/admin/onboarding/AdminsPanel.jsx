import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { UserPlus, KeyRound, UserX, UserCheck, Trash2 } from 'lucide-react';
import {
  listAdmins, createAdmin, setAdminActive, deleteAdmin,
} from '../../../api/admins.api';
import { useTableControls } from '../../../hooks/useTableControls';
import { ADMIN_ROLES, isSuperAdmin } from '../../../lib/constants';
import { useAuth } from '../../../auth/useAuth';
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
import Input from '../../../components/ui/Input';
import Field from '../../../components/ui/Field';
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
 * Superadmin-only staff account roster: register an account, suspend its login,
 * or remove it outright.
 *
 * Deactivate is the reversible action and the one to reach for first. Delete is
 * permanent, so it is armed by typing the username and refused by the server for
 * your own account and for the last active superadmin.
 */
export default function AdminsPanel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // Managing other staff accounts is a superadmin capability, matching the
  // server, which authorises both writes for that role alone.
  const canManage = isSuperAdmin(user);
  // The signed-in account's own row. The two id shapes are both in play: the
  // mock session carries `id`, the real one `accountId`.
  const currentAdminID = user?.accountId ?? user?.id ?? null;
  const [createOpen, setCreateOpen] = useState(false);
  // Holds the one-time temporary password until the superadmin dismisses it.
  // The server never returns it again, so it cannot be recovered from the list.
  const [issued, setIssued] = useState(null);
  const [activeTarget, setActiveTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Typing the username is what arms the delete button: the row actions sit next
  // to Deactivate, and the two are one icon apart.
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const { data: admins, isLoading, error, refetch } = useQuery({
    queryKey: ['admins'],
    queryFn: listAdmins,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admins'] });

  const createMutation = useMutation({
    mutationFn: createAdmin,
    onSuccess: (admin) => {
      invalidate();
      setCreateOpen(false);
      setIssued(admin);
    },
  });

  const activeMutation = useMutation({
    mutationFn: ({ adminID, isActive }) => setAdminActive(adminID, isActive),
    onSuccess: (admin) => {
      invalidate();
      setActiveTarget(null);
      toast.success(admin.isActive
        ? `${admin.fullName} can sign in again.`
        : `${admin.fullName} can no longer sign in.`);
    },
    onError: (err) => toast.error(err.message),
  });

  const closeDelete = () => {
    setDeleteTarget(null);
    setDeleteConfirmation('');
  };

  const deleteMutation = useMutation({
    mutationFn: ({ adminID }) => deleteAdmin(adminID),
    onSuccess: (_result, { admin }) => {
      invalidate();
      closeDelete();
      toast.success(`${admin.fullName}'s account was deleted. Records they filled are unchanged.`);
    },
    onError: (err) => toast.error(err.message),
  });

  const table = useTableControls(admins, { searchFields, filterField });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <Card
      flush
      title="Staff Accounts"
      actions={
        <div className="flex w-full flex-col gap-2 @2xl:flex-row @2xl:items-center">
          <SearchInput
            id="admins-search"
            value={table.query}
            onChange={table.onSearch}
            placeholder="Search by name or username"
            className="w-full min-w-0 @2xl:flex-1"
          />
          <div className="flex w-full items-center gap-2 @2xl:w-auto">
            <Select
              value={table.filter}
              onChange={(e) => table.onFilter(e.target.value)}
              options={ROLE_FILTER_OPTIONS}
              className="min-w-0 flex-1 @2xl:w-44 @2xl:flex-none"
            />
            <Button
              type="button"
              variant="teal"
              size="md"
              className="min-w-0 flex-1 @2xl:w-44 @2xl:flex-none"
              onClick={() => setCreateOpen(true)}
            >
              <UserPlus size={16} />
              Register Admin
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <DataTable
          columns={COLUMNS}
          rows={table.pageRows.map((a) => ({ ...a, id: a.adminID }))}
          rowActionsHeader={canManage ? 'Actions' : undefined}
          rowActions={canManage ? (row) => {
            // Your own account is not actionable from here: deactivating or
            // deleting the session you are using cannot be undone from inside
            // the app, and the server refuses both anyway.
            if (row.adminID === currentAdminID) {
              return <span className="text-xs text-ink-400">Your account</span>;
            }
            return (
              <div className="flex items-center justify-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  className={row.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-700 hover:bg-emerald-50'}
                  title={row.isActive ? 'Deactivate account' : 'Reactivate account'}
                  onClick={() => setActiveTarget(row)}
                >
                  {row.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-rose-600 hover:bg-rose-50"
                  title="Delete account permanently"
                  onClick={() => {
                    setDeleteConfirmation('');
                    setDeleteTarget(row);
                  }}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            );
          } : undefined}
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

      <Modal
        open={Boolean(activeTarget)}
        title={activeTarget?.isActive ? 'Deactivate this account?' : 'Reactivate this account?'}
        onClose={() => setActiveTarget(null)}
        footer={
          <>
            <Button type="button" variant="secondary" size="md" onClick={() => setActiveTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={activeTarget?.isActive ? 'danger' : 'teal'}
              size="md"
              disabled={activeMutation.isPending}
              onClick={() => activeMutation.mutate({
                adminID: activeTarget.adminID,
                isActive: !activeTarget.isActive,
              })}
            >
              {activeMutation.isPending
                ? 'Saving…'
                : activeTarget?.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          </>
        }
      >
        {activeTarget?.isActive ? (
          <>
            {activeTarget.fullName} will not be able to sign in, and any session they
            currently hold ends immediately. Records they already filled are unaffected.
          </>
        ) : (
          <>
            {activeTarget?.fullName} will be able to sign in again with their existing
            password.
          </>
        )}
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete this account permanently?"
        onClose={closeDelete}
        footer={
          <>
            <Button type="button" variant="secondary" size="md" onClick={closeDelete}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              disabled={
                deleteMutation.isPending
                || deleteConfirmation.trim().toLowerCase() !== (deleteTarget?.username ?? '').toLowerCase()
              }
              onClick={() => deleteMutation.mutate({
                adminID: deleteTarget.adminID,
                admin: deleteTarget,
              })}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p>
            {deleteTarget?.fullName}&apos;s account and login will be removed.{' '}
            <strong>This cannot be undone.</strong>
          </p>
          <p className="text-ink-600">
            Records they filled are kept, and continue to show their name as the staff member
            who took the vitals or ran the assessment. Only the account is deleted. To block
            sign-in while keeping the account, use Deactivate instead.
          </p>
          <Field
            label={`Type "${deleteTarget?.username ?? ''}" to confirm`}
            htmlFor="delete-admin-confirm"
          >
            <Input
              id="delete-admin-confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={deleteTarget?.username ?? ''}
              autoComplete="off"
            />
          </Field>
        </div>
      </Modal>

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
