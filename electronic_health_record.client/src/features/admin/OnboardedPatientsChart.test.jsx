import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api/patients.api', () => ({
  getOnboardedStats: vi.fn(),
}));

import { getOnboardedStats } from '../../api/patients.api';
import OnboardedPatientsChart from './OnboardedPatientsChart';

function renderChart() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <OnboardedPatientsChart />
    </QueryClientProvider>
  );
}

describe('OnboardedPatientsChart', () => {
  beforeEach(() => {
    // 2026-10-05 11:00 in Manila. Only Date is faked so react-query's timers
    // and findBy* polling still run on real time.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-05T03:00:00Z'));
    getOnboardedStats.mockReset();
    getOnboardedStats.mockResolvedValue({
      total: 42,
      points: [{ label: 'Jan', current: 42, previous: 30 }],
      years: [2025, 2026],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens on the current year by month, comparing against the year before', async () => {
    renderChart();

    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(getOnboardedStats).toHaveBeenLastCalledWith({ granularity: 'month', year: 2026 });
    expect(screen.getByText('2026', { selector: '[data-legend]' })).toBeInTheDocument();
    expect(screen.getByText('2025', { selector: '[data-legend]' })).toBeInTheDocument();
  });

  it('asks for one month by day once Day is picked', async () => {
    const user = userEvent.setup();
    renderChart();
    await screen.findByText('42');

    await user.click(screen.getByRole('button', { name: 'Month' }));
    await user.click(screen.getByRole('option', { name: 'Day' }));

    await waitFor(() =>
      expect(getOnboardedStats).toHaveBeenLastCalledWith({ granularity: 'day', year: 2026, month: 10 })
    );
    expect(screen.getByRole('button', { name: 'October' })).toBeInTheDocument();
    expect(await screen.findByText('Oct 2026', { selector: '[data-legend]' })).toBeInTheDocument();
    expect(screen.getByText('Sep 2026', { selector: '[data-legend]' })).toBeInTheDocument();
  });

  it('drops the period pickers and the previous line for Year', async () => {
    const user = userEvent.setup();
    renderChart();
    await screen.findByText('42');

    await user.click(screen.getByRole('button', { name: 'Month' }));
    await user.click(screen.getByRole('option', { name: 'Year' }));

    await waitFor(() =>
      expect(getOnboardedStats).toHaveBeenLastCalledWith({ granularity: 'year' })
    );
    expect(screen.queryByRole('button', { name: '2026' })).not.toBeInTheDocument();
    expect(screen.getByText('All years')).toBeInTheDocument();
    expect(screen.getAllByText(/./, { selector: '[data-legend]' })).toHaveLength(1);
  });
});
