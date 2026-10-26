import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  UserX, UserCheck, Trash2, Briefcase, LogIn, CalendarCheck,
} from 'lucide-react';
import {
  listPatientAccounts, setPatientAccountActive, deletePatient,
} from '../../../api/patients.api';
import { useTableControls } from '../../../hooks/useTableControls';
import { useCardLayout } from '../../../hooks/useCardLayout';
import { formatDate, formatDateTime } from '../../../lib/formatters';
import { isSuperAdmin } from '../../../lib/constants';
import { useAuth } from '../../../auth/useAuth';
import Card from '../../../components/ui/Card';
import RecordCardList from '../../../components/ui/RecordCardList';
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

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Patients' },
  { value: 'onboarded', label: 'Onboarded' },
  { value: 'never-signed-in', label: 'Never signed in' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'not-onboarded', label: 'Not onboarded' },
];

/** A login is usable only while its status is "Active" -- see AuthController. */
function isAccountActive(account) {
  return String(account?.status ?? '').toLowerCase() === 'active';
}

/**
 * The states a row can be in, kept as one function so the Status column and
 * the filter dropdown can never disagree about what a row is:
 *
 *   not-onboarded   — a Patient row exists (HR sync) but Station 1 has never
 *                     registered them, so there is no login at all.
 *   suspended       — the login exists but has been switched off, so the
 *                     patient cannot sign in whatever their password is.
 *   never-signed-in — provisioned at Station 1, still on the default password.
 *   onboarded       — the patient has signed in and chosen their own password.
 *
 * Suspension is checked before the password state: a suspended account cannot
 * sign in, so reporting it as "never signed in" would hide why.
 */
function accountState(p) {
  if (!p.account) return 'not-onboarded';
  if (!isAccountActive(p.account)) return 'suspended';
  return p.account.mustChangePassword ? 'never-signed-in' : 'onboarded';
}

const patientName = (p) => `${p.firstName} ${p.middleName ? `${p.middleName} ` : ''}${p.surname}`;

const accountBadge = (p) => {
  const state = accountState(p);
  if (state === 'not-onboarded') return <Badge dot>Not onboarded</Badge>;
  if (state === 'suspended') return <Badge tone="danger" dot>Suspended</Badge>;
  if (state === 'never-signed-in') return <Badge tone="warn" dot>Never signed in</Badge>;
  return <Badge tone="success" dot>Active</Badge>;
};

const COLUMNS = [
  { key: 'name', header: 'Name', render: patientName },
  // Employee ID is deliberately not a column: it identifies the person outside
  // this system, and nothing on this panel needs it. It stays in searchFields
  // below, so an admin holding the ID can still find the row.
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
  { key: 'status', header: 'Account', render: accountBadge },
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

// Card width the six columns and the two action icons need side by side;
// below it the patients show as cards.
const TABLE_MIN_WIDTH = 950;

export default function PatientsPanel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // Both actions here are superadmin-only, matching the server.
  const canManage = isSuperAdmin(user);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Deleting a patient destroys their medical history, so the confirmation is
  // typed rather than a single click.
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const { ref: cardRef, isMobile, showCards } = useCardLayout(TABLE_MIN_WIDTH);

  const { data: patients, isLoading, error, refetch } = useQuery({
    queryKey: ['patient-accounts'],
    queryFn: listPatientAccounts,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['patient-accounts'] });

  const closeDelete = () => {
    setDeleteTarget(null);
    setDeleteConfirmation('');
  };

  const suspendMutation = useMutation({
    mutationFn: ({ patientID, isActive }) => setPatientAccountActive(patientID, isActive),
    onSuccess: (_account, { patient, isActive }) => {
      invalidate();
      setSuspendTarget(null);
      toast.success(isActive
        ? `${patient.firstName} ${patient.surname} can sign in to the portal again.`
        : `${patient.firstName} ${patient.surname} can no longer sign in to the portal.`);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ patientID }) => deletePatient(patientID),
    onSuccess: (_result, { patient }) => {
      invalidate();
      closeDelete();
      toast.success(`${patient.firstName} ${patient.surname} and their records were deleted.`);
    },
    onError: (err) => toast.error(err.message),
  });

  const table = useTableControls(patients, { searchFields, filterField: accountState });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const emptyMessage = table.isSearching || table.isFiltered
    ? 'No patients match your search.'
    : 'No patients registered yet.';

  // One list of a row's actions, rendered as icon buttons in the table and as
  // a menu on the cards.
  const actionsFor = (row) => {
    const active = isAccountActive(row.account);
    return [
      {
        key: 'suspend',
        label: active ? 'Suspend sign-in' : 'Restore sign-in',
        icon: active ? UserX : UserCheck,
        // No login to suspend on a patient Station 1 has never registered, so
        // the control is disabled rather than hidden -- keeping the table's
        // icon row the same width down the column.
        disabled: !row.account,
        tone: !row.account
          ? undefined
          : active ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-700 hover:bg-emerald-50',
        title: !row.account
          ? 'No portal account to suspend'
          : active ? 'Suspend portal sign-in' : 'Restore portal sign-in',
        onSelect: () => setSuspendTarget(row),
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: Trash2,
        tone: 'text-rose-600 hover:bg-rose-50',
        title: 'Delete patient and all their records',
        onSelect: () => {
          setDeleteConfirmation('');
          setDeleteTarget(row);
        },
      },
    ];
  };

  return (
    <Card
      ref={cardRef}
      flush
      bare={isMobile}
      title="Patient Accounts"
      actions={
        <div className="flex w-full flex-col gap-2 @2xl:flex-row @2xl:items-center">
          <SearchInput
            id="patients-search"
            value={table.query}
            onChange={table.onSearch}
            placeholder="Search by name, employee ID, or username"
            className="w-full min-w-0 @2xl:flex-1"
          />
          <Select
            value={table.filter}
            onChange={(e) => table.onFilter(e.target.value)}
            options={STATUS_FILTER_OPTIONS}
            className="w-1/2 self-start @2xl:w-52 @2xl:self-auto"
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

        {showCards ? (
          <RecordCardList
            rows={table.pageRows}
            rowKey={(p) => p.patientID}
            empty={emptyMessage}
            card={(p) => ({
              avatarName: `${p.firstName} ${p.surname}`,
              title: patientName(p),
              subtitle: p.account?.username ?? '—',
              badges: accountBadge(p),
              meta: [
                p.position && { icon: Briefcase, label: p.position },
                p.account?.lastLoginAt && {
                  icon: LogIn, label: `Last sign-in ${formatDateTime(p.account.lastLoginAt)}`,
                },
                p.account?.provisionedAt && {
                  icon: CalendarCheck, label: `Registered ${formatDate(p.account.provisionedAt)}`,
                },
              ].filter(Boolean),
              actions: canManage ? actionsFor(p) : [],
              actionsLabel: `Actions for ${patientName(p)}`,
            })}
          />
        ) : (
          <DataTable
            columns={COLUMNS}
            rows={table.pageRows.map((p) => ({ ...p, id: p.patientID }))}
            rowActionsHeader={canManage ? 'Actions' : undefined}
            rowActions={canManage ? (row) => (
              <div className="flex items-center justify-center gap-1">
                {actionsFor(row).map(({ key, icon: Icon, tone, title, disabled, onSelect }) => (
                  <Button
                    key={key}
                    type="button"
                    variant="ghost"
                    disabled={disabled}
                    className={tone}
                    title={title}
                    onClick={onSelect}
                  >
                    <Icon size={15} />
                  </Button>
                ))}
              </div>
            ) : undefined}
            empty={emptyMessage}
          />
        )}

        <TableFooter
          page={table.page}
          totalPages={table.totalPages}
          total={table.total}
          noun="patient"
          onPageChange={table.setPage}
          compact={isMobile}
        />
      </div>

      <Modal
        open={Boolean(suspendTarget)}
        title={isAccountActive(suspendTarget?.account)
          ? 'Suspend this portal account?'
          : 'Restore this portal account?'}
        onClose={() => setSuspendTarget(null)}
        footer={
          <>
            <Button type="button" variant="secondary" size="md" onClick={() => setSuspendTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={isAccountActive(suspendTarget?.account) ? 'danger' : 'teal'}
              size="md"
              disabled={suspendMutation.isPending}
              onClick={() => suspendMutation.mutate({
                patientID: suspendTarget.patientID,
                isActive: !isAccountActive(suspendTarget.account),
                patient: suspendTarget,
              })}
            >
              {suspendMutation.isPending
                ? 'Saving…'
                : isAccountActive(suspendTarget?.account) ? 'Suspend' : 'Restore'}
            </Button>
          </>
        }
      >
        {isAccountActive(suspendTarget?.account) ? (
          <>
            {suspendTarget?.firstName} {suspendTarget?.surname} will not be able to sign in to the
            patient portal. Their medical records are untouched, they can still be seen at any
            station, and this can be undone at any time.
          </>
        ) : (
          <>
            {suspendTarget?.firstName} {suspendTarget?.surname} will be able to sign in to the
            patient portal again with their existing password.
          </>
        )}
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete this patient and all their records?"
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
                || deleteConfirmation.trim().toLowerCase() !== (deleteTarget?.surname ?? '').toLowerCase()
              }
              onClick={() => deleteMutation.mutate({
                patientID: deleteTarget.patientID,
                patient: deleteTarget,
              })}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete everything'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p>
            This permanently deletes {deleteTarget?.firstName} {deleteTarget?.surname} and their
            entire medical history: <strong>every wellness form, assessment, dental and vision
            record, billing charge and audit entry</strong>, along with their portal login.
          </p>
          <p className="text-ink-600">
            Nothing is archived and this cannot be undone. To stop them signing in while keeping
            their records, suspend the account instead.
          </p>
          <Field
            label={`Type "${deleteTarget?.surname ?? ''}" to confirm`}
            htmlFor="delete-patient-confirm"
          >
            <Input
              id="delete-patient-confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={deleteTarget?.surname ?? ''}
              autoComplete="off"
            />
          </Field>
        </div>
      </Modal>
    </Card>
  );
}
