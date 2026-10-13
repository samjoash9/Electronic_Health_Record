import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useReportFilter } from './useReportFilter';

describe('useReportFilter', () => {
  beforeEach(() => {
    // 2026-10-05 11:00 in Manila.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-05T03:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens on the current Manila month for every office', () => {
    const { result } = renderHook(() => useReportFilter());

    expect(result.current.params).toEqual({ from: '2026-10-01', to: '2026-10-31' });
    expect(result.current.label).toBe('All offices · October 2026');
  });

  it('adds the picked office to the params and the label', () => {
    const { result } = renderHook(() => useReportFilter());

    act(() => result.current.setOffice('PROVINCIAL HEALTH OFFICE'));

    expect(result.current.params).toEqual({
      from: '2026-10-01',
      to: '2026-10-31',
      office: 'PROVINCIAL HEALTH OFFICE',
    });
    expect(result.current.label).toBe('PROVINCIAL HEALTH OFFICE · October 2026');
  });

  it('follows a switch to a single day', () => {
    const { result } = renderHook(() => useReportFilter());

    act(() => result.current.setGranularity('day'));

    expect(result.current.params).toEqual({ from: '2026-10-05', to: '2026-10-05' });
    expect(result.current.label).toBe('All offices · October 5, 2026');
  });
});
