import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';
import { ROLES } from '../lib/constants';

// authService.fetchCurrentUser() calls the shared axios instance directly, so
// mocking it at that boundary is what proves AuthProvider actually re-validates
// against the server instead of trusting localStorage.
vi.mock('../config/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from '../config/axios';

function signInAs(role, { station } = {}) {
  localStorage.setItem('session', JSON.stringify({
    token: 't',
    user: {
      accountId: 1,
      username: 'tester',
      fullName: 'Test User',
      role,
      ...(station ? { station } : {}),
    },
  }));
}

function Probe() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return <div>station:{String(user?.station)}</div>;
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('AuthProvider', () => {
  // The whole point of FIX 1: a doctor cannot move themselves between
  // stations by editing localStorage, because the server's answer replaces
  // whatever was stored, on every load that has a session.
  it("prefers the server's station over a tampered stored session", async () => {
    signInAs(ROLES.DOCTOR, { station: 5 });
    api.get.mockResolvedValueOnce({
      data: {
        accountId: 1,
        username: 'tester',
        fullName: 'Test User',
        accountType: 'physician',
        station: 3,
      },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText('station:3')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/Auth/user');
  });

  it('keeps the stale stored user when the check fails for a network reason', async () => {
    signInAs(ROLES.DOCTOR, { station: 3 });
    api.get.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText('station:3')).toBeInTheDocument();
  });

  it('signs the user out when the server rejects the session as unauthorized', async () => {
    signInAs(ROLES.DOCTOR, { station: 3 });
    api.get.mockRejectedValueOnce({ response: { status: 401 } });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText('station:undefined')).toBeInTheDocument();
    expect(localStorage.getItem('session')).toBeNull();
  });
});
