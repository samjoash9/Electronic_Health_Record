import { useForm, Controller } from 'react-hook-form';
import { SEX_OPTIONS, CIVIL_STATUS_OPTIONS } from '../../../lib/constants';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Field from '../../../components/ui/Field';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import DatePicker from '../../../components/ui/DatePicker';

const TODAY = new Date().toISOString().slice(0, 10);

const AGENCY_POSITION_MAP = {
    'Bids and Awards Committee': [
        'ADMINISTRATIVE AIDE III (CLERK I)',
        'ADMINISTRATIVE ASSISTANT I (COMPUTER OPERATOR I)',
        'ADMINISTRATIVE ASSISTANT III (COMPUTER OPERATOR II)',
        'CLERK',
        'HEAD BAC SECRETARIAT',
        'INTERNAL AUDITOR II',
    ],

    'D.O.P. MEMORIAL HOSPITAL': [
        'ACCOUNTANT II',
        'ADMINISTRATIVE AIDE I (UTILITY WORKER I)',
        'ADMINISTRATIVE AIDE III',
        'ADMINISTRATIVE AIDE III (CARPENTER I)',
        'ADMINISTRATIVE AIDE III (CLERK I)',
        'ADMINISTRATIVE AIDE III (DRIVER I)',
        'ADMINISTRATIVE AIDE III (UTILITY WORKER II)',
        'ADMINISTRATIVE AIDE IV (CASH CLERK I)',
        'ADMINISTRATIVE AIDE V (CARPENTER II)',
        'ADMINISTRATIVE AIDE VI (ACCOUNTING CLERK II)',
        'ADMINISTRATIVE AIDE VI (CLERK III)',
        'ADMINISTRATIVE AIDE VI (DATA CONTROLLER I)',
        'ADMINISTRATIVE AIDE VI (STOREKEEPER II)',
        'ADMINISTRATIVE ASSISTANT I (COMPUTER OPERATOR I)',
        'ADMINISTRATIVE ASSISTANT II (ACCOUNTING CLERK III)',
        'ADMINISTRATIVE ASSISTANT II (CLERK IV)',
        'ADMINISTRATIVE ASSISTANT II (DISBURSING OFFICER II)',
        'ADMINISTRATIVE ASSISTANT III (COMPUTER OPERATOR II)',
        'ADMINISTRATIVE ASSISTANT III (ELECTRICIAN FOREMAN)',
        'ADMINISTRATIVE ASSISTANT III (SENIOR BOOKKEEPER)',
        'ADMINISTRATIVE OFFICER III (CASHIER II)',
        'ADMINISTRATIVE OFFICER III (RECORDS OFFICER II)',
        'ADMINISTRATIVE OFFICER III (SUPPLY OFFICER II)',
        'ADMINISTRATIVE OFFICER V (ADMINISTRATIVE OFFICER III)',
        'AIRCON TECHNICIAN',
        'ANESTHESIOLOGIST',
        'CLERK',
        'CLINICAL LIAISON',
        'COMPUTER MAINTENANCE TECHNOLOGIST II',
        'COOK I',
        'COOK II',
        'DATA ENCODER',
        'DENTAL AIDE',
        'DENTIST II',
        'DENTIST III',
        'ELECTRICIAN',
        'FOOD SERVER',
        'GENERAL SURGEON',
        'INTERNIST',
        'KITCHEN HELPER',
        'LABORATORY AIDE II',
        'LABORATORY TECHNICIAN',
        'LAUNDRY WORKER',
        'LAUNDRY WORKER II',
        'LIAISON',
        'MEDICAL LABORATORY TECHNICIAN',
        'MEDICAL OFFICER',
        'MEDICAL OFFICER III',
        'MEDICAL ONCOLOGIST',
        'MEDICAL SPECIALIST I',
        'MEDICAL SPECIALIST II',
        'MEDICAL SPECIALIST IV',
        'MEDICAL TECHNOLOGIST I',
        'MEDICAL TECHNOLOGIST II',
        'MEDICAL TECHNOLOGIST III',
        'MIDWIFE II',
        'NEPHROLOGIST',
        'NURSE',
        'NURSE I',
        'NURSE II',
        'NURSE III',
        'NURSE IV',
        'NURSE V',
        'NURSING ATTENDANT',
        'NURSING ATTENDANT I',
        'NURSING ATTENDANT II',
        'NUTRITIONIST-DIETITIAN II',
        'NUTRITIONIST-DIETITIAN III',
        'OFFICER IN-CHARGE',
        'ORTHOPEDIC SURGEON',
        'PATHOLOGIST',
        'PEDIATRICIAN',
        'PHARMACIST I',
        'PHARMACIST II',
        'PHARMACIST III (PHARMACIST IV)',
        'PHARMACY AIDE',
        'PLUMBER',
        'PROCESS SERVER',
        'RADIOLOGIC TECHNICIAN',
        'RADIOLOGIC TECHNOLOGIST I',
        'RADIOLOGIC TECHNOLOGIST II',
        'RADIOLOGIC TECHNOLOGIST III',
        'RADIOLOGIST',
        'RESPIRATORY THERAPIST I',
        'SEAMSTRESS',
        'SECURITY GUARD I',
        'SOCIAL WELFARE ASSISTANT',
        'SOCIAL WELFARE OFFICER II',
        'SOCIAL WELFARE OFFICER III',
        'STATISTICIAN I',
        'UTILITY WORKER',
        'WAREHOUSEMAN II',
    ],

    'EDUCATION DEVELOPMENT SERVICES': [
        'ADMINISTRATIVE AIDE III (CLERK I)',
        'ADMINISTRATIVE AIDE III (DRIVER I)',
        'ADMINISTRATIVE ASSISTANT I (COMPUTER OPERATOR I)',
        'CLERK',
        'COMMUNITY AFFAIRS ASSISTANT I',
        'COMMUNITY AFFAIRS OFFICER I',
        'COMMUNITY AFFAIRS OFFICER II',
        'COMMUNITY AFFAIRS OFFICER IV',
        'LIAISON',
    ],

    'ESPERANZA MEDICARE COMMUNITY HOSPITAL': [
        'ADMINISTRATIVE AIDE III (DRIVER I)',
        'ADMINISTRATIVE AIDE III (PLUMBER I)',
        'ADMINISTRATIVE AIDE IV',
        'ADMINISTRATIVE AIDE IV (ELECTRICIAN I)',
        'ADMINISTRATIVE AIDE IV (STOREKEEPER I)',
        'ADMINISTRATIVE AIDE VI (CASH CLERK II)',
        'ADMINISTRATIVE ASSISTANT II (ADMINISTRATIVE ASSISTANT)',
        'ADMINISTRATIVE ASSISTANT III (SENIOR BOOKKEEPER)',
        'ADMINISTRATIVE OFFICER I (CASHIER I)',
        'ADMINISTRATIVE OFFICER I (RECORDS OFFICER I)',
        'ADMINISTRATIVE OFFICER IV (ADMINISTRATIVE OFFICER II)',
        'CLERK',
        'COMPUTER MAINTENANCE TECHNOLOGIST I',
        'COOK II',
        'DATA ENCODER',
        'FOOD SERVER',
        'LABORATORY AIDE II',
        'LAUNDRY WORKER',
        'MEDICAL OFFICER',
        'MEDICAL OFFICER III',
        'MEDICAL OFFICER IV',
        'MEDICAL TECHNOLOGIST I',
        'MEDICAL TECHNOLOGIST II',
        'MIDWIFE I',
        'NURSE I',
        'NURSE II',
        'NURSE III',
        'NURSING ATTENDANT',
        'NURSING ATTENDANT I',
        'NURSING ATTENDANT II',
        'NUTRITIONIST-DIETITIAN II',
        'PHARMACIST I',
        'RADIOLOGIC TECHNOLOGIST I',
        'SECURITY GUARD I',
        'SOCIAL WELFARE OFFICER I',
        'UTILITY WORKER',
    ],

    'LORETO DISTRICT HOSPITAL': [
        'ADMINISTRATIVE AIDE III',
        'ADMINISTRATIVE AIDE III (DRIVER I)',
        'ADMINISTRATIVE AIDE IV (STOREKEEPER I)',
        'ADMINISTRATIVE AIDE VI (CASH CLERK II)',
        'ADMINISTRATIVE AIDE VI (CLERK III)',
        'ADMINISTRATIVE AIDE VI (COMMUNICATIONS EQUIPMENT OPERATOR II)',
        'ADMINISTRATIVE AIDE VI (UTILITY FOREMAN)',
        'ADMINISTRATIVE ASSISTANT III (SENIOR BOOKKEEPER)',
        'ADMINISTRATIVE OFFICER I (CASHIER I)',
        'ADMINISTRATIVE OFFICER I (RECORDS OFFICER I)',
        'ADMINISTRATIVE OFFICER I (SUPPLY OFFICER I)',
        'ADMINISTRATIVE OFFICER IV (ADMINISTRATIVE OFFICER II)',
        'CLERK',
        'COMPUTER MAINTENANCE TECHNOLOGIST I',
        'COOK II',
        'FOOD SERVER',
        'LABORATORY AIDE',
        'LABORATORY TECHNICIAN I',
        'LABORER',
        'LAUNDRY WORKER',
        'MEDICAL OFFICER',
        'MEDICAL OFFICER III',
        'MEDICAL OFFICER IV',
        'MEDICAL TECHNOLOGIST I',
        'MEDICAL TECHNOLOGIST II',
        'MIDWIFE I',
        'NURSE I',
        'NURSE II',
        'NURSING ATTENDANT II',
        'NUTRITIONIST-DIETITIAN II',
        'PHARMACIST',
        'PHARMACIST I',
        'PHARMACIST II',
        'PHARMACY AIDE',
        'RADIOLOGIC TECHNOLOGIST',
        'RADIOLOGIC TECHNOLOGIST I',
        'RADIOLOGIC TECHNOLOGIST II',
        'SOCIAL WELFARE OFFICER I',
        'UTILITY WORKER',
        'WATCHMAN',
    ],

    'PROVINCIAL HEALTH OFFICE': [
        'ADMINISTRATIVE AIDE I (UTILITY WORKER I)',
        'ADMINISTRATIVE AIDE III',
        'ADMINISTRATIVE AIDE III (CLERK I)',
        'ADMINISTRATIVE AIDE III (DRIVER I)',
        'ADMINISTRATIVE AIDE IV (CLERK II)',
        'Administrative Aide IV (Plumber II)',
        'ADMINISTRATIVE AIDE VI (CLERK III)',
        'ADMINISTRATIVE ASSISTANT III (COMPUTER OPERATOR II)',
        'CLERK',
        'COMMUNITY AFFAIRS OFFICER I',
        'DENTIST III',
        'ENGINEER III (SANITARY)',
        'HEALTH EDUCATION AND PROMOTION OFFICER III',
        'HEALTH PROGRAM OFFICER I',
        'HEALTH PROGRAM OFFICER II',
        'LABORATORY TECHNICIAN I',
        'Local Disaster Risk Reductio Management Officer II',
        'MEDICAL SPECIALIST (PUBLIC HEALTH)',
        'MEDICAL SPECIALIST II',
        'MEDICAL TECHNOLOGIST II',
        'MEDICAL TECHNOLOGIST III',
        'NURSE I',
        'NURSE II',
        'NURSE V',
        'NUTRITIONIST-DIETITIAN II',
        'PROCESS SERVER',
        'PROJECT EVALUATION OFFICER II',
        'PROVINCIAL HEALTH OFFICER II',
        'SANITATION INSPECTOR II',
        'SANITATION INSPECTOR III',
        'SANITATION INSPECTOR VI',
    ],

    'PROVINCIAL ACCOUNTING OFFICE': [
        'ACCOUNTANT I',
        'ACCOUNTANT II',
        'ACCOUNTANT IV',
        'ACCOUNTING CLERK',
        'ADMINISTRATIVE AIDE III (DRIVER I)',
        'ADMINISTRATIVE ASSISTANT I (BOOKBINDER III)',
        'ADMINISTRATIVE ASSISTANT II (BOOKKEEPER I)',
        'ADMINISTRATIVE ASSISTANT III (SENIOR BOOKKEEPER)',
        'ADMINISTRATIVE OFFICER II (FISCAL EXAMINER I)',
        'ADMINISTRATIVE OFFICER IV (FISCAL EXAMINER II)',
        'ADMINISTRATIVE OFFICER IV (MANAGEMENT AND AUDIT ANALYST II)',
        'CLERK',
        'PROVINCIAL GOVERNMENT DEPARTMENT HEAD (PROVINCIAL ACCOUNTANT)',
    ],

    'PROVINCIAL ADMINISTRATOR\'S OFFICE': [
        'ADMINISTRATIVE AIDE III (DRIVER I)',
        'ADMINISTRATIVE AIDE IV (REPRODUCTION MACHINE OPERATOR II)',
        'ADMINISTRATIVE AIDE VI (CLERK III)',
        'ADMINISTRATIVE ASSISTANT III (COMPUTER OPERATOR II)',
        'ADMINISTRATIVE OFFICER II (ADMINISTRATIVE OFFICER I)',
        'ADMINISTRATIVE OFFICER II (PUBLIC RELATIONS OFFICER I)',
        'ADMINISTRATIVE OFFICER III (RECORDS OFFICER II)',
        'CLERK',
        'DEVELOPMENT MANAGEMENT OFFICER I',
        'DEVELOPMENT MANAGEMENT OFFICER II',
        'DEVELOPMENT MANAGEMENT OFFICER IV',
        'PROCESS SERVER',
        'PROVINCIAL GOVERNMENT ASSISTANT DEPARTMENT HEAD (ASSISTANT PROVINCIAL ADMINISTRATOR)',
        'PROVINCIAL GOVERNMENT DEPARTMENT HEAD (PROVINCIAL ADMINISTRATOR)',
        'Supervising Administrative Officer (Administrative Officer IV)',
    ],

    'PROVINCIAL INFORMATION MANAGEMENT OFFICE': [
        'ADMINISTRATIVE AIDE IV (CLERK II)',
        'ADMINISTRATIVE ASSISTANT I (COMPUTER OPERATOR I)',
        'ADMINISTRATIVE ASSISTANT III (COMPUTER OPERATOR II)',
        'ADMINISTRATIVE OFFICER IV (ADMINISTRATIVE OFFICER II)',
        'CLERK',
        'COMPUTER MAINTENANCE TECHNOLOGIST III',
        'COMPUTER PROGRAMMER',
        'COMPUTER PROGRAMMER II',
        'COMPUTER PROGRAMMER III',
        'ELECTRONICS AND COMMUNICATIONS EQUIPMENT TECHNICIAN',
        'ELECTRONICS AND COMMUNICATIONS EQUIPMENT TECHNICIAN II',
        'INFORMATION SYSTEMS ANALYST II',
        'INFORMATION TECHNOLOGY OFFICER I',
        'INFORMATION TECHNOLOGY OFFICER II',
        'JUNIOR COMPUTER PROGRAMMER',
        'PROCESS SERVER',
        'PROVINCIAL GOVERNMENT DEPARTMENT HEAD (PROVINCIAL INFORMATION MANAGEMENT OFFICER)',
        'SENIOR ADMINISTRATIVE ASSISTANT I (DATA CONTROLLER IV)',
        'SENIOR ADMINISTRATIVE ASSISTANT II (COMPUTER OPERATOR IV)',
        'SENIOR COMPUTER PROGRAMMER',
    ],

    // Continue adding the remaining agencies and their positions here.
};

const AGENCY_OFFICE_OPTIONS = Object.keys(AGENCY_POSITION_MAP).map(
    (agency) => ({
        value: agency,
        label: agency,
    }),
);

/**
 * Adds or edits an employee directory record — the list Station 1 searches.
 * These are not sign-in accounts: an employee becomes a patient when Station 1
 * registers them, and the patient account is provisioned there.
 */
export default function EmployeeFormModal({ employee, isPending, error, onSubmit, onClose }) {
    const editing = Boolean(employee);

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
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

    const selectedAgency = watch('agencyOffice');

    const positionOptions = selectedAgency
        ? (AGENCY_POSITION_MAP[selectedAgency] ?? []).map((position) => ({
            value: position,
            label: position,
        }))
        : [];

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

                    <Button
                        type="submit"
                        form="employee-form"
                        variant="teal"
                        size="md"
                        disabled={isPending}
                    >
                        {isPending ? 'Saving…' : editing ? 'Save changes' : 'Add employee'}
                    </Button>
                </>
            }
        >
            <form
                id="employee-form"
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
            >
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">

                    <Field
                        label="Surname"
                        htmlFor="employee-surname"
                        required
                        error={errors.surname?.message}
                    >
                        <Input
                            id="employee-surname"
                            error={Boolean(errors.surname)}
                            {...register('surname', {
                                required: 'Surname is required.',
                            })}
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
                            {...register('firstName', {
                                required: 'First name is required.',
                            })}
                        />
                    </Field>

                    <Field label="Middle Name" htmlFor="employee-middleName">
                        <Input
                            id="employee-middleName"
                            {...register('middleName')}
                        />
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
                                <DatePicker
                                    id="employee-birthdate"
                                    max={TODAY}
                                    {...field}
                                />
                            )}
                        />
                    </Field>

                    <Field
                        label="Sex"
                        htmlFor="employee-sex"
                        required
                        error={errors.sex?.message}
                    >
                        <Controller
                            name="sex"
                            control={control}
                            rules={{ required: 'Sex is required.' }}
                            render={({ field }) => (
                                <Select
                                    id="employee-sex"
                                    options={SEX_OPTIONS}
                                    error={Boolean(errors.sex)}
                                    {...field}
                                />
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

                    <Field
                        label="Agency/Office"
                        htmlFor="employee-agency"
                        required
                        error={errors.agencyOffice?.message}
                    >
                        <Controller
                            name="agencyOffice"
                            control={control}
                            rules={{ required: 'Agency/Office is required.' }}
                            render={({ field }) => (
                                <Select
                                    id="employee-agency"
                                    options={AGENCY_OFFICE_OPTIONS}
                                    error={Boolean(errors.agencyOffice)}
                                    {...field}
                                    onChange={(event) => {
                                        field.onChange(event);
                                        setValue('position', '');
                                    }}
                                />
                            )}
                        />
                    </Field>

                    <Field
                        label="Position"
                        htmlFor="employee-position"
                        required
                        error={errors.position?.message}
                    >
                        <Controller
                            name="position"
                            control={control}
                            rules={{ required: 'Position is required.' }}
                            render={({ field }) => (
                                <Select
                                    id="employee-position"
                                    options={positionOptions}
                                    error={Boolean(errors.position)}
                                    disabled={!selectedAgency}
                                    {...field}
                                />
                            )}
                        />
                    </Field>

                    <Field label="Contact No." htmlFor="employee-contact">
                        <Input
                            id="employee-contact"
                            inputMode="numeric"
                            {...register('contactNo', {
                                onChange: (e) => {
                                    e.target.value = e.target.value.replace(/\D/g, '');
                                },
                            })}
                        />
                    </Field>

                    <Field
                        label="Address"
                        htmlFor="employee-address"
                        className="sm:col-span-2"
                    >
                        <Input
                            id="employee-address"
                            {...register('address')}
                        />
                    </Field>
                </div>

                {error && (
                    <p className="text-sm font-medium text-rose-600">
                        {error.message}
                    </p>
                )}
            </form>
        </Modal>
    );
}