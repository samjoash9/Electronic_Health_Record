import { useCallback, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { readStation, writeStation } from '../lib/stationStorage';

// Re-exported so callers that only need to read a station (RequireAuth,
// LoginPage) keep importing from one place.
export { readStation, stationKeyFor, clearStations } from '../lib/stationStorage';

/** Which station this device is serving, for the signed-in role. Persisted so a tablet remembers. */
export function useStationChoice() {
  const { user } = useAuth();
  const role = user?.role;

  const [station, setStationState] = useState(() => readStation(role));

  const setStation = useCallback((value) => {
    writeStation(role, value);
    setStationState(value);
  }, [role]);

  return { station, setStation };
}
