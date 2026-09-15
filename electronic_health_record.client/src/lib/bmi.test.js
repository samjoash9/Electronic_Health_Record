import { describe, it, expect } from 'vitest';
import { calculateBMI, calculateIdealWeightKg, bmiCategory, IDEAL_BMI } from './bmi';

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
    expect(calculateIdealWeightKg(170)).toBe(59.8);
  });

  it('returns null for invalid height', () => {
    expect(calculateIdealWeightKg(0)).toBeNull();
  });
});

describe('IDEAL_BMI', () => {
  it('is the midpoint of the Asia-Pacific normal range', () => {
    expect(IDEAL_BMI).toBe(20.7);
  });
});

describe('bmiCategory', () => {
  it('uses the Asia-Pacific cutoffs at each boundary', () => {
    expect(bmiCategory(18.4)).toBe('Underweight');
    expect(bmiCategory(18.5)).toBe('Normal');
    expect(bmiCategory(22.9)).toBe('Normal');
    expect(bmiCategory(23)).toBe('Overweight');
    expect(bmiCategory(24.9)).toBe('Overweight');
    expect(bmiCategory(25)).toBe('Obese');
  });

  it('classifies BMIs that WHO would call normal as overweight', () => {
    expect(bmiCategory(24)).toBe('Overweight');
  });

  it('classifies BMIs that WHO would call overweight as obese', () => {
    expect(bmiCategory(27)).toBe('Obese');
  });

  it('returns null when BMI is missing', () => {
    expect(bmiCategory(null)).toBeNull();
    expect(bmiCategory(undefined)).toBeNull();
  });
});
