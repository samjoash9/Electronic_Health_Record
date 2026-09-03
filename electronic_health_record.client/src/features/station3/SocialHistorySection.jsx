import Card from '../../components/ui/Card';
import Field from '../../components/ui/Field';
import Input from '../../components/ui/Input';

export default function SocialHistorySection({ register, watch }) {
  const hasBeenDrunk = watch('socialHistory.hasBeenDrunk');

  return (
    <Card title="3. Social History">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label="Smoking (sticks/day)" htmlFor="smokingSticksPerDay">
          <Input id="smokingSticksPerDay" type="number" {...register('socialHistory.smokingSticksPerDay')} />
        </Field>
        <Field label="Exercise Frequency" htmlFor="exerciseFrequency">
          <Input id="exerciseFrequency" {...register('socialHistory.exerciseFrequency')} />
        </Field>
        <Field label="Type of Exercise" htmlFor="exerciseType">
          <Input id="exerciseType" {...register('socialHistory.exerciseType')} />
        </Field>

        <Field label="Alcohol Type" htmlFor="alcoholType">
          <Input id="alcoholType" {...register('socialHistory.alcoholType')} />
        </Field>
        <Field label="How often do you drink?" htmlFor="drinkFrequency">
          <Input id="drinkFrequency" {...register('socialHistory.drinkFrequency')} />
        </Field>
        <Field label="How much per drinking session?" htmlFor="drinksPerSession">
          <Input id="drinksPerSession" {...register('socialHistory.drinksPerSession')} />
        </Field>

        <Field label="Have you ever been drunk?" htmlFor="hasBeenDrunk">
          <label className="flex h-8 items-center gap-2 text-sm">
            <input id="hasBeenDrunk" type="checkbox" {...register('socialHistory.hasBeenDrunk')} />
            Yes
          </label>
        </Field>
        {hasBeenDrunk && (
          <Field label="How often have you been drunk?" htmlFor="drunkFrequency">
            <Input id="drunkFrequency" {...register('socialHistory.drunkFrequency')} />
          </Field>
        )}
      </div>
    </Card>
  );
}
