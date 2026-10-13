import { describe, expect, it } from 'vitest';
import { chartMotion } from './chartMotion';

describe('chartMotion', () => {
  it('turns the draw-in off while a PDF export captures charts', () => {
    expect(chartMotion('bar', true).isAnimationActive).toBe(false);
  });

  it('otherwise leaves the draw-in to the reduced-motion setting', () => {
    expect(chartMotion('bar', false).isAnimationActive).toBe('auto');
  });

  it('gives every chart kind on the page a draw-in length', () => {
    for (const kind of ['bar', 'pie', 'line']) {
      expect(chartMotion(kind, false).animationDuration, kind).toBeGreaterThan(0);
    }
  });
});
