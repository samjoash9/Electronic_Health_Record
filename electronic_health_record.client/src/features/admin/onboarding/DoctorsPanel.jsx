import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { UserPlus, Pencil, KeyRound, UserX, UserCheck, Trash2 } from 'lucide-react';
import {
  listPhysicians, createPhysician, updatePhysician,
  setPhysicianActive, resetPhysicianPassword, deletePhysician,
} from '../../../api/onboarding.api';
import { useTableControls } from '../../../hooks/useTableControls';
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
import DoctorFormModal from './DoctorFormModal';
import ResetPasswordModal from './ResetPasswordModal';
import { DOCTOR_STATIONS, isSuperAdmin } from '../../../lib/constants';
import { useAuth } from '../../../auth/useAuth';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Doctors' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Deactivated' },
];

const STATION_LABEL = Object.fromEntries(
  DOCTOR_STATIONS.map((s) => [s.value, `Station ${s.value} — ${s.subtitle}`]),
);

const COLUMNS = [
  { key: 'name', header: 'Name', render: (d) => `Dr. ${d.firstName} ${d.middleName ? `${d.middleName} ` : ''}${d.surname}` },
  { key: 'prcLicenseNo', header: 'PRC License No.' },
  { key: 'station', header: 'Station', render: (d) => STATION_LABEL[d.station] ?? '—' },
  { key: 'username', header: 'Username' },
  { key: 'contactNo', header: 'Contact No.', render: (d) => d.contactNo || '—' },
  {
    key: 'status',
    header: 'Status',
    render: (d) => {
      if (!d.isActive) return <Badge tone="danger" dot>Deactivated</Badge>;
      if (d.mustChangePassword) return <Badge tone="warn" dot>Password not set</Badge>;
      return <Badge tone="success" dot>Active</Badge>;
    },
  },
];

const searchFields = (d) => [d.surname, d.firstName, d.middleName, d.prcLicenseNo, d.username];
const filterField = (d) => (d.isActive ? 'active' : 'inactive');

export default function DoctorsPanel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // Deleting an account is destructive and irreversible, so it is offered only
  // to a superadmin -- matching the server, which authorises DELETE /physicians
  // for that role alone.
  const canDelete = isSuperAdmin(user);
  // Which dialog is open: 'create' | { doctor } for edit, plus the two
  // credential dialogs, which each act on one doctor.
  const [formTarget, setFormTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [activeTarget, setActiveTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Typing the surname is what arms the delete button: the row actions sit next
  // to Deactivate, and the two are one icon apart.
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const { data: doctors, isLoading, error, refetch } = useQuery({
    queryKey: ['physicians'],
    queryFn: listPhysicians,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['physicians'] });

  const createMutation = useMutation({
    mutationFn: createPhysician,
    onSuccess: (doctor) => {
      invalidate();
      setFormTarget(null);
      toast.success(`Dr. ${doctor.surname} can now sign in as "${doctor.username}".`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ physicianID, values }) => updatePhysician(physicianID, values),
    onSuccess: () => {
      invalidate();
      setFormTarget(null);
      toast.success('Doctor details updated.');
    },
  });

  const resetMutation = useMutation({
    mutationFn: ({ physicianID, password }) => resetPhysicianPassword(physicianID, password),
    onSuccess: (doctor) => {
      invalidate();
      setResetTarget(null);
      toast.success(`New password issued for Dr. ${doctor.surname}.`);
    },
  });

  const activeMutation = useMutation({
    mutationFn: ({ physicianID, isActive }) => setPhysicianActive(physicianID, isActive),
    onSuccess: (doctor) => {
      invalidate();
      setActiveTarget(null);
      toast.success(doctor.isActive
        ? `Dr. ${doctor.surname} can sign in again.`
        : `Dr. ${doctor.surname} can no longer sign in.`);
    },
    onError: (err) => toast.error(err.message),
  });

  const closeDelete = () => {
    setDeleteTarget(null);
    setDeleteConfirmation('');
  };

  const deleteMutation = useMutation({
    mutationFn: ({ physicianID }) => deletePhysician(physicianID),
    onSuccess: (_result, { doctor }) => {
      invalidate();
      closeDelete();
      toast.success(`Dr. ${doctor.surname}'s account was deleted. Records they signed are unchanged.`);
    },
    onError: (err) => toast.error(err.message),
  });

  // Station is filtered here rather than through useTableControls: the hook
  // drives a single filter field, and status already owns it.
  const [stationFilter, setStationFilter] = useState('all');

  const visibleDoctors = stationFilter === 'all'
    ? doctors
    : doctors?.filter((d) => d.station === Number(stationFilter));

  const table = useTableControls(visibleDoctors, { searchFields, filterField });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const editing = formTarget && formTarget !== 'create' ? formTarget : null;

  return (
    <Card
      flush
      title="Registered Doctors"
      actions={
        <div className="flex w-full flex-col gap-2 @4xl:flex-row @4xl:items-center">
          <SearchInput
            id="doctors-search"
            value={table.query}
            onChange={table.onSearch}
            placeholder="Search by name, licence, or username"
            className="w-full min-w-0 @4xl:flex-1"
          />
          <div className="flex w-full flex-wrap items-center gap-2 @4xl:w-auto @4xl:flex-nowrap">
            <Select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Stations' },
                ...DOCTOR_STATIONS.map((s) => ({ value: s.value, label: s.label })),
              ]}
              className="min-w-0 flex-1 @4xl:w-44 @4xl:flex-none"
            />
            <Select
              value={table.filter}
              onChange={(e) => table.onFilter(e.target.value)}
              options={STATUS_FILTER_OPTIONS}
              className="min-w-0 flex-1 @4xl:w-44 @4xl:flex-none"
            />
            <Button
              type="button"
              variant="teal"
              size="md"
              className="w-full @4xl:w-44"
              onClick={() => setFormTarget('create')}
            >
              <UserPlus size={16} />
              Register Doctor
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <DataTable
          columns={COLUMNS}
          rows={table.pageRows.map((d) => ({ ...d, id: d.physicianID }))}
          rowActionsHeader="Actions"
          rowActions={(row) => (
            <div className="flex items-center justify-center gap-1">
              <Button
                type="button"
                variant="ghost"
                title="Edit details"
                onClick={() => setFormTarget(row)}
              >
                <Pencil size={15} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                title="Reset password"
                onClick={() => setResetTarget(row)}
              >
                <KeyRound size={15} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                className={row.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-700 hover:bg-emerald-50'}
                title={row.isActive ? 'Deactivate account' : 'Reactivate account'}
                onClick={() => setActiveTarget(row)}
              >
                {row.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
              </Button>
              {canDelete && (
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
              )}
            </div>
          )}
          empty={table.isSearching || table.isFiltered
            ? 'No doctors match your search.'
            : 'No doctors registered yet.'}
        />

        <TableFooter
          page={table.page}
          totalPages={table.totalPages}
          total={table.total}
          noun="doctor"
          onPageChange={table.setPage}
        />
      </div>

      {formTarget && (
        <DoctorFormModal
          key={editing?.physicianID ?? 'create'}
          doctor={editing}
          isPending={createMutation.isPending || updateMutation.isPending}
          error={editing ? updateMutation.error : createMutation.error}
          onSubmit={(values) => (editing
            ? updateMutation.mutate({ physicianID: editing.physicianID, values })
            : createMutation.mutate(values))}
          onClose={() => {
            createMutation.reset();
            updateMutation.reset();
            setFormTarget(null);
          }}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          key={resetTarget.physicianID}
          doctor={resetTarget}
          isPending={resetMutation.isPending}
          error={resetMutation.error}
          onSubmit={({ password }) => resetMutation.mutate({
            physicianID: resetTarget.physicianID, password,
          })}
          onClose={() => {
            resetMutation.reset();
            setResetTarget(null);
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
                physicianID: activeTarget.physicianID,
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
            Dr. {activeTarget.firstName} {activeTarget.surname} will not be able to sign in, and
            will stop appearing in the Station 3 physician list. Consultations they already
            signed are unaffected.
          </>
        ) : (
          <>
            Dr. {activeTarget?.firstName} {activeTarget?.surname} will be able to sign in with
            their existing password and will appear in the Station 3 physician list again.
          </>
        )}
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete this doctor permanently?"
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
                physicianID: deleteTarget.physicianID,
                doctor: deleteTarget,
              })}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p>
            Dr. {deleteTarget?.firstName} {deleteTarget?.surname}&apos;s account and login will be
            removed. <strong>This cannot be undone.</strong>
          </p>
          <p className="text-ink-600">
            Medical records they signed are kept, and continue to show their name and PRC licence
            as the signer. Only the account is deleted. To block sign-in while keeping the
            account, use Deactivate instead.
          </p>
          <Field
            label={`Type "${deleteTarget?.surname ?? ''}" to confirm`}
            htmlFor="delete-doctor-confirm"
          >
            <Input
              id="delete-doctor-confirm"
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
