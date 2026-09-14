import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FORM_STATUS, STATIONS } from '../lib/constants';

// The one status that means "this desk still owns this form". Anything else --
// a later station's pending status, Completed, or Cancelled -- means the desk is
// done with it and the record is read-only from here on.
const OPEN_STATUS = {
  [STATIONS.THREE]: FORM_STATUS.PENDING_CONSULTATION,
  [STATIONS.FOUR]: FORM_STATUS.PENDING_DENTAL,
  [STATIONS.FIVE]: FORM_STATUS.PENDING_VISION,
};

/**
 * True when `form` is no longer this station's to edit. A form still loading is
 * not "done" -- callers must not redirect on undefined.
 */
export function isFormDoneAtStation(form, station) {
  const open = OPEN_STATUS[station];
  if (!open || !form?.status) return false;
  return form.status !== open;
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
