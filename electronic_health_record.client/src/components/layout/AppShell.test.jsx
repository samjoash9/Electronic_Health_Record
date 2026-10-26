import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppShell from './AppShell';

vi.mock('../../auth/useAuth', () => ({
  useAuth: () => ({ user: { fullName: 'Test User', role: 'admin' }, signOut: vi.fn() }),
}));
vi.mock('../../hooks/useStationChoice', () => ({
  useStationChoice: () => ({ station: 1 }),
}));

// Answers each `(max-width: Npx)` query as a viewport `width` px wide would,
// so the tablet and mobile breakpoints resolve independently.
function mockMatchMedia(width) {
  window.matchMedia = vi.fn((query) => ({
    matches: width <= Number(/max-width:\s*(\d+)px/.exec(query)[1]),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

const TABLET = 800;
const DESKTOP = 1280;
const MOBILE = 375;

describe('AppShell tablet behavior', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('shows the sidebar toggle button at every viewport, tablet-down included', () => {
    mockMatchMedia(TABLET);
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );
    expect(screen.getByTitle(/expand sidebar|collapse sidebar/i)).toBeInTheDocument();
  });

  it('shows the sidebar toggle button when viewport is desktop-width', () => {
    mockMatchMedia(DESKTOP);
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );
    expect(screen.getByTitle(/expand sidebar|collapse sidebar/i)).toBeInTheDocument();
  });

  it('starts collapsed on a tablet-down viewport with no prior preference', () => {
    mockMatchMedia(TABLET);
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );
    expect(screen.getByTitle(/expand sidebar/i)).toBeInTheDocument();
  });

  it('lets the user expand the sidebar back on a tablet-down viewport, and it stays expanded', () => {
    mockMatchMedia(TABLET);
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );

    const toggle = screen.getByTitle(/expand sidebar/i);
    fireEvent.click(toggle);

    expect(screen.getByTitle(/collapse sidebar/i)).toBeInTheDocument();
  });

  it('keeps the sidebar in the layout as a rail on a tablet', () => {
    mockMatchMedia(TABLET);
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );

    const nav = screen.getByRole('navigation');
    expect(nav).not.toHaveAttribute('inert');
    expect(nav).not.toHaveClass('fixed');
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();
  });
});

describe('AppShell mobile drawer', () => {
  afterEach(() => {
    localStorage.clear();
  });

  function renderMobile() {
    mockMatchMedia(MOBILE);
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );
    return screen.getByRole('navigation', { hidden: true });
  }

  it('hides the sidebar off-screen until the hamburger is pressed', () => {
    const nav = renderMobile();

    expect(nav).toHaveClass('fixed', '-translate-x-full');
    expect(nav).toHaveAttribute('inert');
    expect(screen.getByTitle('Open sidebar')).toHaveAttribute('aria-expanded', 'false');
  });

  it('slides the sidebar in from the left when the hamburger is pressed', () => {
    const nav = renderMobile();

    fireEvent.click(screen.getByTitle('Open sidebar'));

    expect(nav).toHaveClass('translate-x-0');
    expect(nav).not.toHaveAttribute('inert');
    expect(screen.getByTitle('Close sidebar')).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows full link labels in the drawer even if the rail was left collapsed', () => {
    localStorage.setItem('sidebar:collapsed', 'true');
    renderMobile();

    fireEvent.click(screen.getByTitle('Open sidebar'));

    expect(screen.getByText('Dashboard')).toHaveClass('w-48');
  });

  it('closes the drawer when the backdrop is tapped', () => {
    const nav = renderMobile();
    fireEvent.click(screen.getByTitle('Open sidebar'));

    fireEvent.click(screen.getByTestId('sidebar-backdrop'));

    expect(nav).toHaveClass('-translate-x-full');
  });

  it('closes the drawer on Escape', () => {
    const nav = renderMobile();
    fireEvent.click(screen.getByTitle('Open sidebar'));

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(nav).toHaveClass('-translate-x-full');
  });

  it('closes the drawer after a link is chosen', () => {
    const nav = renderMobile();
    fireEvent.click(screen.getByTitle('Open sidebar'));

    fireEvent.click(screen.getByTitle('Dashboard'));

    expect(nav).toHaveClass('-translate-x-full');
  });
});
