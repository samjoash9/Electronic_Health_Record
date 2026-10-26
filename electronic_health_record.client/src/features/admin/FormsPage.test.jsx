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

const ADMIN = { id: 1, fullName: 'Test Admin', role: 'admin' };
const auth = vi.hoisted(() => ({ user: null }));
vi.mock('../../auth/useAuth', () => ({
  useAuth: () => auth,
}));

import { getAllForms } from '../../api/forms.api';
import FormsPage from './FormsPage';

// Answers each `(max-width: Npx)` query as a viewport `width` px wide would.
function mockMatchMedia(width) {
  window.matchMedia = vi.fn((query) => ({
    matches: width <= Number(/max-width:\s*(\d+)px/.exec(query)[1]),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

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
    mockMatchMedia(1280);
    auth.user = ADMIN;
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

describe('FormsPage on a phone', () => {
  beforeEach(() => {
    mockMatchMedia(375);
    auth.user = ADMIN;
    getAllForms.mockReset();
    getAllForms.mockResolvedValue(FORMS);
  });

  it('lists forms as cards instead of a table', async () => {
    renderPage();
    await screen.findByText('CRUZ, TEST');

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('user3')).toBeInTheDocument();
    expect(screen.getAllByText('Station 2')).toHaveLength(FORMS.length);
  });

  it('stretches Previous/Next across the screen', async () => {
    renderPage();
    await screen.findByText('CRUZ, TEST');

    expect(screen.getByRole('button', { name: 'Previous' })).toHaveClass('flex-1');
    expect(screen.getByRole('button', { name: 'Next' })).toHaveClass('flex-1');
  });

  it('still narrows the cards by search', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('CRUZ, TEST');

    await user.type(screen.getByPlaceholderText('Search by name or username'), 'dizon');
    expect(rowNames()).toEqual(['DIZON, TEST']);
  });

  it('shows no actions menu to a plain admin', async () => {
    renderPage();
    await screen.findByText('CRUZ, TEST');

    expect(screen.queryByRole('button', { name: /^Actions for/ })).not.toBeInTheDocument();
  });

  it('offers a superadmin the same actions as the desktop table, from a menu', async () => {
    auth.user = { ...ADMIN, adminRole: 'superadmin' };
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('CRUZ, TEST');

    await user.click(screen.getByRole('button', { name: 'Actions for CRUZ, TEST' }));
    expect(screen.getAllByRole('menuitem').map((el) => el.textContent))
      .toEqual(['Send Back', 'Cancel', 'Delete']);
  });
});

describe('FormsPage beside the sidebar', () => {
  // Reports `width` as the page's measured width the moment it is observed.
  function mockPageWidth(width) {
    window.ResizeObserver = class {
      constructor(callback) { this.callback = callback; }
      observe() { this.callback([{ contentRect: { width } }]); }
      disconnect() {}
    };
  }

  beforeEach(() => {
    mockMatchMedia(1024);
    auth.user = { ...ADMIN, adminRole: 'superadmin' };
    getAllForms.mockReset();
    getAllForms.mockResolvedValue(FORMS);
  });

  afterEach(() => {
    delete window.ResizeObserver;
  });

  it('shows cards when the page is too narrow for the table', async () => {
    mockPageWidth(640);
    renderPage();
    await screen.findByText('CRUZ, TEST');

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions for CRUZ, TEST' })).toBeInTheDocument();
  });

  it('folds the row actions into a menu when the table fits but its buttons do not', async () => {
    mockPageWidth(900);
    renderPage();
    await screen.findByText('CRUZ, TEST');

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Actions' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send Back' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions for CRUZ, TEST' })).toBeInTheDocument();
  });

  it('spells the row actions out when there is room', async () => {
    mockPageWidth(1200);
    renderPage();
    await screen.findByText('CRUZ, TEST');

    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Send Back' })).toHaveLength(FORMS.length);
  });
});
