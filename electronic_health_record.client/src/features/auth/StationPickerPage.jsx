import { useNavigate } from 'react-router-dom';
import { useStationChoice } from '../../hooks/useStationChoice';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const STATIONS = [
  {
    number: 1,
    title: 'Station 1 — Registration & Vital Signs',
    description: 'Register the employee and record their vital signs.',
    path: '/station1',
  },
  {
    number: 2,
    title: 'Station 2 — Assessment',
    description: 'Hand the tablet to the patient for the health assessment.',
    path: '/station2',
  },
];

export default function StationPickerPage() {
  const navigate = useNavigate();
  const { station, setStation } = useStationChoice();

  const choose = (s) => {
    setStation(s.number);
    navigate(s.path);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
        {STATIONS.map((s) => (
          <Card key={s.number} title={s.title}>
            <p className="mb-4 text-sm text-ink-500">{s.description}</p>
            <Button type="button" onClick={() => choose(s)} className="w-full">
              {station === s.number ? 'Continue here' : 'Use this station'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
