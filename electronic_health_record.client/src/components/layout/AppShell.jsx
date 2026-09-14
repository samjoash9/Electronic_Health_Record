import { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import RouteErrorBoundary from '../RouteErrorBoundary';
import { useIsTabletDown } from '../../hooks/useIsTabletDown';

const COLLAPSE_KEY = 'sidebar:collapsed';

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === 'true',
  );
  // Below lg (1024px) the sidebar auto-shrinks to the icon rail the moment
  // the viewport crosses down -- a full-width sidebar eats too much of a
  // tablet screen by default. It's a one-time nudge, not a lock: the user
  // can still expand it back via the hamburger toggle, and that choice
  // sticks (same `collapsed` state/localStorage the desktop toggle uses)
  // until they collapse it again or resize back past 1024px and down again.
  const isTabletDown = useIsTabletDown();
  // Starts `false` regardless of the current viewport so that mounting
  // already below lg (a fresh page load on a tablet) is itself read as a
  // transition into tablet-down and triggers the one-time collapse below --
  // not just a later resize crossing the breakpoint.
  const wasTabletDown = useRef(false);
  useEffect(() => {
    if (isTabletDown && !wasTabletDown.current) {
      setCollapsed(true);
    }
    wasTabletDown.current = isTabletDown;
  }, [isTabletDown]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  };

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          collapsed={collapsed}
          isTabletDown={isTabletDown}
          onToggleSidebar={toggleCollapsed}
        />
        <main className="flex-1 overflow-y-auto bg-canvas p-4 pb-0">
          <RouteErrorBoundary>
            <Outlet />
          </RouteErrorBoundary>
        </main>
      </div>
    </div>
  );
}
