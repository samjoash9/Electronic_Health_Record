import { Gauge, Heart, Wind, Thermometer, Weight, Ruler, ChartBar } from 'lucide-react';
import { bmiCategory, bmiScalePercent, BMI_CUTOFFS, BMI_SCALE, IDEAL_BMI } from '../../lib/bmi';
import Badge from '../../components/ui/Badge';

const BMI_TONE = {
  Underweight: 'warn',
  Normal: 'success',
  Overweight: 'warn',
  Obese: 'danger',
};

// The patient's own band is drawn solid and the rest pale, so the bar reads
// as "which band" at a glance before the marker is even found.
const BMI_BANDS = [
  { category: 'Underweight', from: BMI_SCALE.min, to: BMI_CUTOFFS.normal, pale: 'bg-sky-100', solid: 'bg-sky-500' },
  { category: 'Normal', from: BMI_CUTOFFS.normal, to: BMI_CUTOFFS.overweight, pale: 'bg-emerald-100', solid: 'bg-[#0e7d6b]' },
  { category: 'Overweight', from: BMI_CUTOFFS.overweight, to: BMI_CUTOFFS.obese, pale: 'bg-amber-100', solid: 'bg-amber-600' },
  { category: 'Obese', from: BMI_CUTOFFS.obese, to: BMI_SCALE.max, pale: 'bg-rose-100', solid: 'bg-rose-500' },
];

const TICKS = [BMI_CUTOFFS.normal, BMI_CUTOFFS.overweight, BMI_CUTOFFS.obese];

// Category bounds are "at least", so the top of Normal is one decimal short of Overweight.
const NORMAL_RANGE = `${BMI_CUTOFFS.normal} to ${(BMI_CUTOFFS.overweight - 0.1).toFixed(1)}`;

const isMissing = (value) => value === null || value === undefined || value === '';

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      {children}
    </section>
  );
}

function ReadingLabel({ icon: Icon, children }) {
  return (
    <span className="flex items-center gap-2 text-sm font-semibold text-ink-900">
      <Icon size={15} className="shrink-0 text-[#0e7d6b]" />
      {children}
    </span>
  );
}

function ReadingValue({ value, unit }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-1.5">
      <span className="font-mono text-3xl font-bold text-ink-900 tabular-nums">{isMissing(value) ? '—' : value}</span>
      {!isMissing(value) && unit && <span className="text-xs text-ink-500">{unit}</span>}
    </p>
  );
}

function Reading({ icon, label, value, unit }) {
  return (
    <div className="flex min-h-28 flex-col justify-between gap-4 bg-surface p-4">
      <ReadingLabel icon={icon}>{label}</ReadingLabel>
      <ReadingValue value={value} unit={unit} />
    </div>
  );
}

/**
 * The bar is decoration for the legend beneath it, which says the same three
 * numbers in words -- so it is hidden from screen readers rather than
 * described twice.
 */
function BmiScale({ bmi, idealBmi, category }) {
  return (
    <div className="mt-5">
      <div aria-hidden className="relative h-4">
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full">
          {BMI_BANDS.map((band, i) => {
            const left = bmiScalePercent(band.from);
            return (
              <span
                key={band.category}
                className={`absolute inset-y-0 ${i > 0 ? 'border-l-2 border-surface' : ''} ${band.category === category ? band.solid : band.pale}`}
                style={{ left: `${left}%`, width: `${bmiScalePercent(band.to) - left}%` }}
              />
            );
          })}
        </div>
        <span
          className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-900"
          style={{ left: `${bmiScalePercent(idealBmi)}%` }}
        />
        <span
          className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink-900 bg-surface"
          style={{ left: `${bmiScalePercent(bmi)}%` }}
        />
      </div>
      <div aria-hidden className="relative mt-1.5 h-4 text-xs text-ink-500 tabular-nums">
        {TICKS.map((tick) => (
          <span key={tick} className="absolute -translate-x-1/2" style={{ left: `${bmiScalePercent(tick)}%` }}>
            {tick}
          </span>
        ))}
      </div>

      <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-600">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full border-2 border-ink-900" />
          This patient, {bmi}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-0.5 rounded-full bg-ink-900" />
          Ideal BMI, {idealBmi}
        </li>
        <li>Normal range {NORMAL_RANGE}</li>
      </ul>
    </div>
  );
}

function BmiReading({ bmi, idealBmi }) {
  const category = bmiCategory(isMissing(bmi) ? null : Number(bmi));

  return (
    <div className="col-span-2 bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <ReadingLabel icon={ChartBar}>Body mass index</ReadingLabel>
        <span className="text-xs text-ink-500">Asia-Pacific (WPRO) cutoffs</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <ReadingValue value={bmi} />
        {category && <Badge tone={BMI_TONE[category]}>{category}</Badge>}
      </div>
      {category && <BmiScale bmi={bmi} idealBmi={idealBmi} category={category} />}
    </div>
  );
}

/**
 * Station 1's readings as the record view shows them once its section is
 * opened: the four vitals in one panel, the body measurements and the BMI
 * they work out to in the other. Side by side from @3xl -- the container is
 * StationCollapsible, so it is the card's width that counts, not the page's.
 */
export default function Station1VitalsDetail({ form }) {
  const bp = isMissing(form.bpSystolic) ? null : `${form.bpSystolic}/${form.bpDiastolic}`;

  return (
    <div className="grid gap-6 @3xl:grid-cols-2">
      <Section title="Vital signs">
        <div className="grid flex-1 grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line">
          <Reading icon={Gauge} label="Blood pressure" value={bp} unit="mmHg" />
          <Reading icon={Heart} label="Heart rate" value={form.heartRate} unit="beats/min" />
          <Reading icon={Wind} label="Respiratory rate" value={form.respRate} unit="breaths/min" />
          <Reading icon={Thermometer} label="Temperature" value={form.tempCelsius} unit="°C" />
        </div>
      </Section>

      <Section title="Body measurements">
        <div className="grid flex-1 grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line">
          <Reading icon={Weight} label="Weight" value={form.weightKg} unit="kg" />
          <Reading icon={Ruler} label="Height" value={form.heightCm} unit="cm" />
          <BmiReading bmi={form.bmi} idealBmi={form.idealBMI ?? IDEAL_BMI} />
        </div>
      </Section>
    </div>
  );
}
