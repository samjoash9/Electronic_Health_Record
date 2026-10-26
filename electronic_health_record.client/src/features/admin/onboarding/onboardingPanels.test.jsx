import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../api/admins.api', () => ({
  listAdmins: vi.fn(),
  createAdmin: vi.fn(),
  setAdminActive: vi.fn(),
  deleteAdmin: vi.fn(),
}));
vi.mock('../../../api/onboarding.api', () => ({
  listPhysicians: vi.fn(),
  createPhysician: vi.fn(),
  updatePhysician: vi.fn(),
  setPhysicianActive: vi.fn(),
  resetPhysicianPassword: vi.fn(),
  deletePhysician: vi.fn(),
  listEmployees: vi.fn(),
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
}));
vi.mock('../../../api/patients.api', () => ({
  listPatientAccounts: vi.fn(),
  setPatientAccountActive: vi.fn(),
  deletePatient: vi.fn(),
}));
vi.mock('../../../api/chargeItems.api', () => ({
  getChargeItems: vi.fn(),
  createChargeItem: vi.fn(),
  updateChargeItem: vi.fn(),
  retireChargeItem: vi.fn(),
}));

const auth = vi.hoisted(() => ({
  user: { id: 1, fullName: 'System Developer', role: 'admin', adminRole: 'superadmin' },
}));
vi.mock('../../../auth/useAuth', () => ({ useAuth: () => auth }));

import { listAdmins } from '../../../api/admins.api';
import { listPhysicians, listEmployees } from '../../../api/onboarding.api';
import { listPatientAccounts } from '../../../api/patients.api';
import { getChargeItems } from '../../../api/chargeItems.api';
import AdminsPanel from './AdminsPanel';
import DoctorsPanel from './DoctorsPanel';
import EmployeesPanel from './EmployeesPanel';
import PatientsPanel from './PatientsPanel';
import ChargeCatalogPanel from './ChargeCatalogPanel';

// Answers each `(max-width: Npx)` query as a viewport `width` px wide would.
function mockMatchMedia(width) {
  window.matchMedia = vi.fn((query) => ({
    matches: width <= Number(/max-width:\s*(\d+)px/.exec(query)[1]),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

function renderPanel(Panel) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Panel />
    </QueryClientProvider>,
  );
}

const ADMINS = [
  {
    adminID: 1, fullName: 'System Developer', username: 'superadmin', role: 'superadmin',
    contactNo: null, isActive: true, mustChangePassword: false,
  },
  {
    adminID: 2, fullName: 'Sam Joash Antonio', username: 'joashantonio', role: 'admin',
    contactNo: '09171234567', isActive: true, mustChangePassword: false,
  },
];

const DOCTORS = [{
  physicianID: 7, firstName: 'Ana', middleName: null, surname: 'Reyes', prcLicenseNo: '0123456',
  station: 3, username: 'ana.reyes', contactNo: null, isActive: true, mustChangePassword: false,
}];

const EMPLOYEES = [{
  externalEmployeeId: 'E-1', firstName: 'Ben', middleName: null, surname: 'Cruz',
  position: 'Clerk', agencyOffice: 'PHO', birthdate: '1990-05-01', isLocallyAdded: false,
}];

const PATIENTS = [{
  patientID: 9, externalEmployeeId: 'E-2', firstName: 'Cora', middleName: null, surname: 'Diaz',
  position: 'Nurse', account: null,
}];

const ITEMS = [{
  chargeItemID: 4, itemType: 'Lab', name: 'CBC', category: null, unitPrice: 150,
  isActive: true, displayOrder: 0,
}];

describe('Onboarding panels on a phone', () => {
  beforeEach(() => {
    mockMatchMedia(375);
    listAdmins.mockResolvedValue(ADMINS);
    listPhysicians.mockResolvedValue(DOCTORS);
    listEmployees.mockResolvedValue(EMPLOYEES);
    listPatientAccounts.mockResolvedValue(PATIENTS);
    getChargeItems.mockResolvedValue(ITEMS);
  });

  it('lists staff accounts as cards, with no actions on your own', async () => {
    const user = userEvent.setup();
    renderPanel(AdminsPanel);
    await screen.findByText('Sam Joash Antonio');

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Your account')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Actions for System Developer' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Actions for Sam Joash Antonio' }));
    expect(screen.getAllByRole('menuitem').map((el) => el.textContent)).toEqual(['Deactivate', 'Delete']);
  });

  it('folds a doctor\'s four actions into one menu', async () => {
    const user = userEvent.setup();
    renderPanel(DoctorsPanel);
    await screen.findByText('Dr. Ana Reyes');

    expect(screen.getByText('PRC 0123456')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Actions for Dr. Ana Reyes' }));
    expect(screen.getAllByRole('menuitem').map((el) => el.textContent))
      .toEqual(['Edit details', 'Reset password', 'Deactivate', 'Delete']);
  });

  it('shows an employee\'s single action as its own button', async () => {
    renderPanel(EmployeesPanel);
    await screen.findByText('Ben Cruz');

    expect(screen.getByText('Not onboarded')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit record' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Actions for/ })).not.toBeInTheDocument();
  });

  it('disables suspending a patient who has no portal account', async () => {
    const user = userEvent.setup();
    renderPanel(PatientsPanel);
    await screen.findByText('Cora Diaz');

    await user.click(screen.getByRole('button', { name: 'Actions for Cora Diaz' }));
    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: /Restore sign-in/ })).toBeDisabled();
    expect(within(menu).getByRole('menuitem', { name: /Delete/ })).toBeEnabled();
  });

  it('keeps the catalog price editable on a card', async () => {
    renderPanel(ChargeCatalogPanel);
    await screen.findByText('CBC');

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /150/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retire this item' })).toBeInTheDocument();
  });

  it('stretches Previous/Next across the screen', async () => {
    renderPanel(AdminsPanel);
    await screen.findByText('Sam Joash Antonio');

    expect(screen.getByRole('button', { name: 'Previous' })).toHaveClass('flex-1');
  });
});

describe('Onboarding panels on a desktop', () => {
  beforeEach(() => {
    mockMatchMedia(1280);
    listAdmins.mockResolvedValue(ADMINS);
  });

  it('keeps the table', async () => {
    renderPanel(AdminsPanel);
    await screen.findByText('Sam Joash Antonio');

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).not.toHaveClass('flex-1');
  });
});
