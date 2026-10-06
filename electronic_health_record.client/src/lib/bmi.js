/**
 * BMI categories follow the WHO Western Pacific (WPRO) Asia-Pacific cutoffs,
 * not the WHO international ones: the overweight and obese thresholds sit at
 * 23 and 25 instead of 25 and 30, because cardiometabolic risk rises at a
 * lower BMI in Asian populations.
 *
 * Ideal BMI is stored on WellnessForm.IdealBMI as a decimal. It is the
 * midpoint of the Asia-Pacific normal range (18.5-22.9), which is the same
 * value for every patient. calculateIdealWeightKg is the per-patient figure
 * staff actually read: the weight that would put this patient at IDEAL_BMI.
 *
 * NOTE: confirm with the clinical stakeholders whether IdealBMI is meant to
 * hold this constant or the ideal body weight. See the plan's "Open question"
 * note. Changing it later touches only this file and the Station 1 vitals
 * component.
 */
export const IDEAL_BMI = 20.7;

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

/** Lower bound of each category above Underweight, on the Asia-Pacific cutoffs. */
export const BMI_CUTOFFS = { normal: 18.5, overweight: 23, obese: 25 };

export function bmiCategory(bmi) {
  if (bmi === null || bmi === undefined) return null;
  if (bmi < BMI_CUTOFFS.normal) return 'Underweight';
  if (bmi < BMI_CUTOFFS.overweight) return 'Normal';
  if (bmi < BMI_CUTOFFS.obese) return 'Overweight';
  return 'Obese';
}

/**
 * The span the record view's BMI bar draws: wide enough to hold most adults
 * with room either side of the cutoffs, which crowd together between 18.5
 * and 25 on the Asia-Pacific scale.
 */
export const BMI_SCALE = { min: 15, max: 35 };

/** Where a BMI sits along BMI_SCALE, 0-100; a reading off either end pins to it. */
export function bmiScalePercent(bmi) {
  const percent = ((Number(bmi) - BMI_SCALE.min) / (BMI_SCALE.max - BMI_SCALE.min)) * 100;
  return Math.min(100, Math.max(0, percent));
}
