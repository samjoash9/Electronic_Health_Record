import { useForm, Controller } from 'react-hook-form';
import { SEX_OPTIONS, CIVIL_STATUS_OPTIONS } from '../../../lib/constants';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Field from '../../../components/ui/Field';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import DatePicker from '../../../components/ui/DatePicker';

const TODAY = new Date().toISOString().slice(0, 10);

/**
 * Adds or edits an employee directory record — the list Station 1 searches.
 * These are not sign-in accounts: an employee becomes a patient when Station 1
 * registers them, and the patient account is provisioned there.
 */
export default function EmployeeFormModal({ employee, isPending, error, onSubmit, onClose }) {
  const editing = Boolean(employee);

  const {
    register, control, handleSubmit, formState: { errors },
  } = useForm({
    defaultValues: {
      externalEmployeeId: employee?.externalEmployeeId ?? '',
      surname: employee?.surname ?? '',
      firstName: employee?.firstName ?? '',
      middleName: employee?.middleName ?? '',
      birthdate: employee?.birthdate ?? '',
      sex: employee?.sex ?? '',
      civilStatus: employee?.civilStatus ?? '',
      address: employee?.address ?? '',
      agencyOffice: employee?.agencyOffice ?? '',
      position: employee?.position ?? '',
      contactNo: employee?.contactNo ?? '',
    },
  });

  return (
    <Modal
      open
      size="xl"
      title={editing
        ? `Edit ${employee.firstName} ${employee.surname}`
        : 'Add an Employee'}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="employee-form" variant="teal" size="md" disabled={isPending}>
            {isPending ? 'Saving…' : editing ? 'Save changes' : 'Add employee'}
          </Button>
        </>
      }
    >
      <form id="employee-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Field
            label="Employee ID"
            htmlFor="employee-id"
            required
            error={errors.externalEmployeeId?.message}
          >
            <Input
              id="employee-id"
              error={Boolean(errors.externalEmployeeId)}
              {...register('externalEmployeeId', { required: 'Employee ID is required.' })}
            />
          </Field>
          <Field label="Surname" htmlFor="employee-surname" required error={errors.surname?.message}>
            <Input
              id="employee-surname"
              error={Boolean(errors.surname)}
              {...register('surname', { required: 'Surname is required.' })}
            />
          </Field>
          <Field
            label="First Name"
            htmlFor="employee-firstName"
            required
            error={errors.firstName?.message}
          >
            <Input
              id="employee-firstName"
              error={Boolean(errors.firstName)}
              {...register('firstName', { required: 'First name is required.' })}
            />
          </Field>

          <Field label="Middle Name" htmlFor="employee-middleName">
            <Input id="employee-middleName" {...register('middleName')} />
          </Field>
          <Field
            label="Birthdate"
            htmlFor="employee-birthdate"
            required
            error={errors.birthdate?.message}
          >
            <Controller
              name="birthdate"
              control={control}
              rules={{ required: 'Birthdate is required.' }}
              render={({ field }) => (
                <DatePicker id="employee-birthdate" max={TODAY} {...field} />
              )}
            />
          </Field>
          <Field label="Sex" htmlFor="employee-sex" required error={errors.sex?.message}>
            <Controller
              name="sex"
              control={control}
              rules={{ required: 'Sex is required.' }}
              render={({ field }) => (
                <Select id="employee-sex" options={SEX_OPTIONS} error={Boolean(errors.sex)} {...field} />
              )}
            />
          </Field>

          <Field
            label="Civil Status"
            htmlFor="employee-civilStatus"
            required
            error={errors.civilStatus?.message}
          >
            <Controller
              name="civilStatus"
              control={control}
              rules={{ required: 'Civil status is required.' }}
              render={({ field }) => (
                <Select
                  id="employee-civilStatus"
                  options={CIVIL_STATUS_OPTIONS}
                  error={Boolean(errors.civilStatus)}
                  {...field}
                />
              )}
            />
          </Field>
          <Field label="Agency/Office" htmlFor="employee-agency">
            <Input id="employee-agency" {...register('agencyOffice')} />
          </Field>
          <Field label="Position" htmlFor="employee-position">
            <Input id="employee-position" {...register('position')} />
          </Field>

          <Field label="Contact No." htmlFor="employee-contact">
            <Input id="employee-contact" {...register('contactNo')} />
          </Field>
          <Field label="Address" htmlFor="employee-address" className="sm:col-span-2">
            <Input id="employee-address" {...register('address')} />
          </Field>
        </div>

        {error && <p className="text-sm font-medium text-rose-600">{error.message}</p>}
      </form>
    </Modal>
  );
}
