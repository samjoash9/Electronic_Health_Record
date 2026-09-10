import { calculateBMI, calculateIdealWeightKg, bmiCategory, IDEAL_BMI } from '../../lib/bmi';
import Card from '../../components/ui/Card';
import Field from '../../components/ui/Field';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';

const BMI_TONE = {
  Underweight: 'warn',
  Normal: 'success',
  Overweight: 'warn',
  Obese: 'danger',
};

export default function VitalsFields({ register, watch, errors }) {
  const weightKg = watch('weightKg');
  const heightCm = watch('heightCm');
  const bmi = calculateBMI(weightKg, heightCm);
  const idealWeight = calculateIdealWeightKg(heightCm);
  const category = bmiCategory(bmi);

  return (
    <Card title="Vital Signs">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label="Weight (kg)" htmlFor="weightKg" required error={errors.weightKg?.message}>
          <Input id="weightKg" type="number" step="0.1" {...register('weightKg')} />
        </Field>
        <Field label="Height (cm)" htmlFor="heightCm" required error={errors.heightCm?.message}>
          <Input id="heightCm" type="number" step="0.1" {...register('heightCm')} />
        </Field>
        <Field label="BMI">
          <div className="flex h-8 items-center gap-2">
            <Input value={bmi ?? ''} disabled readOnly className="flex-1" />
            {category && <Badge tone={BMI_TONE[category]}>{category}</Badge>}
          </div>
        </Field>

        <Field
          label="Ideal BMI"
          hint={idealWeight !== null ? `Ideal weight for this height: ${idealWeight} kg` : undefined}
        >
          <Input value={IDEAL_BMI} disabled readOnly />
        </Field>
        <Field label="BP Systolic" htmlFor="bpSystolic" required error={errors.bpSystolic?.message}>
          <Input id="bpSystolic" type="number" {...register('bpSystolic')} />
        </Field>
        <Field label="BP Diastolic" htmlFor="bpDiastolic" required error={errors.bpDiastolic?.message}>
          <Input id="bpDiastolic" type="number" {...register('bpDiastolic')} />
        </Field>

        <Field label="Temperature (°C)" htmlFor="tempCelsius" required error={errors.tempCelsius?.message}>
          <Input id="tempCelsius" type="number" step="0.1" {...register('tempCelsius')} />
        </Field>
        <Field label="Heart Rate (bpm)" htmlFor="heartRate" required error={errors.heartRate?.message}>
          <Input id="heartRate" type="number" {...register('heartRate')} />
        </Field>
        <Field label="Resp. Rate (bpm)" htmlFor="respRate" required error={errors.respRate?.message}>
          <Input id="respRate" type="number" {...register('respRate')} />
        </Field>
      </div>
    </Card>
  );
}
