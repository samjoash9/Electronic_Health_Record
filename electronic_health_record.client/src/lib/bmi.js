/**
 * Ideal BMI is stored on WellnessForm.IdealBMI as a decimal. It is the
 * midpoint of the WHO normal range (18.5-24.9), which is the same value for
 * every patient. calculateIdealWeightKg is the per-patient figure staff
 * actually read: the weight that would put this patient at IDEAL_BMI.
 *
 * NOTE: confirm with the clinical stakeholders whether IdealBMI is meant to
 * hold this constant or the ideal body weight. See the plan's "Open question"
 * note. Changing it later touches only this file and the Station 1 vitals
 * component.
 */
export const IDEAL_BMI = 22;

function toPositiveNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

export function calculateBMI(weightKg, heightCm) {
  const w = toPositiveNumber(weightKg);
  const h = toPositiveNumber(heightCm);
  if (w === null || h === null) return null;
  const heightM = h / 100;
  return round1(w / (heightM * heightM));
}

export function calculateIdealWeightKg(heightCm) {
  const h = toPositiveNumber(heightCm);
  if (h === null) return null;
  const heightM = h / 100;
  return round1(IDEAL_BMI * heightM * heightM);
}

export function bmiCategory(bmi) {
  if (bmi === null || bmi === undefined) return null;
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}
