import { useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Stethoscope } from 'lucide-react';
import Input from '../../components/ui/Input';
import SectionCard from './SectionCard';

const BLANK_ROW = {
  conditionOther: '', yearDiagnosed: '',
  maintenanceDrugGeneric: '', dosage: '', frequency: '',
};

const COLUMNS = [
  { name: 'conditionOther', label: 'Condition', placeholder: 'e.g. Hypertension', width: 'w-[26%]' },
  { name: 'yearDiagnosed', label: 'Year Diagnosed', placeholder: 'e.g. 2019', width: 'w-[14%]', type: 'number' },
  { name: 'maintenanceDrugGeneric', label: 'Maintenance Drug (Generic)', placeholder: 'e.g. Losartan', width: 'w-[24%]' },
  { name: 'dosage', label: 'Dosage', placeholder: 'e.g. 50 mg', width: 'w-[16%]' },
  { name: 'frequency', label: 'Frequency', placeholder: 'e.g. Once daily', width: 'w-[16%]' },
];

const YEAR_MAX = new Date().getFullYear();

export default function PastMedicalHistorySection({ control, register }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'pastMedicalHistory' });

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

  const fieldProps = (index, column) => ({
    ...register(`pastMedicalHistory.${index}.${column.name}`),
    placeholder: column.placeholder,
    className: 'w-full',
    ...(column.type === 'number'
      ? { type: 'number', min: 1900, max: YEAR_MAX, inputMode: 'numeric' }
      : {}),
  });

  return (
    <SectionCard
      step={2}
      title="Past Medical History"
      subtitle="List diagnosed conditions and any maintenance medication. Leave blank if none apply."
      icon={Stethoscope}
    >
      {/* One input per field only: rendering a second mobile copy would register
          two DOM nodes against the same react-hook-form path and desync them. */}
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-190 table-fixed text-sm">
          <thead className="bg-gray-50/80">
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
          <tbody>
            {fields.map((field, index) => (
              <tr
                key={field.id}
                className="group border-b border-line last:border-b-0 transition-colors hover:bg-[#f9fefd]"
              >
                <td className="px-3 py-2 align-middle text-xs font-medium tabular-nums text-ink-400">
                  {index + 1}
                </td>
                {COLUMNS.map((column) => (
                  <td key={column.name} className="px-2 py-2 align-middle">
                    <label className="sr-only" htmlFor={`pmh-${index}-${column.name}`}>
                      {`${column.label}, row ${index + 1}`}
                    </label>
                    <Input id={`pmh-${index}-${column.name}`} {...fieldProps(index, column)} />
                  </td>
                ))}
                <td className="px-2 py-2 align-middle">
                  <button
                    type="button"
                    aria-label={`Remove row ${index + 1}`}
                    onClick={() => handleRemove(index)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-300 transition group-hover:text-ink-500 hover:bg-rose-50 hover:text-rose-600"
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
