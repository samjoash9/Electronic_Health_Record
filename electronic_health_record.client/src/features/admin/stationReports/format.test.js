import { describe, it, expect } from 'vitest';
import { minutes, pct, toRanked, toSegments } from './format';

describe('pct', () => {
  it('rounds the share to a whole percent', () => {
    expect(pct(1, 3)).toBe('33%');
  });
  it('shows an em dash when there is nothing to divide by', () => {
    expect(pct(0, 0)).toBe('—');
  });
});

describe('minutes', () => {
  it('rounds to whole minutes', () => {
    expect(minutes(14.5)).toBe('15 min');
  });
  it('shows an em dash when nothing was timed', () => {
    expect(minutes(null)).toBe('—');
  });
});

describe('toSegments', () => {
  it('lays counts out in the theme order, zero-filling missing keys', () => {
    const classes = [
      { key: 'a', label: 'A', color: '#111' },
      { key: 'b', label: 'B', color: '#222' },
    ];
    expect(toSegments(classes, { a: 3 })).toEqual([
      { key: 'a', label: 'A', color: '#111', value: 3 },
      { key: 'b', label: 'B', color: '#222', value: 0 },
    ]);
  });
});

describe('toRanked', () => {
  it('maps server rows onto name/value pairs', () => {
    expect(toRanked([{ name: 'CBC', count: 5 }], 'count')).toEqual([{ name: 'CBC', value: 5 }]);
  });
});
