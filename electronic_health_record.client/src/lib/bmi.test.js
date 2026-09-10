import { describe, it, expect } from 'vitest';
import { calculateBMI, calculateIdealWeightKg, IDEAL_BMI } from './bmi';

describe('calculateBMI', () => {
  it('computes BMI from weight in kg and height in cm', () => {
    expect(calculateBMI(70, 170)).toBe(24.2);
  });

  it('rounds to one decimal place', () => {
    expect(calculateBMI(64, 160)).toBe(25);
  });

  it('returns null when height is zero', () => {
    expect(calculateBMI(70, 0)).toBeNull();
  });

  it('returns null when either input is missing', () => {
    expect(calculateBMI(null, 170)).toBeNull();
    expect(calculateBMI(70, undefined)).toBeNull();
    expect(calculateBMI('', '')).toBeNull();
  });

  it('returns null for negative input', () => {
    expect(calculateBMI(-70, 170)).toBeNull();
  });

  it('accepts numeric strings from form inputs', () => {
    expect(calculateBMI('70', '170')).toBe(24.2);
  });
});

describe('calculateIdealWeightKg', () => {
  it('returns the weight that yields the ideal BMI for a height', () => {
    expect(calculateIdealWeightKg(170)).toBe(63.6);
  });

  it('returns null for invalid height', () => {
    expect(calculateIdealWeightKg(0)).toBeNull();
  });
});

describe('IDEAL_BMI', () => {
  it('is the midpoint of the WHO normal range', () => {
    expect(IDEAL_BMI).toBe(22);
  });
});
