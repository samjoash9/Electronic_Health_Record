import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { FORM_STATUS } from '../../lib/constants';

const mocks = vi.hoisted(() => ({ form: null, user: null }));

vi.mock('../../hooks/useWellnessForm', () => ({
  useWellnessForm: () => ({ data: mocks.form, isLoading: false, error: null, refetch: vi.fn() }),
}));
vi.mock('../../auth/useAuth', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('../../api/assessment.api', () => ({ getAssessmentTemplate: vi.fn(async () => []) }));
// Fetches the patient's visit history, which is not what these tests exercise.
vi.mock('../station3/PriorStationsPanel', () => ({ default: () => null }));

import FormDetailPage from './FormDetailPage';

const ADMIN = { id: 1, role: 'admin', adminRole: 'admin' };
const SUPERADMIN = { id: 2, role: 'admin', adminRole: 'superadmin' };

function formWith(overrides = {}) {
  return {
    formID: 42,
    status: FORM_STATUS.PENDING_DENTAL,
    formDate: '2026-10-08T00:00:00',
    patient: {
      surname: 'DELA CRUZ', firstName: 'JUAN', birthdate: '1979-02-08',
      position: 'Clerk', agencyOffice: 'Provincial Health Office', sex: 'Male',
    },
    patientAccount: null,
    ...overrides,
  };
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/forms/42']}>
        <Routes>
          <Route path="/forms/:formId" element={<FormDetailPage />} />
          <Route path="/forms/:formId/edit" element={<p>Edit page</p>} />
          <Route path="/forms" element={<p>Forms list</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('FormDetailPage header', () => {
  beforeEach(() => {
    mocks.form = formWith();
    mocks.user = ADMIN;
  });

  it('names the patient with their position, office and form status', () => {
    renderPage();

    expect(screen.getAllByText('DELA CRUZ, JUAN').length).toBeGreaterThan(0);
    expect(screen.getByText(/Age \d+/)).toHaveTextContent(/Age \d+\s*•\s*Clerk/);
    expect(screen.getAllByText('Provincial Health Office').length).toBeGreaterThan(0);
    expect(screen.getByText('Pending Dental')).toBeInTheDocument();
  });

  it('marks the status with its desk icon', () => {
    renderPage();

    expect(screen.getByText('Pending Dental').querySelector('svg')).toBeInTheDocument();
  });

  it('falls back to the raw status for one it has no label for', () => {
    mocks.form = formWith({ status: 'Archived' });
    renderPage();

    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('shows the portal username, and that it has never been used', () => {
    mocks.form = formWith({ patientAccount: { username: 'jdelacruz', mustChangePassword: true } });
    renderPage();

    expect(screen.getByText('jdelacruz')).toBeInTheDocument();
    expect(screen.getByText('has not signed in yet')).toBeInTheDocument();
  });

  it('drops the never-signed-in note once the patient has signed in', () => {
    mocks.form = formWith({ patientAccount: { username: 'jdelacruz', mustChangePassword: false } });
    renderPage();

    expect(screen.getByText('jdelacruz')).toBeInTheDocument();
    expect(screen.queryByText('has not signed in yet')).not.toBeInTheDocument();
  });

  it('shows no account strip without a portal account', () => {
    renderPage();

    expect(screen.queryByText('has not signed in yet')).not.toBeInTheDocument();
  });
});

describe('FormDetailPage actions', () => {
  beforeEach(() => {
    mocks.form = formWith();
  });

  it('offers Edit form to a superadmin only', () => {
    mocks.user = ADMIN;
    const { unmount } = renderPage();
    expect(screen.queryByRole('button', { name: /edit form/i })).not.toBeInTheDocument();
    unmount();

    mocks.user = SUPERADMIN;
    renderPage();
    expect(screen.getByRole('button', { name: /edit form/i })).toBeInTheDocument();
  });

  it('opens the correction route from Edit form', async () => {
    mocks.user = SUPERADMIN;
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /edit form/i }));

    expect(screen.getByText('Edit page')).toBeInTheDocument();
  });

  it('goes back to the Forms list', async () => {
    mocks.user = ADMIN;
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /back to forms/i }));

    expect(screen.getByText('Forms list')).toBeInTheDocument();
  });
});
