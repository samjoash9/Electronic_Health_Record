import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { RequireAuth } from './RequireAuth';
import { login } from '../services/authService';
import { ROLES } from '../lib/constants';

// The server refuses every call but change-password, user and logout while an
// account is on its default password, so the client has to stop at the prompt
// rather than render pages whose requests will all come back 403.
vi.mock('../config/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

import api from '../config/axios';

const flaggedPatient = {
  accountId: 1,
  username: 'pt',
  fullName: 'Juan Dela Cruz',
  accountType: 'Patient',
  mustChangePassword: true,
};

function signInAs(user) {
  localStorage.setItem('session', JSON.stringify({ token: 't', user }));
}

function renderMyRecord() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/my-record']}>
        <Routes>
          <Route path="/login" element={<div>Login Screen</div>} />
          <Route element={<RequireAuth allow={[ROLES.PATIENT]} />}>
            <Route path="/my-record" element={<div>My Record</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

function fill(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('forced password change', () => {
  it('stops a flagged account at the change-password prompt', async () => {
    signInAs({ role: ROLES.PATIENT, mustChangePassword: true });
    api.get.mockResolvedValueOnce({ data: flaggedPatient });

    renderMyRecord();

    expect(await screen.findByRole('dialog')).toHaveTextContent('Change Password');
    expect(screen.queryByText('My Record')).not.toBeInTheDocument();
    // Nothing to cancel back to: every page behind it would 403.
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('opens the page once the password is changed', async () => {
    signInAs({ role: ROLES.PATIENT, mustChangePassword: true });
    api.get.mockResolvedValueOnce({ data: flaggedPatient });
    api.post.mockResolvedValueOnce({ data: { message: 'Password changed successfully.' } });

    renderMyRecord();
    await screen.findByRole('dialog');

    fill('Current Password', 'password123');
    fill('New Password', 'a-better-secret-1');
    fill('Confirm New Password', 'a-better-secret-1');
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));

    expect(await screen.findByText('My Record')).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith('/Auth/change-password', {
      currentPassword: 'password123',
      newPassword: 'a-better-secret-1',
      confirmPassword: 'a-better-secret-1',
    });
    expect(JSON.parse(localStorage.getItem('session')).user.mustChangePassword).toBe(false);
  });

  it('renders the page as usual for an account that has changed its password', async () => {
    signInAs({ role: ROLES.PATIENT });
    api.get.mockResolvedValueOnce({ data: { ...flaggedPatient, mustChangePassword: false } });

    renderMyRecord();

    expect(await screen.findByText('My Record')).toBeInTheDocument();
  });

  it('carries the flag from the login response', async () => {
    api.post.mockResolvedValueOnce({ data: { token: 't', ...flaggedPatient } });

    const session = await login({ identifier: 'pt', password: 'password123' });

    expect(session.user.mustChangePassword).toBe(true);
  });
});
