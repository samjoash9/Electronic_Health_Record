import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api/forms.api', () => ({
  getAllForms: vi.fn(),
  cancelForm: vi.fn(),
  deleteForm: vi.fn(),
  revertStation: vi.fn(),
}));

vi.mock('../../auth/useAuth', () => ({
  useAuth: () => ({ user: { id: 1, fullName: 'Test Admin', role: 'admin' } }),
}));

import { getAllForms } from '../../api/forms.api';
import FormsPage from './FormsPage';

const form = (formID, surname, formDate) => ({
  formID,
  status: 'PendingStation2',
  currentStation: 2,
  formDate,
  rowVersion: 'AAAAAAAAB9E=',
  patient: { surname, firstName: 'TEST', middleName: null, externalEmployeeId: `E-${formID}` },
  patientAccount: { username: `user${formID}` },
});

const FORMS = [
  form(1, 'ABAN', '2026-10-01'),
  form(2, 'BAUTISTA', '2026-10-05'),
  form(3, 'CRUZ', '2026-09-20'),
  form(4, 'DIZON', '2026-10-09'),
];

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <FormsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const rowNames = () =>
  ['ABAN, TEST', 'BAUTISTA, TEST', 'CRUZ, TEST', 'DIZON, TEST'].filter((name) => screen.queryByText(name));

describe('FormsPage visit date filter', () => {
  beforeEach(() => {
    // Only Date is faked, so user-event's own timers still run. 20:00 UTC on
    // the 8th is already 04:00 on the 9th in Manila -- the day the presets
    // must count back from.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-08T20:00:00Z'));
    getAllForms.mockReset();
    getAllForms.mockResolvedValue(FORMS);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('narrows the list to the applied range and restores it when cleared', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('CRUZ, TEST');

    await user.click(screen.getByRole('button', { name: /^Visit date:/ }));
    await user.click(screen.getByRole('button', { name: 'October 1, 2026' }));
    await user.click(screen.getByRole('button', { name: 'October 5, 2026' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(rowNames()).toEqual(['ABAN, TEST', 'BAUTISTA, TEST']);

    await user.click(screen.getByRole('button', { name: 'Clear visit date' }));
    expect(rowNames()).toEqual(['ABAN, TEST', 'BAUTISTA, TEST', 'CRUZ, TEST', 'DIZON, TEST']);
  });

  it('counts presets back from the clinic day', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('CRUZ, TEST');

    await user.click(screen.getByRole('button', { name: /^Visit date:/ }));
    await user.click(screen.getByRole('button', { name: 'Last 7 days' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(rowNames()).toEqual(['BAUTISTA, TEST', 'DIZON, TEST']);
  });
});
