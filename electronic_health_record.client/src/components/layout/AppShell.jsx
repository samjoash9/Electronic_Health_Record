import { useState } from 'react';
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
  // Below lg (1024px) the sidebar is always the icon rail -- a full-width
  // sidebar eats too much of a tablet viewport. The user's manual
  // preference is untouched and takes effect again once the viewport
  // crosses back to desktop width.
  const forcedCollapsed = useIsTabletDown();
  const effectiveCollapsed = forcedCollapsed || collapsed;

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  };

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar collapsed={effectiveCollapsed} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          collapsed={effectiveCollapsed}
          canToggle={!forcedCollapsed}
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
