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

function mockMatchMedia(matches) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
}

describe('AppShell tablet behavior', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('shows the sidebar toggle button at every viewport, tablet-down included', () => {
    mockMatchMedia(true);
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );
    expect(screen.getByTitle(/expand sidebar|collapse sidebar/i)).toBeInTheDocument();
  });

  it('shows the sidebar toggle button when viewport is desktop-width', () => {
    mockMatchMedia(false);
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );
    expect(screen.getByTitle(/expand sidebar|collapse sidebar/i)).toBeInTheDocument();
  });

  it('starts collapsed on a tablet-down viewport with no prior preference', () => {
    mockMatchMedia(true);
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );
    expect(screen.getByTitle(/expand sidebar/i)).toBeInTheDocument();
  });

  it('lets the user expand the sidebar back on a tablet-down viewport, and it stays expanded', () => {
    mockMatchMedia(true);
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );

    const toggle = screen.getByTitle(/expand sidebar/i);
    fireEvent.click(toggle);

    expect(screen.getByTitle(/collapse sidebar/i)).toBeInTheDocument();
  });
});
