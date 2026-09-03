import { ageFrom } from '../../lib/formatters';
import { SEX_OPTIONS, CIVIL_STATUS_OPTIONS } from '../../lib/constants';
import Card from '../../components/ui/Card';
import Field from '../../components/ui/Field';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

export default function IdentityFields({ register, watch, errors }) {
  const age = ageFrom(watch('birthdate'));

  return (
    <Card title="Personal Information">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label="Surname" htmlFor="surname" required error={errors.surname?.message}>
          <Input id="surname" {...register('surname')} />
        </Field>
        <Field label="First Name" htmlFor="firstName" required error={errors.firstName?.message}>
          <Input id="firstName" {...register('firstName')} />
        </Field>
        <Field label="Middle Name" htmlFor="middleName" error={errors.middleName?.message}>
          <Input id="middleName" {...register('middleName')} />
        </Field>

        <Field label="Birthdate" htmlFor="birthdate" required error={errors.birthdate?.message}>
          <Input id="birthdate" type="date" {...register('birthdate')} />
        </Field>
        <Field label="Age">
          <Input value={age ?? ''} disabled readOnly />
        </Field>
        <Field label="Sex" htmlFor="sex" required error={errors.sex?.message}>
          <Select id="sex" options={SEX_OPTIONS} {...register('sex')} />
        </Field>

        <Field label="Civil Status" htmlFor="civilStatus" required error={errors.civilStatus?.message}>
          <Select id="civilStatus" options={CIVIL_STATUS_OPTIONS} {...register('civilStatus')} />
        </Field>
        <Field label="Contact No." htmlFor="contactNo" error={errors.contactNo?.message}>
          <Input id="contactNo" {...register('contactNo')} />
        </Field>
        <Field label="Agency/Office" htmlFor="agencyOffice" error={errors.agencyOffice?.message}>
          <Input id="agencyOffice" {...register('agencyOffice')} />
        </Field>

        <Field label="Position" htmlFor="position" error={errors.position?.message}>
          <Input id="position" {...register('position')} />
        </Field>
        <Field label="Address" htmlFor="address" error={errors.address?.message} className="md:col-span-2">
          <Input id="address" {...register('address')} />
        </Field>
      </div>
    </Card>
  );
}
