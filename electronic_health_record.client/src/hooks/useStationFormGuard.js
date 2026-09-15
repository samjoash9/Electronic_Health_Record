import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FORM_STATUS, STATIONS } from '../lib/constants';

// The one status that means "this desk still owns this form".
const OPEN_STATUS = {
  [STATIONS.THREE]: FORM_STATUS.PENDING_CONSULTATION,
  [STATIONS.FOUR]: FORM_STATUS.PENDING_DENTAL,
  [STATIONS.FIVE]: FORM_STATUS.PENDING_VISION,
};

// The lifecycle in order, so "has this form moved past this desk?" is a
// position comparison rather than a bare inequality. Only a status strictly
// later than the desk's own means the work here is finished.
const STATUS_ORDER = [
  FORM_STATUS.PENDING_ASSESSMENT,
  FORM_STATUS.PENDING_CONSULTATION,
  FORM_STATUS.PENDING_DENTAL,
  FORM_STATUS.PENDING_VISION,
  FORM_STATUS.COMPLETED,
];

/**
 * True when `form` is no longer this station's to edit. A form still loading is
 * not "done" -- callers must not redirect on undefined.
 *
 * Only a form that has moved PAST this desk counts as done. A status that is
 * merely behind this desk is not: React Query serves the cached form for
 * staleTime after the previous station invalidates it, so opening a freshly
 * handed-off form briefly shows the previous station's status. Treating that
 * as "done" bounced the user to Forms on the first open (see the App-level
 * staleTime in App.jsx). An unknown status redirects, keeping Cancelled and
 * any future terminal state read-only by default.
 */
export function isFormDoneAtStation(form, station) {
  const open = OPEN_STATUS[station];
  if (!open || !form?.status) return false;
  if (form.status === open) return false;

  const here = STATUS_ORDER.indexOf(open);
  const actual = STATUS_ORDER.indexOf(form.status);
  // A status behind this desk is a stale read, not finished work.
  if (actual !== -1 && actual < here) return false;
  return true;
}

/**
 * Sends a doctor who typed (or bookmarked) a station URL for a form that desk
 * has already finished to the read-only Forms view instead of the editable
 * station page.
 *
 * The queues no longer list finished work, so this covers the remaining way in:
 * a stale tab, a back button, or a pasted link. It is a UX guard, not an
 * authorization boundary -- the API still accepts a resubmit, and rejects it on
 * the row version instead.
 */
export function useStationFormGuard(form, station) {
  const navigate = useNavigate();
  const done = isFormDoneAtStation(form, station);

  useEffect(() => {
    if (done) navigate(`/forms/${form.formID}`, { replace: true });
  }, [done, form?.formID, navigate]);

  return done;
}
