import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('hides the sidebar toggle button when viewport is tablet-down', () => {
    mockMatchMedia(true);
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );
    expect(screen.queryByTitle(/expand sidebar|collapse sidebar/i)).not.toBeInTheDocument();
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
});
