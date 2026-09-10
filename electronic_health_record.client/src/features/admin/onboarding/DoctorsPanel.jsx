import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { UserPlus, Pencil, KeyRound, UserX, UserCheck } from 'lucide-react';
import {
  listPhysicians, createPhysician, updatePhysician,
  setPhysicianActive, resetPhysicianPassword,
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
import DoctorFormModal from './DoctorFormModal';
import ResetPasswordModal from './ResetPasswordModal';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Doctors' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Deactivated' },
];

const COLUMNS = [
  { key: 'name', header: 'Name', render: (d) => `Dr. ${d.firstName} ${d.middleName ? `${d.middleName} ` : ''}${d.surname}` },
  { key: 'prcLicenseNo', header: 'PRC License No.' },
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
  // Which dialog is open: 'create' | { doctor } for edit, plus the two
  // credential dialogs, which each act on one doctor.
  const [formTarget, setFormTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [activeTarget, setActiveTarget] = useState(null);

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

  const table = useTableControls(doctors, { searchFields, filterField });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const editing = formTarget && formTarget !== 'create' ? formTarget : null;

  return (
    <Card
      flush
      title="Registered Doctors"
      actions={
        <div className="flex items-center gap-2">
          <SearchInput
            id="doctors-search"
            value={table.query}
            onChange={table.onSearch}
            placeholder="Search by name, licence, or username"
            className="w-72"
          />
          <Select
            value={table.filter}
            onChange={(e) => table.onFilter(e.target.value)}
            options={STATUS_FILTER_OPTIONS}
            className="w-44"
          />
          <Button type="button" variant="teal" size="md" onClick={() => setFormTarget('create')}>
            <UserPlus size={16} />
            Register Doctor
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <DataTable
          columns={COLUMNS}
          rows={table.pageRows.map((d) => ({ ...d, id: d.physicianID }))}
          rowActions={(row) => (
            <div className="flex items-center justify-end gap-1">
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
    </Card>
  );
}
