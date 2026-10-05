/**
 * Blood pressure classes, mildest first.
 *
 * Cutoffs follow the 2017 ACC/AHA guideline (stage 1 from 130/80). The
 * Philippine Society of Hypertension still puts hypertension at 140/90, so
 * a clinic following it would fold "stage1" into "elevated".
 *
 * !! NEEDS CLINICAL REVIEW !! -- which guideline the clinic reports against
 * is the physicians' call. Changing it touches only this file.
 */
export const BP_CLASSES = ['normal', 'elevated', 'stage1', 'stage2', 'crisis'];

export const BP_CLASS_LABEL = {
  normal: 'Normal',
  elevated: 'Elevated',
  stage1: 'Stage 1',
  stage2: 'Stage 2',
  crisis: 'Crisis',
};

/** The worse of the two readings decides the class, as the guideline does. */
export function bpClass(systolic, diastolic) {
  if (systolic == null || diastolic == null) return null;
  if (systolic > 180 || diastolic > 120) return 'crisis';
  if (systolic >= 140 || diastolic >= 90) return 'stage2';
  if (systolic >= 130 || diastolic >= 80) return 'stage1';
  if (systolic >= 120) return 'elevated';
  return 'normal';
}

/** Stage 1 and above: what the reports count as high blood pressure. */
export const isHighBp = (cls) => cls === 'stage1' || cls === 'stage2' || cls === 'crisis';
