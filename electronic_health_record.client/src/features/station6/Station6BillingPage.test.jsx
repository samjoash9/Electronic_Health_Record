import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api/billing.api', () => ({
  listBillingForms: vi.fn(),
  getBillingForm: vi.fn(),
  deleteBillingForm: vi.fn(),
}));

import { listBillingForms, deleteBillingForm } from '../../api/billing.api';
import Station6BillingPage from './Station6BillingPage';

// Answers each `(max-width: Npx)` query as a viewport `width` px wide would.
function mockMatchMedia(width) {
  window.matchMedia = vi.fn((query) => ({
    matches: width <= Number(/max-width:\s*(\d+)px/.exec(query)[1]),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

const period = (billingFormID, title, capital, consumed, extra = {}) => ({
  billingFormID,
  title,
  startDate: '2026-09-01',
  endDate: '2026-10-31',
  employeeCount: 2,
  capital,
  consumed,
  remaining: capital - consumed,
  isOverBudget: consumed > capital,
  unpricedCount: 0,
  ...extra,
});

const PERIODS = [
  period(1, 'September-October 2026 Billing', 1500000, 7710, { unpricedCount: 5 }),
  period(2, 'August 2026 Billing', 10000, 12500, { employeeCount: 1 }),
];

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Station6BillingPage />
    </QueryClientProvider>
  );
}

describe('Station6BillingPage on a phone', () => {
  beforeEach(() => {
    mockMatchMedia(375);
    listBillingForms.mockReset();
    listBillingForms.mockResolvedValue({ data: PERIODS });
    deleteBillingForm.mockReset();
  });

  it('lists billing periods as cards instead of a table', async () => {
    renderPage();
    await screen.findByText('August 2026 Billing');

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('5 unpriced')).toBeInTheDocument();
    expect(screen.getByText('1 employee')).toBeInTheDocument();
    expect(screen.getByText('2 employees')).toBeInTheDocument();
  });

  it('shows how much of each capital is used, and by how much one is over', async () => {
    renderPage();
    await screen.findByText('August 2026 Billing');

    expect(screen.getByText('<1% used')).toBeInTheDocument();
    expect(screen.getByText('125% used')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'August 2026 Billing capital used' }))
      .toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('Over by')).toBeInTheDocument();
  });

  it('deletes a period from its card without opening it', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    deleteBillingForm.mockResolvedValue();
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('August 2026 Billing');

    await user.click(screen.getByRole('button', { name: 'Delete August 2026 Billing' }));
    expect(deleteBillingForm).toHaveBeenCalledWith(2);
  });

  it('stretches Previous/Next across the screen', async () => {
    renderPage();
    await screen.findByText('August 2026 Billing');

    expect(screen.getByRole('button', { name: 'Previous' })).toHaveClass('flex-1');
    expect(screen.getByRole('button', { name: 'Next' })).toHaveClass('flex-1');
  });
});

describe('Station6BillingPage on a desktop', () => {
  beforeEach(() => {
    mockMatchMedia(1280);
    listBillingForms.mockReset();
    listBillingForms.mockResolvedValue({ data: PERIODS });
  });

  it('keeps the table', async () => {
    renderPage();
    await screen.findByText('August 2026 Billing');

    const table = screen.getByRole('table');
    expect(within(table).getByText('September-October 2026 Billing')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('counts over-budget periods against the total', async () => {
    renderPage();
    await screen.findByText('August 2026 Billing');
    expect(screen.getByText('of 2 periods')).toBeInTheDocument();
  });

  it('says "period" when there is only one', async () => {
    listBillingForms.mockResolvedValue({ data: [PERIODS[0]] });
    renderPage();
    await screen.findByText('September-October 2026 Billing');

    expect(screen.getByText('of 1 period')).toBeInTheDocument();
  });
});
