import { useCallback, useState } from 'react';

/**
 * Tracks an element's content-box width. Returns `[ref, width]`: attach `ref`
 * to the element; `width` is null until the first measurement, and stays null
 * where ResizeObserver does not exist (jsdom), so callers fall back to their
 * wide layout there.
 *
 * A callback ref rather than an effect, so an element that mounts late (after
 * a loading skeleton, say) is still observed.
 */
export function useElementWidth() {
  const [width, setWidth] = useState(null);

  const ref = useCallback((el) => {
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
