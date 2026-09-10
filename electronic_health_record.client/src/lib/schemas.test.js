import { describe, it, expect } from 'vitest';
import { vitalsSchema } from './schemas';

const valid = {
  weightKg: 62, heightCm: 158, bpSystolic: 118, bpDiastolic: 76,
  tempCelsius: 36.6, heartRate: 72, respRate: 16,
};

describe('vitalsSchema', () => {
  it('accepts a plausible set of vitals', () => {
    expect(vitalsSchema.safeParse(valid).success).toBe(true);
  });

  it('coerces numeric strings from text inputs', () => {
    const result = vitalsSchema.safeParse({ ...valid, weightKg: '62' });
    expect(result.success).toBe(true);
    expect(result.data.weightKg).toBe(62);
  });

  it('rejects an implausible weight', () => {
    expect(vitalsSchema.safeParse({ ...valid, weightKg: 0 }).success).toBe(false);
    expect(vitalsSchema.safeParse({ ...valid, weightKg: 500 }).success).toBe(false);
  });

  it('rejects an implausible height', () => {
    expect(vitalsSchema.safeParse({ ...valid, heightCm: 20 }).success).toBe(false);
  });

  it('rejects a temperature outside survivable range', () => {
    expect(vitalsSchema.safeParse({ ...valid, tempCelsius: 12 }).success).toBe(false);
    expect(vitalsSchema.safeParse({ ...valid, tempCelsius: 60 }).success).toBe(false);
  });

  it('rejects diastolic pressure at or above systolic', () => {
    const result = vitalsSchema.safeParse({
      ...valid, bpSystolic: 110, bpDiastolic: 120,
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(['bpDiastolic']);
  });

  it('rejects a non-integer heart rate', () => {
    expect(vitalsSchema.safeParse({ ...valid, heartRate: 72.5 }).success).toBe(false);
  });
});
