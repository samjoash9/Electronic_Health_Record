import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { RequireAuth, RequireStation, homeRouteFor } from './RequireAuth';
import { ROLES } from '../lib/constants';

// Mirrors lib/session.js's SESSION_KEY. AuthProvider reads the session through
// getSession() on mount, so the key has to match exactly or every render comes
// back anonymous.
function signInAs(role, { id = 1, adminRole, station } = {}) {
  localStorage.setItem('session', JSON.stringify({
    token: 't',
    user: {
      id, name: 'Test User', role,
      ...(adminRole ? { adminRole } : {}),
      ...(station ? { station } : {}),
    },
  }));
}

function chooseStation(role, station) {
  localStorage.setItem(`ehr-station:${role}`, String(station));
}

function renderAt(path) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<div>Login Screen</div>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route path="/no-station" element={<div>No Station</div>} />
          <Route element={<RequireAuth allow={[ROLES.ADMIN]} />}>
            <Route path="/stations" element={<div>Station Picker</div>} />
          </Route>
          <Route element={<RequireAuth allow={[ROLES.DOCTOR]} allowSuperAdmin />}>
            <Route element={<RequireStation station={3} />}>
              <Route path="/station3" element={<div>Station 3 Queue</div>} />
            </Route>
            <Route element={<RequireStation station={4} />}>
              <Route path="/station4" element={<div>Station 4 Queue</div>} />
            </Route>
            <Route element={<RequireStation station={5} />}>
              <Route path="/station5" element={<div>Station 5 Queue</div>} />
            </Route>
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
    expect(homeRouteFor({ role: ROLES.PATIENT })).toBe('/my-record');
    expect(homeRouteFor(undefined)).toBe('/login');
  });

  // An admin works one desk at a time too, so a device that has not been
  // pointed at a station yet asks which one before showing any work.
  it('sends an admin with no chosen station to the picker', () => {
    expect(homeRouteFor({ role: ROLES.ADMIN })).toBe('/stations');
  });

  // Once the station is known the dashboard is the right landing page: it is
  // the admin's overview, and the sidebar already limits which station desks
  // they can open.
  it('sends an admin with a chosen station to the dashboard', () => {
    expect(homeRouteFor({ role: ROLES.ADMIN }, 1)).toBe('/dashboard');
    expect(homeRouteFor({ role: ROLES.ADMIN }, 2)).toBe('/dashboard');
  });

  // A superadmin is not tied to a desk, so they never see the picker.
  it('sends a superadmin to the dashboard', () => {
    expect(homeRouteFor({ role: ROLES.ADMIN, adminRole: 'superadmin' })).toBe('/dashboard');
  });

  // A doctor's desk is assigned by an admin and lives on their account, so the
  // device's station choice must not affect where they land.
  it('sends a doctor to the station assigned to their account', () => {
    expect(homeRouteFor({ role: ROLES.DOCTOR, station: 4 })).toBe('/station4');
    expect(homeRouteFor({ role: ROLES.DOCTOR, station: 5 })).toBe('/station5');
  });

  it('ignores the device station for a doctor', () => {
    expect(homeRouteFor({ role: ROLES.DOCTOR, station: 3 }, 5)).toBe('/station3');
  });

  it('sends a doctor with no assigned station to the no-station page', () => {
    expect(homeRouteFor({ role: ROLES.DOCTOR })).toBe('/no-station');
  });

  // A superadmin oversees every desk, so a station choice must not pin them
  // to one of them.
  it('ignores a station choice for a superadmin', () => {
    expect(homeRouteFor({ role: ROLES.ADMIN, adminRole: 'superadmin' }, 4)).toBe('/dashboard');
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

  it('keeps a doctor out of the station picker', async () => {
    signInAs(ROLES.DOCTOR, { station: 3 });
    renderAt('/stations');
    expect(await screen.findByText('Station 3 Queue')).toBeInTheDocument();
  });

  it('redirects a patient away from the doctor queue', async () => {
    signInAs(ROLES.PATIENT);
    renderAt('/station3');
    expect(await screen.findByText('My Record')).toBeInTheDocument();
  });

  // No station picked yet, so the redirect lands on the picker rather than the
  // dashboard -- an admin chooses a desk before being shown any work.
  it('redirects an admin away from the patient record view', async () => {
    signInAs(ROLES.ADMIN);
    renderAt('/my-record');
    expect(await screen.findByText('Station Picker')).toBeInTheDocument();
  });

  it('redirects an admin who has a station to the dashboard', async () => {
    signInAs(ROLES.ADMIN);
    chooseStation(ROLES.ADMIN, 1);
    renderAt('/my-record');
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });
});

describe('RequireStation', () => {
  it('lets a doctor into the station assigned to their account', async () => {
    signInAs(ROLES.DOCTOR, { station: 4 });
    renderAt('/station4');
    expect(await screen.findByText('Station 4 Queue')).toBeInTheDocument();
  });

  // The whole point of the feature: a doctor assigned to one desk must not be
  // able to reach another desk by typing its URL.
  it('bounces a doctor from a station they are not assigned to', async () => {
    signInAs(ROLES.DOCTOR, { station: 3 });
    renderAt('/station5');
    expect(await screen.findByText('Station 3 Queue')).toBeInTheDocument();
  });

  // Station now lives on the account, so editing the device's stored choice
  // must not move a doctor off their assigned desk.
  it('ignores a device station choice for a doctor', async () => {
    signInAs(ROLES.DOCTOR, { station: 3 });
    chooseStation(ROLES.DOCTOR, 5);
    renderAt('/station5');
    expect(await screen.findByText('Station 3 Queue')).toBeInTheDocument();
  });

  it('sends a doctor with no assigned station to the no-station page', async () => {
    signInAs(ROLES.DOCTOR);
    renderAt('/station3');
    expect(await screen.findByText('No Station')).toBeInTheDocument();
  });

  // A superadmin supervises all the desks at once, so the per-station gate
  // must not apply to them.
  it('lets a superadmin into any station regardless of assignment', async () => {
    signInAs(ROLES.ADMIN, { adminRole: 'superadmin' });
    renderAt('/station5');
    expect(await screen.findByText('Station 5 Queue')).toBeInTheDocument();
  });
});
