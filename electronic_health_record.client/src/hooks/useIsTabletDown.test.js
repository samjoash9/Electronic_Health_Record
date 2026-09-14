import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsTabletDown } from './useIsTabletDown';

function mockMatchMedia(initialMatches) {
  let listener;
  const mql = {
    matches: initialMatches,
    media: '(max-width: 1023px)',
    addEventListener: (_event, cb) => { listener = cb; },
    removeEventListener: () => { listener = undefined; },
  };
  window.matchMedia = vi.fn().mockReturnValue(mql);
  return {
    mql,
    fire(matches) {
      mql.matches = matches;
      listener?.({ matches });
    },
  };
}

describe('useIsTabletDown', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns true when the viewport starts at or below 1023px', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useIsTabletDown());
    expect(result.current).toBe(true);
  });

  it('returns false when the viewport starts above 1023px', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useIsTabletDown());
    expect(result.current).toBe(false);
  });

  it('updates when the media query change fires', () => {
    const { fire } = mockMatchMedia(false);
    const { result } = renderHook(() => useIsTabletDown());
    expect(result.current).toBe(false);

    act(() => fire(true));
    expect(result.current).toBe(true);
  });
});
