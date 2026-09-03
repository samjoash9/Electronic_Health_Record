import { useFieldArray } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const BLANK_ROW = {
  conditionOther: '', yearDiagnosed: '',
  maintenanceDrugGeneric: '', dosage: '', frequency: '',
};

export default function PastMedicalHistorySection({ control, register }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'pastMedicalHistory' });

  const handleRemove = (index) => {
    if (fields.length === 1) {
      remove(0);
      append({ ...BLANK_ROW });
      return;
    }
    remove(index);
  };

  return (
    <Card
      title="2. Past Medical History"
      actions={
        <Button type="button" variant="secondary" onClick={() => append({ ...BLANK_ROW })}>
          <Plus size={14} className="mr-1" />
          Add row
        </Button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-gray-50 text-left">
            <tr>
              <th className="px-2 py-2 text-xs font-semibold text-ink-700">Condition</th>
              <th className="px-2 py-2 text-xs font-semibold text-ink-700">Year Diagnosed</th>
              <th className="px-2 py-2 text-xs font-semibold text-ink-700">Maintenance Drug (Generic)</th>
              <th className="px-2 py-2 text-xs font-semibold text-ink-700">Dosage</th>
              <th className="px-2 py-2 text-xs font-semibold text-ink-700">Frequency</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id} className="border-b border-line">
                <td className="px-2 py-1.5">
                  <Input {...register(`pastMedicalHistory.${index}.conditionOther`)} />
                </td>
                <td className="px-2 py-1.5">
                  <Input type="number" {...register(`pastMedicalHistory.${index}.yearDiagnosed`)} />
                </td>
                <td className="px-2 py-1.5">
                  <Input {...register(`pastMedicalHistory.${index}.maintenanceDrugGeneric`)} />
                </td>
                <td className="px-2 py-1.5">
                  <Input {...register(`pastMedicalHistory.${index}.dosage`)} />
                </td>
                <td className="px-2 py-1.5">
                  <Input {...register(`pastMedicalHistory.${index}.frequency`)} />
                </td>
                <td className="px-2 py-1.5">
                  <button
                    type="button"
                    aria-label={`Remove row ${index + 1}`}
                    onClick={() => handleRemove(index)}
                    className="flex h-6 w-6 items-center justify-center rounded text-ink-500 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <X size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
