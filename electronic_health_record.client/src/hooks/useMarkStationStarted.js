import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { startStation } from '../api/forms.api';
import { FORM_STATUS, STATIONS } from '../lib/constants';

// The status a form carries while it waits at each desk.
const OPEN_STATUS = {
  [STATIONS.TWO]: FORM_STATUS.PENDING_ASSESSMENT,
  [STATIONS.THREE]: FORM_STATUS.PENDING_CONSULTATION,
  [STATIONS.FOUR]: FORM_STATUS.PENDING_DENTAL,
  [STATIONS.FIVE]: FORM_STATUS.PENDING_VISION,
};

/**
 * Stamps `station{N}StartedAt` the first time this desk opens `form`, so every
 * queue for the station shows it in progress (the Status column on the
 * station queue pages).
 *
 * Waits for the form's own status: React Query can briefly serve the previous
 * station's cached copy (see useStationFormGuard), and the effect re-runs once
 * the fresh read lands. Best-effort -- a failure leaves the queue showing "not
 * yet started" but must never block the person working the form, so errors
 * are dropped.
 */
export function useMarkStationStarted(form, station) {
  const queryClient = useQueryClient();
  const formID = form?.formID;
  const isOpenHere = Boolean(form) && form.status === OPEN_STATUS[station];
  const alreadyStarted = Boolean(form?.[`station${station}StartedAt`]);

  useEffect(() => {
    if (!formID || !isOpenHere || alreadyStarted) return;
    startStation(formID, station)
      .then(() => {
        // That write bumped RowVersion. Re-read the form so this desk's
        // submit doesn't 409 against the copy loaded before it.
        queryClient.invalidateQueries({ queryKey: ['form', formID] });
        queryClient.invalidateQueries({ queryKey: ['queue'] });
      })
      .catch(() => {});
  }, [formID, station, isOpenHere, alreadyStarted, queryClient]);
}
