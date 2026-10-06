import { describe, it, expect } from 'vitest';
import {
  calculateBMI, calculateIdealWeightKg, bmiCategory, bmiScalePercent, IDEAL_BMI, BMI_SCALE,
} from './bmi';

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

describe('bmiScalePercent', () => {
  it('places a BMI proportionally along the drawn scale', () => {
    expect(bmiScalePercent(BMI_SCALE.min)).toBe(0);
    expect(bmiScalePercent(BMI_SCALE.max)).toBe(100);
    expect(bmiScalePercent(25)).toBeCloseTo(50);
  });

  it('pins a BMI outside the scale to the nearer end', () => {
    expect(bmiScalePercent(12)).toBe(0);
    expect(bmiScalePercent(48)).toBe(100);
  });

  it('accepts the decimal string the API may send', () => {
    expect(bmiScalePercent('28.7')).toBeCloseTo(68.5);
  });
});
