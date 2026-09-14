import { useState, useEffect } from 'react';

const QUERY = '(max-width: 1023px)';

/** True at or below the `lg` breakpoint (1023px) -- the sidebar uses this to
 * force its collapsed rail state on tablets, where a full-width sidebar
 * eats too much of the viewport. */
export function useIsTabletDown() {
  const [isTabletDown, setIsTabletDown] = useState(
    () => window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = (e) => setIsTabletDown(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isTabletDown;
}
