import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { RequireAuth, homeRouteFor } from './RequireAuth';
import { ROLES } from '../lib/constants';

function signInAs(role, id = 1) {
  localStorage.setItem('ehr-session', JSON.stringify({
    token: 't', user: { id, name: 'Test User', role },
  }));
}

function renderAt(path) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<div>Login Screen</div>} />
          <Route element={<RequireAuth allow={[ROLES.ADMIN]} />}>
            <Route path="/stations" element={<div>Station Picker</div>} />
          </Route>
          <Route element={<RequireAuth allow={[ROLES.DOCTOR]} />}>
            <Route path="/station3" element={<div>Doctor Queue</div>} />
          </Route>
          <Route element={<RequireAuth allow={[ROLES.PATIENT]} />}>
            <Route path="/my-record" element={<div>My Record</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

beforeEach(() => localStorage.clear());

describe('homeRouteFor', () => {
  it('maps each role to its landing route', () => {
    expect(homeRouteFor(ROLES.ADMIN)).toBe('/stations');
    expect(homeRouteFor(ROLES.DOCTOR)).toBe('/station3');
    expect(homeRouteFor(ROLES.PATIENT)).toBe('/my-record');
    expect(homeRouteFor(undefined)).toBe('/login');
  });
});

describe('RequireAuth', () => {
  it('sends an anonymous visitor to login', async () => {
    renderAt('/stations');
    expect(await screen.findByText('Login Screen')).toBeInTheDocument();
  });

  it('lets an admin into the station picker', async () => {
    signInAs(ROLES.ADMIN);
    renderAt('/stations');
    expect(await screen.findByText('Station Picker')).toBeInTheDocument();
  });

  it('redirects a doctor away from admin routes to their own home', async () => {
    signInAs(ROLES.DOCTOR);
    renderAt('/stations');
    expect(await screen.findByText('Doctor Queue')).toBeInTheDocument();
  });

  it('redirects a patient away from the doctor queue', async () => {
    signInAs(ROLES.PATIENT);
    renderAt('/station3');
    expect(await screen.findByText('My Record')).toBeInTheDocument();
  });

  it('redirects an admin away from the patient record view', async () => {
    signInAs(ROLES.ADMIN);
    renderAt('/my-record');
    expect(await screen.findByText('Station Picker')).toBeInTheDocument();
  });
});
