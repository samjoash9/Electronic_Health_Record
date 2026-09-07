import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Blocks in-app navigation and browser unload while a form has unsaved edits.
 * Returns the blocker so the caller can render its own confirmation modal.
 *
 * `isDirty` may be a plain boolean or a `() => boolean` thunk. Pass a thunk
 * when the caller navigates in the same tick as a synchronous "just
 * submitted" flag flip (e.g. a ref set inside a mutation's onSuccess right
 * before calling navigate()) — no re-render happens in between, so a plain
 * boolean argument would still be the stale pre-flip value when the router
 * evaluates the blocker. A thunk reads the live value at intercept time
 * instead of baking in whatever was current at the last render.
 */
export function useUnsavedChangesGuard(isDirty) {
  const readIsDirty = () => (typeof isDirty === 'function' ? isDirty() : isDirty);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      readIsDirty() && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    const handler = (event) => {
      if (!readIsDirty()) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  });

  return blocker;
}
