import { useNavigate } from 'react-router-dom';
import { fullName, ageFrom } from '../../lib/formatters';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function HandoffConfirm({ form }) {
  const navigate = useNavigate();
  const patient = form.patient;

  return (
    <Card title="Confirm Patient">
      <p className="mb-4 text-sm text-ink-500">
        The patient will answer on this device. Navigation is locked until they finish.
      </p>

      <div className="mb-6 rounded border border-line bg-canvas p-4">
        <p className="text-xl font-semibold text-ink-900">{fullName(patient)}</p>
        <p className="mt-1 text-sm text-ink-500">
          {patient?.externalEmployeeId} · {patient?.agencyOffice} · Age {ageFrom(patient?.birthdate)}
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => navigate('/station2')}>
          Back to queue
        </Button>
        <Button type="button" onClick={() => navigate(`/station2/${form.formID}/kiosk`)}>
          Hand to patient
        </Button>
      </div>
    </Card>
  );
}
