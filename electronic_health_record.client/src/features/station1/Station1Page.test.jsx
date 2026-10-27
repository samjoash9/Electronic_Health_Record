import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { saveDraft } from '../../lib/station1Draft';
import { hasPatientAccount, isUsernameAvailable } from '../../api/patients.api';

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
  isUsernameAvailable: vi.fn(async () => true),
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

// Answers each `(max-width: Npx)` query as a viewport `width` px wide would.
function mockMatchMedia(width) {
  window.matchMedia = vi.fn((query) => ({
    matches: width <= Number(/max-width:\s*(\d+)px/.exec(query)[1]),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

// Desktop unless a test says otherwise.
beforeEach(() => mockMatchMedia(1280));

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
    hasPatientAccount.mockResolvedValue(true);
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

describe('Station1Page username guard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    hasPatientAccount.mockResolvedValue(false);
    isUsernameAvailable.mockResolvedValue(true);
  });

  it('disables Next and the Vital Signs step until a username is entered', async () => {
    const user = userEvent.setup();
    renderPage();
    await selectEmployee(user);
    await screen.findByLabelText(/desired username/i);

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByText('Vital Signs').closest('button')).toBeDisabled();
  });

  it('treats a whitespace-only username as missing', async () => {
    const user = userEvent.setup();
    renderPage();
    await selectEmployee(user);
    await user.type(await screen.findByLabelText(/desired username/i), '   ');

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('stays on Confirm Information when the username is too long', async () => {
    const user = userEvent.setup();
    renderPage();
    await selectEmployee(user);
    await user.type(await screen.findByLabelText(/desired username/i), 'a'.repeat(31));

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Too long')).toBeInTheDocument();
    expect(screen.getByText('Confirm Information')).toHaveClass('font-bold');
  });

  it('advances to Vital Signs once an available username is entered', async () => {
    const user = userEvent.setup();
    renderPage();
    await selectEmployee(user);
    await user.type(await screen.findByLabelText(/desired username/i), 'juandelacruz');

    expect(await screen.findByText('Username is available.')).toBeInTheDocument();
    expect(isUsernameAvailable).toHaveBeenLastCalledWith('juandelacruz');

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByRole('heading', { name: 'Vital Signs' })).toBeInTheDocument();
  });

  it('blocks Next while the username is still being checked', async () => {
    isUsernameAvailable.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderPage();
    await selectEmployee(user);
    await user.type(await screen.findByLabelText(/desired username/i), 'juandelacruz');

    expect(await screen.findByText('Checking availability…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('blocks Next and says so when the username is already taken', async () => {
    isUsernameAvailable.mockResolvedValue(false);
    const user = userEvent.setup();
    renderPage();
    await selectEmployee(user);
    await user.type(await screen.findByLabelText(/desired username/i), 'superadmin');

    expect(await screen.findByText('That username is already taken.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByText('Vital Signs').closest('button')).toBeDisabled();
  });
});

describe('Station1Page on a phone', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    hasPatientAccount.mockResolvedValue(true);
    mockMatchMedia(390);
  });

  it('lists employees as cards and names the current step under the circles', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole('button', { name: /AARON/ })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();

    await selectEmployee(user);

    expect(await screen.findByText('Step 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('Confirm Information')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('pins the actions to the bottom, with Submit taking the whole row on Vital Signs', async () => {
    const user = userEvent.setup();
    renderPage();
    await selectEmployee(user);

    const next = await screen.findByRole('button', { name: 'Next' });
    expect(next.parentElement.parentElement).toHaveClass('sticky', 'grid-cols-2');

    await user.click(next);

    expect(await screen.findByText('Step 3 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit to Station 2' })).toHaveClass('col-span-2');
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });
});

describe('Station1Page actions', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    hasPatientAccount.mockResolvedValue(true);
  });

  it('shows no actions on the search step, where picking an employee moves on', async () => {
    renderPage();
    await screen.findByText(/AARON/i);

    // Back is in every state of the action bar, so its absence means no bar.
    // (Next is not checked: the employee list's pagination has its own.)
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit to Station 2' })).not.toBeInTheDocument();
  });

  it('labels the step circles in place of a caption on a desktop', async () => {
    renderPage();
    await screen.findByText(/AARON/i);

    expect(screen.queryByText('Step 1 of 3')).not.toBeInTheDocument();
    expect(screen.getByText('Vital Signs')).toBeInTheDocument();
  });

  it('goes Back from Confirm Information to the search', async () => {
    const user = userEvent.setup();
    renderPage();
    await selectEmployee(user);

    await user.click(await screen.findByRole('button', { name: 'Back' }));

    expect(await screen.findByPlaceholderText('Search by name e.g. Santos')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
  });
});
