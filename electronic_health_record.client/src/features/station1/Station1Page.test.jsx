import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { saveDraft } from '../../lib/station1Draft';

const EMPLOYEE = {
  externalEmployeeId: 'EMP-1',
  surname: 'AARON',
  firstName: 'ANAWIM MARIE',
  middleName: 'IMPORTANTE',
  birthdate: '1990-01-01',
  sex: 'Female',
  civilStatus: 'Single',
  address: 'Somewhere',
  agencyOffice: 'PENRO',
  position: 'ENVIRONMENTAL MANAGEMENT SPECIALIST II',
  contactNo: '09166649496',
};

vi.mock('../../api/patients.api', () => ({
  searchEmployees: vi.fn(async () => [EMPLOYEE]),
  hasPatientAccount: vi.fn(async () => true),
}));

vi.mock('../../auth/useAuth', () => ({
  useAuth: () => ({ user: { id: 1, role: 'Admin' } }),
}));

// The page renders outside a data router, so the unsaved-changes blocker has no
// router context to attach to; the guard itself is not what this test exercises.
vi.mock('../../hooks/useUnsavedChangesGuard', () => ({
  useUnsavedChangesGuard: () => ({ state: 'unblocked' }),
}));

import Station1Page from './Station1Page';

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Station1Page />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

/** Row click only previews; selection is confirmed from the preview modal. */
async function selectEmployee(user) {
  await user.click(await screen.findByText(/AARON/i));
  await user.click(await screen.findByRole('button', { name: /select employee/i }));
}

describe('Station1Page draft restore', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('advances to Confirm Information when the restored draft was left on step 1', async () => {
    // A draft saved while the user was still on the search step: autosave runs
    // on the render *after* selection, so `step` can still be 1 on disk.
    saveDraft(EMPLOYEE.externalEmployeeId, { values: { ...EMPLOYEE, username: '' }, step: 1 });

    const user = userEvent.setup();
    renderPage();
    await selectEmployee(user);

    await waitFor(() => {
      expect(screen.getByText('Confirm Information')).toHaveClass('font-bold');
    });
  });

  it('advances to Confirm Information when there is no draft at all', async () => {
    const user = userEvent.setup();
    renderPage();
    await selectEmployee(user);

    await waitFor(() => {
      expect(screen.getByText('Confirm Information')).toHaveClass('font-bold');
    });
  });
});
