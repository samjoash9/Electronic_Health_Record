import { describe, it, expect } from 'vitest';
import { bpClass, isHighBp } from './bloodPressure';

describe('bpClass', () => {
  it.each([
    [118, 76, 'normal'],
    [124, 78, 'elevated'],
    [132, 78, 'stage1'],
    [118, 84, 'stage1'],
    [142, 88, 'stage2'],
    [128, 92, 'stage2'],
    [182, 100, 'crisis'],
    [150, 122, 'crisis'],
  ])('%i/%i is %s', (sys, dia, expected) => {
    expect(bpClass(sys, dia)).toBe(expected);
  });

  it('lets the worse reading decide', () => {
    // Systolic alone is elevated; diastolic pushes it to stage 1.
    expect(bpClass(125, 82)).toBe('stage1');
  });

  it('has no class without both readings', () => {
    expect(bpClass(null, 80)).toBeNull();
    expect(bpClass(120, undefined)).toBeNull();
  });
});

describe('isHighBp', () => {
  it('counts stage 1 and above', () => {
    expect(['normal', 'elevated', 'stage1', 'stage2', 'crisis'].map(isHighBp))
      .toEqual([false, false, true, true, true]);
  });
});
