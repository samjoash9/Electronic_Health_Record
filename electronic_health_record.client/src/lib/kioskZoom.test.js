import { describe, it, expect, beforeEach } from 'vitest';
import {
  readZoomIndex, writeZoomIndex, ZOOM_LEVELS, DEFAULT_ZOOM_INDEX,
} from './kioskZoom';

beforeEach(() => {
  localStorage.clear();
});

describe('kioskZoom', () => {
  it('defaults to the smallest size when nothing is stored', () => {
    expect(readZoomIndex()).toBe(DEFAULT_ZOOM_INDEX);
    expect(ZOOM_LEVELS[readZoomIndex()]).toBe(1);
  });

  it('round-trips a stored size', () => {
    writeZoomIndex(2);
    expect(readZoomIndex()).toBe(2);
  });

  it('persists across forms rather than per form', () => {
    writeZoomIndex(3);
    // No formID is involved at all -- the same value is read back for any
    // assessment opened on this device.
    expect(readZoomIndex()).toBe(3);
  });

  it('clamps a stored value above the largest level', () => {
    localStorage.setItem('ehr:kiosk-text-size', '99');
    expect(readZoomIndex()).toBe(ZOOM_LEVELS.length - 1);
  });

  it('clamps a negative stored value', () => {
    localStorage.setItem('ehr:kiosk-text-size', '-4');
    expect(readZoomIndex()).toBe(0);
  });

  it('falls back to the default for a non-numeric value', () => {
    localStorage.setItem('ehr:kiosk-text-size', 'huge');
    expect(readZoomIndex()).toBe(DEFAULT_ZOOM_INDEX);
  });

  it('clamps on write too', () => {
    writeZoomIndex(99);
    expect(readZoomIndex()).toBe(ZOOM_LEVELS.length - 1);
  });
});
