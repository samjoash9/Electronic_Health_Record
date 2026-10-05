// Colours and class lists shared by the Health Reports charts.
//
// BMI and BP classes are states, so they wear the status palette (good /
// warning / serious / critical) and always sit beside their label -- colour
// never carries the class on its own. Trend lines are plain series, so they
// take categorical slots that are kept apart from the status hues.

import { BP_CLASSES, BP_CLASS_LABEL } from '../../lib/bloodPressure';

export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
  // One step past critical, for hypertensive crisis only.
  severe: '#8f1f1f',
};

export const BMI_CLASSES = [
  { key: 'underweight', label: 'Underweight', range: '< 18.5', color: STATUS.warning },
  { key: 'normal', label: 'Normal', range: '18.5–22.9', color: STATUS.good },
  { key: 'overweight', label: 'Overweight', range: '23–24.9', color: STATUS.warning },
  { key: 'obese', label: 'Obese', range: '≥ 25', color: STATUS.critical },
];

const BP_RANGE = {
  normal: '< 120 / < 80',
  elevated: '120–129 / < 80',
  stage1: '130–139 / 80–89',
  stage2: '≥ 140 / ≥ 90',
  crisis: '> 180 / > 120',
};

const BP_COLOR = {
  normal: STATUS.good,
  elevated: STATUS.warning,
  stage1: STATUS.serious,
  stage2: STATUS.critical,
  crisis: STATUS.severe,
};

export const BP_CLASS_LIST = BP_CLASSES.map((key) => ({
  key,
  label: BP_CLASS_LABEL[key],
  range: BP_RANGE[key],
  color: BP_COLOR[key],
}));

// Categorical slots 1 and 2 (validated as a pair: CVD ΔE 24.7).
export const SERIES = {
  overweight: '#2a78d6',
  highBp: '#eb6834',
};

// Recessive chrome: hairline, solid, one step off the white surface.
export const GRID = '#eef0f4';
export const AXIS_TEXT = '#94a3b8';
