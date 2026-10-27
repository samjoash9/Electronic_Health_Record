import { useFieldArray, useFormState } from 'react-hook-form';
import { Plus, Trash2, Stethoscope } from 'lucide-react';
import Input from '../../components/ui/Input';
import SectionCard from './SectionCard';
import { validateYear } from '../../lib/yearBounds';

const BLANK_ROW = {
  conditionOther: '', yearDiagnosed: '',
  maintenanceDrugGeneric: '', dosage: '', frequency: '',
};

// `span` is the cell's share of the six-column grid a row becomes on a phone.
const COLUMNS = [
  { name: 'conditionOther', label: 'Condition', placeholder: 'e.g. Hypertension', width: 'w-[26%]', span: 'max-md:col-span-4' },
  { name: 'yearDiagnosed', label: 'Year Diagnosed', placeholder: 'e.g. 2019', width: 'w-[14%]', span: 'max-md:col-span-2', type: 'number' },
  { name: 'maintenanceDrugGeneric', label: 'Maintenance Drug (Generic)', placeholder: 'e.g. Losartan', width: 'w-[24%]', span: 'max-md:col-span-6' },
  { name: 'dosage', label: 'Dosage', placeholder: 'e.g. 50 mg', width: 'w-[16%]', span: 'max-md:col-span-3' },
  { name: 'frequency', label: 'Frequency', placeholder: 'e.g. Once daily', width: 'w-[16%]', span: 'max-md:col-span-3' },
];

/**
 * `yearBounds` (from lib/yearBounds) limits Year Diagnosed to between the
 * patient's birth year and the visit year; omitted, the year goes unchecked.
 */
export default function PastMedicalHistorySection({ control, register, yearBounds }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'pastMedicalHistory' });
  const { errors } = useFormState({ control, name: 'pastMedicalHistory' });

  // Keep at least one row on screen: emptying the last row resets it instead
  // of leaving the section with nothing to type into.
  const handleRemove = (index) => {
    if (fields.length === 1) {
      remove(0);
      append({ ...BLANK_ROW });
      return;
    }
    remove(index);
  };

  const addRow = () => append({ ...BLANK_ROW });

  const errorFor = (index, column) => errors.pastMedicalHistory?.[index]?.[column.name]?.message;

  // No min/max on the year: the browser would block the submit with its own
  // popup before the inline warning and the scroll to it ever ran.
  const fieldProps = (index, column) => {
    const error = errorFor(index, column);
    const validate = column.type === 'number' && yearBounds
      ? (value) => validateYear(value, yearBounds)
      : undefined;
    return {
      ...register(`pastMedicalHistory.${index}.${column.name}`, { validate }),
      placeholder: column.placeholder,
      className: 'w-full',
      error: Boolean(error),
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? `pmh-${index}-${column.name}-error` : undefined,
      ...(column.type === 'number' ? { type: 'number', inputMode: 'numeric' } : {}),
    };
  };

  return (
    <SectionCard
      step={2}
      title="Past Medical History"
      subtitle="List diagnosed conditions and any maintenance medication. Leave blank if none apply."
      icon={Stethoscope}
    >
      {/* One input per field only: rendering a second mobile copy would register
          two DOM nodes against the same react-hook-form path and desync them.
          So on a phone the same table restyles itself instead -- header hidden,
          each row a card of labelled fields, the way the Exercise rows stack --
          rather than scroll sideways past a 760px minimum width. */}
      <div className="md:overflow-x-auto md:rounded-lg md:border md:border-line">
        <table className="w-full table-fixed text-sm max-md:block md:min-w-190">
          <thead className="bg-gray-50/80 max-md:hidden">
            <tr className="border-b border-line text-left">
              <th className="w-10 px-3 py-2.5 text-[11px] font-semibold tracking-wide text-ink-500 uppercase">
                #
              </th>
              {COLUMNS.map((column) => (
                <th
                  key={column.name}
                  className={`${column.width} px-2 py-2.5 text-[11px] font-semibold tracking-wide text-ink-500 uppercase`}
                >
                  {column.label}
                </th>
              ))}
              <th className="w-12 px-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="max-md:flex max-md:flex-col max-md:gap-3">
            {fields.map((field, index) => (
              <tr
                key={field.id}
                className="group border-b border-line last:border-b-0 transition-colors hover:bg-[#f9fefd] max-md:grid max-md:grid-cols-6 max-md:gap-x-3 max-md:gap-y-2.5 max-md:rounded-lg max-md:border max-md:p-3 max-md:last:border-b"
              >
                <td className="px-3 py-2 align-middle text-xs font-medium tabular-nums text-ink-400 max-md:col-span-5 max-md:row-start-1 max-md:self-center max-md:p-0">
                  <span className="md:hidden">#</span>
                  {index + 1}
                </td>
                {COLUMNS.map((column) => (
                  <td key={column.name} className={`px-2 py-2 align-middle max-md:p-0 ${column.span}`}>
                    <label
                      className="mb-1 block text-xs font-medium tracking-wide text-ink-600 md:sr-only"
                      htmlFor={`pmh-${index}-${column.name}`}
                    >
                      {column.label}
                      <span className="sr-only">{`, row ${index + 1}`}</span>
                    </label>
                    <Input id={`pmh-${index}-${column.name}`} {...fieldProps(index, column)} />
                    {errorFor(index, column) && (
                      <p
                        id={`pmh-${index}-${column.name}-error`}
                        className="mt-1 text-[11px] font-medium text-rose-600"
                      >
                        {errorFor(index, column)}
                      </p>
                    )}
                  </td>
                ))}
                <td className="px-2 py-2 align-middle max-md:col-start-6 max-md:row-start-1 max-md:-m-2 max-md:justify-self-end max-md:p-0">
                  <button
                    type="button"
                    aria-label={`Remove row ${index + 1}`}
                    onClick={() => handleRemove(index)}
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-300 transition group-hover:text-ink-500 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2.5 text-xs font-medium text-ink-500 transition-colors hover:border-[#0e7d6b]/40 hover:bg-[#f9fefd] hover:text-[#0e7d6b]"
      >
        <Plus size={14} />
        Add another condition
      </button>
    </SectionCard>
  );
}
