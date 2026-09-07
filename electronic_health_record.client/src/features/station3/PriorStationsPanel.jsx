import { HeartPulse, ListChecks } from 'lucide-react';
import { bmiCategory } from '../../lib/bmi';
import { scoreAllCategories } from '../../lib/scoring';
import { formatDateTime } from '../../lib/formatters';
import Collapsible from '../../components/ui/Collapsible';
import Badge from '../../components/ui/Badge';
import ScoreRing from '../../components/ui/ScoreRing';
import AnswersReview from '../station2/AnswersReview';

const BMI_TONE = {
  Underweight: 'warn',
  Normal: 'success',
  Overweight: 'warn',
  Obese: 'danger',
};

function VitalRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="text-sm font-medium text-ink-900">{value ?? '—'}</p>
    </div>
  );
}

export default function PriorStationsPanel({ form, categories }) {
  const category = bmiCategory(form.bmi);
  const scores = categories ? scoreAllCategories(categories, form.assessmentAnswers) : [];

  return (
    <div className="flex flex-col gap-3">
      <Collapsible
        title="Station 1 — Vital Signs"
        icon={HeartPulse}
        subtitle={`Recorded ${formatDateTime(form.station1SubmittedAt)}`}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <VitalRow label="Weight" value={form.weightKg ? `${form.weightKg} kg` : null} />
          <VitalRow label="Height" value={form.heightCm ? `${form.heightCm} cm` : null} />
          <div>
            <p className="text-xs text-ink-500">BMI</p>
            <p className="flex items-center gap-1.5 text-sm font-medium text-ink-900">
              {form.bmi ?? '—'}
              {category && <Badge tone={BMI_TONE[category]}>{category}</Badge>}
            </p>
          </div>
          <VitalRow label="Ideal BMI" value={form.idealBMI} />
          <VitalRow label="Blood Pressure" value={form.bpSystolic ? `${form.bpSystolic}/${form.bpDiastolic}` : null} />
          <VitalRow label="Temperature" value={form.tempCelsius ? `${form.tempCelsius} °C` : null} />
          <VitalRow label="Heart Rate" value={form.heartRate ? `${form.heartRate} bpm` : null} />
          <VitalRow label="Resp. Rate" value={form.respRate ? `${form.respRate} bpm` : null} />
        </div>
      </Collapsible>

      <Collapsible
        title="Station 2 — Assessment"
        icon={ListChecks}
        subtitle={`Recorded ${formatDateTime(form.station2SubmittedAt)}`}
      >
        {categories ? (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {scores.map((s) => (
                <ScoreRing key={s.categoryID} label={s.name} percent={s.percent} total={s.total} max={s.max} />
              ))}
            </div>
            <AnswersReview categories={categories} answers={form.assessmentAnswers} />
          </>
        ) : (
          <p className="text-sm text-ink-500">Loading assessment…</p>
        )}
      </Collapsible>
    </div>
  );
}
