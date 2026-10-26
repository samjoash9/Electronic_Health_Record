import { useState, useEffect } from 'react';

const QUERY = '(max-width: 767px)';

/** True below the `md` breakpoint (767px) -- the sidebar uses this to leave
 * the layout entirely on phones and open as an off-canvas drawer instead,
 * since even the collapsed icon rail eats too much of a phone screen. */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
