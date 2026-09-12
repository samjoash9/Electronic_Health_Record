import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

// Signing out must never be blocked by a dirty form. The session is already
// cleared by the time we navigate to /login, so a blocked navigation strands
// the user on a shell with no session and no way forward -- the sidebar stays
// up, the outlet renders nothing, and the blocker never resolves because the
// page that owns the confirmation modal is the one being navigated away from.
//
// Module-level rather than context so the blocker predicate can read it
// synchronously at intercept time, in the same tick as the navigate() call.
let signingOut = false;

export function beginSignOut() {
  signingOut = true;
}

export function endSignOut() {
  signingOut = false;
}

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
      !signingOut &&
      readIsDirty() &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    const handler = (event) => {
      if (signingOut || !readIsDirty()) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  });

  return blocker;
}
