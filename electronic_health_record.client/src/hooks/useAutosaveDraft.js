import { useEffect, useRef } from 'react';

const DEFAULT_DELAY_MS = 800;

/**
 * Debounced autosave: calls `save()` a short idle period after `payload`
 * last changed, so a draft is on disk before a stray reload or crash can
 * lose it -- without writing to storage on every keystroke.
 *
 * Skips the save on mount (the first render's payload is either the
 * restored draft or the blank default, and re-writing either back
 * unchanged is pure waste) and fires again only once `payload` actually
 * changes by reference, so callers should build it with `useMemo` or a
 * plain object literal recomputed from form state on every render (the
 * effect's own deps compare it, not any of its fields individually).
 *
 * `save` and `onSaved` are read via a ref that is only ever written inside
 * an effect (never during render -- the React Compiler flags a
 * render-time `ref.current =` write as unsafe), so callers can pass a
 * fresh closure each render without re-arming the debounce timer.
 *
 * @param {() => (string|null)} save - performs the write; returns the
 *   saved-at timestamp on success, or null/falsy on failure (matches the
 *   station*Draft.js `saveDraft` return shape).
 * @param {unknown} payload - value whose identity change schedules a save.
 * @param {object} [options]
 * @param {number} [options.delayMs]
 * @param {{current: boolean}} [options.stoppedRef] - when `.current` is
 *   true at the moment the debounce timer fires, the save is skipped.
 *   Pass the same "just submitted" ref the page already flips synchronously
 *   in a mutation's onSuccess (read at fire-time, inside the timer
 *   callback, rather than during render -- a render-time `ref.current`
 *   read is unsafe under the React Compiler and would also just be stale
 *   by the time the debounced timer actually runs).
 * @param {(savedAt: string) => void} [options.onSaved] - called after a
 *   successful debounced save, e.g. to update a "Draft saved at" label.
 */
export function useAutosaveDraft(save, payload, { delayMs = DEFAULT_DELAY_MS, stoppedRef, onSaved } = {}) {
  const saveRef = useRef(save);
  const onSavedRef = useRef(onSaved);
  const mountedOnce = useRef(false);

  // Keeps the refs current without reading or writing them during render.
  useEffect(() => {
    saveRef.current = save;
    onSavedRef.current = onSaved;
  });

  useEffect(() => {
    if (!mountedOnce.current) {
      // First render: payload is the initial (possibly restored) state.
      // Nothing has changed yet, so there is nothing new to persist.
      mountedOnce.current = true;
      return undefined;
    }

    const timer = setTimeout(() => {
      if (stoppedRef?.current) return;
      const savedAt = saveRef.current();
      if (savedAt) onSavedRef.current?.(savedAt);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [payload, delayMs, stoppedRef]);
}
