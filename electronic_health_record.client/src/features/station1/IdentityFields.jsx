import { Controller } from 'react-hook-form';
import { ageFrom } from '../../lib/formatters';
import { SEX_OPTIONS, CIVIL_STATUS_OPTIONS } from '../../lib/constants';
import Card from '../../components/ui/Card';
import DatePicker from '../../components/ui/DatePicker';
import Field from '../../components/ui/Field';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

export default function IdentityFields({ register, watch, control }) {
  const age = ageFrom(watch('birthdate'));

  return (
    <Card title="Personal Information">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
        <Field label="Surname" htmlFor="surname">
          <Input id="surname" disabled {...register('surname')} />
        </Field>
        <Field label="First Name" htmlFor="firstName">
          <Input id="firstName" disabled {...register('firstName')} />
        </Field>
        <Field label="Middle Name" htmlFor="middleName">
          <Input id="middleName" disabled {...register('middleName')} />
        </Field>

        <Field label="Birthdate" htmlFor="birthdate">
          <Controller
            name="birthdate"
            control={control}
            render={({ field }) => (
              <DatePicker id="birthdate" disabled max={new Date().toISOString().slice(0, 10)} {...field} />
            )}
          />
        </Field>
        <Field label="Age">
          <Input value={age ?? ''} disabled readOnly />
        </Field>
        <Field label="Sex" htmlFor="sex">
          <Controller
            name="sex"
            control={control}
            render={({ field }) => <Select id="sex" disabled options={SEX_OPTIONS} {...field} />}
          />
        </Field>

        <Field label="Civil Status" htmlFor="civilStatus">
          <Controller
            name="civilStatus"
            control={control}
            render={({ field }) => (
              <Select id="civilStatus" disabled options={CIVIL_STATUS_OPTIONS} {...field} />
            )}
          />
        </Field>
        <Field label="Contact No." htmlFor="contactNo">
          <Input id="contactNo" disabled {...register('contactNo')} />
        </Field>
        <Field label="Agency/Office" htmlFor="agencyOffice">
          <Input id="agencyOffice" disabled {...register('agencyOffice')} />
        </Field>

        <Field label="Position" htmlFor="position">
          <Input id="position" disabled {...register('position')} />
        </Field>
        <Field label="Address" htmlFor="address" className="md:col-span-2">
          <Input id="address" disabled {...register('address')} />
        </Field>
      </div>
    </Card>
  );
}
