import { useCallback, useEffect, useState } from 'react';

/**
 * After a submit fails validation, scrolls the first flagged field (in page
 * order) to the middle of the screen -- clear of a sticky submit bar -- and
 * focuses it. Runs from an effect so the warnings that just failed have
 * rendered their aria-invalid before it looks for one.
 *
 * Pair with `shouldFocusError: false` on the form, or react-hook-form's own
 * focus (in its field-registration order) can land somewhere else afterwards.
 */
export function useRevealFirstInvalid(containerRef) {
  const [request, setRequest] = useState(0);

  useEffect(() => {
    if (!request) return;
    const field = containerRef.current?.querySelector('[aria-invalid="true"]');
    if (!field) return;
    field.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    field.focus({ preventScroll: true });
  }, [request, containerRef]);

  return useCallback(() => setRequest((n) => n + 1), []);
}
