import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutosaveDraft } from './useAutosaveDraft';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useAutosaveDraft', () => {
  it('does not save on mount', () => {
    const save = vi.fn(() => '2026-01-01T00:00:00.000Z');
    renderHook(({ payload }) => useAutosaveDraft(save, payload), {
      initialProps: { payload: { a: 1 } },
    });

    vi.advanceTimersByTime(5000);
    expect(save).not.toHaveBeenCalled();
  });

  it('saves once, debounced, after payload changes', () => {
    const save = vi.fn(() => '2026-01-01T00:00:00.000Z');
    const { rerender } = renderHook(({ payload }) => useAutosaveDraft(save, payload, { delayMs: 800 }), {
      initialProps: { payload: { a: 1 } },
    });

    rerender({ payload: { a: 2 } });
    vi.advanceTimersByTime(799);
    expect(save).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('restarts the timer on every change instead of stacking saves', () => {
    const save = vi.fn(() => '2026-01-01T00:00:00.000Z');
    const { rerender } = renderHook(({ payload }) => useAutosaveDraft(save, payload, { delayMs: 800 }), {
      initialProps: { payload: { a: 1 } },
    });

    rerender({ payload: { a: 2 } });
    vi.advanceTimersByTime(400);
    rerender({ payload: { a: 3 } });
    vi.advanceTimersByTime(400);
    // 800ms have elapsed in total, but the second change reset the clock
    // with only 400ms left on it, so no save has fired yet.
    expect(save).not.toHaveBeenCalled();

    vi.advanceTimersByTime(400);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('calls onSaved with the timestamp after a successful save', () => {
    const save = vi.fn(() => '2026-01-01T00:00:00.000Z');
    const onSaved = vi.fn();
    const { rerender } = renderHook(
      ({ payload }) => useAutosaveDraft(save, payload, { delayMs: 800, onSaved }),
      { initialProps: { payload: { a: 1 } } },
    );

    rerender({ payload: { a: 2 } });
    vi.advanceTimersByTime(800);
    expect(onSaved).toHaveBeenCalledWith('2026-01-01T00:00:00.000Z');
  });

  it('does not call onSaved when save fails (returns null)', () => {
    const save = vi.fn(() => null);
    const onSaved = vi.fn();
    const { rerender } = renderHook(
      ({ payload }) => useAutosaveDraft(save, payload, { delayMs: 800, onSaved }),
      { initialProps: { payload: { a: 1 } } },
    );

    rerender({ payload: { a: 2 } });
    vi.advanceTimersByTime(800);
    expect(save).toHaveBeenCalledTimes(1);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('skips the save when stoppedRef.current is true at fire time', () => {
    const save = vi.fn(() => '2026-01-01T00:00:00.000Z');
    const stoppedRef = { current: false };
    const { rerender } = renderHook(
      ({ payload }) => useAutosaveDraft(save, payload, { delayMs: 800, stoppedRef }),
      { initialProps: { payload: { a: 1 } } },
    );

    rerender({ payload: { a: 2 } });
    // Flips synchronously, the way a mutation's onSuccess flips
    // submittedRef.current right before navigating away.
    stoppedRef.current = true;
    vi.advanceTimersByTime(800);

    expect(save).not.toHaveBeenCalled();
  });

  it('fires the latest save closure even if it changed after the timer armed', () => {
    const firstSave = vi.fn(() => '2026-01-01T00:00:00.000Z');
    const secondSave = vi.fn(() => '2026-01-01T00:00:01.000Z');
    const { rerender } = renderHook(
      ({ payload, save }) => useAutosaveDraft(save, payload, { delayMs: 800 }),
      { initialProps: { payload: { a: 1 }, save: firstSave } },
    );

    // Arms the timer against a stable payload reference held from here on,
    // so the next rerender changes only the closure, not the payload.
    const stablePayload = { a: 2 };
    rerender({ payload: stablePayload, save: firstSave });
    vi.advanceTimersByTime(400);
    // Payload unchanged (same reference) -- only the closure swaps, so the
    // already-armed timer must not reset, and must call whichever closure
    // is current when it fires rather than the one current when scheduled.
    rerender({ payload: stablePayload, save: secondSave });
    vi.advanceTimersByTime(400);

    expect(firstSave).not.toHaveBeenCalled();
    expect(secondSave).toHaveBeenCalledTimes(1);
  });
});
