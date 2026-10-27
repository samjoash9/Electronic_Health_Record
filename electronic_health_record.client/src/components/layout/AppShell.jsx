import { Suspense, useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import RouteErrorBoundary from '../RouteErrorBoundary';
import PageLoader from '../ui/PageLoader';
import { useIsTabletDown } from '../../hooks/useIsTabletDown';
import { useIsMobile } from '../../hooks/useIsMobile';

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

  // Below md (768px) the sidebar leaves the layout and becomes an off-canvas
  // drawer the hamburger slides in from the left. It is session-only state,
  // separate from `collapsed`, so opening the drawer on a phone never changes
  // the rail preference a tablet or desktop restores.
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Growing past md with the drawer open would otherwise leave it open, ready
  // to reappear the next time the viewport shrinks back down. Reset during
  // render (not in an effect) so the stale open state never paints.
  const [drawerWasMobile, setDrawerWasMobile] = useState(isMobile);
  if (drawerWasMobile !== isMobile) {
    setDrawerWasMobile(isMobile);
    setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  };

  const closeDrawer = () => setDrawerOpen(false);

  return (
    // min-h-0 on the row and the column below keeps an over-tall child (a long
    // sidebar, a tall page) scrolling inside its own pane instead of stretching
    // the shell past the viewport and exposing blank space under it.
    <div className="flex h-full min-h-0 overflow-hidden">
      {isMobile && (
        <div
          aria-hidden="true"
          data-testid="sidebar-backdrop"
          onClick={closeDrawer}
          className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
        />
      )}
      <Sidebar
        collapsed={isMobile ? false : collapsed}
        mobile={isMobile}
        open={drawerOpen}
        onNavigate={isMobile ? closeDrawer : undefined}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          collapsed={collapsed}
          isTabletDown={isTabletDown}
          isMobile={isMobile}
          drawerOpen={drawerOpen}
          onToggleSidebar={isMobile ? () => setDrawerOpen((prev) => !prev) : toggleCollapsed}
        />
        <main className="flex-1 overflow-y-auto bg-canvas p-4 pb-0">
          <RouteErrorBoundary>
            {/* Pages load lazily (routes.jsx); the shell stays put while one arrives. */}
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </RouteErrorBoundary>
        </main>
      </div>
    </div>
  );
}
