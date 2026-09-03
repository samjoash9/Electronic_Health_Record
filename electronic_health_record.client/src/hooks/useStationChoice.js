import { useCallback, useState } from 'react';

const KEY = 'ehr-station';

/** Which station this device is serving. Persisted so a tablet remembers. */
export function useStationChoice() {
  const [station, setStationState] = useState(() => {
    const raw = localStorage.getItem(KEY);
    return raw ? Number(raw) : null;
  });

  const setStation = useCallback((value) => {
    localStorage.setItem(KEY, String(value));
    setStationState(value);
  }, []);

  return { station, setStation };
}
