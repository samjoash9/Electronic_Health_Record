import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api/reference.api', () => ({
  getDiagnosedConditions: vi.fn(),
}));

import { getDiagnosedConditions } from '../../api/reference.api';
import DiagnosedConditionsChart from './DiagnosedConditionsChart';

function renderChart() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DiagnosedConditionsChart />
    </QueryClientProvider>
  );
}

describe('DiagnosedConditionsChart', () => {
  beforeEach(() => {
    // 2026-10-05 11:00 in Manila; only Date is faked so react-query still runs.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-05T03:00:00Z'));
    getDiagnosedConditions.mockReset();
    getDiagnosedConditions.mockResolvedValue({
      total: 7,
      conditions: [
        { conditionID: 2, name: 'HYPERTENSION (Heart Attack)', count: 6 },
        { conditionID: null, name: 'Others', count: 2 },
      ],
      years: [2025, 2026],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens on this month and lists each condition with its share of the donut', async () => {
    renderChart();

    expect(await screen.findByText('7')).toBeInTheDocument();
    expect(getDiagnosedConditions).toHaveBeenLastCalledWith({ granularity: 'month', year: 2026, month: 10 });
    expect(screen.getByText('October 2026')).toBeInTheDocument();
    expect(screen.getByText('Hypertension')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Others')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('adds a day picker for Day and clamps the day to the chosen month', async () => {
    const user = userEvent.setup();
    renderChart();
    await screen.findByText('7');

    await user.click(screen.getByRole('button', { name: 'Month' }));
    await user.click(screen.getByRole('option', { name: 'Day' }));

    await waitFor(() =>
      expect(getDiagnosedConditions).toHaveBeenLastCalledWith({ granularity: 'day', year: 2026, month: 10, day: 5 })
    );

    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('option', { name: '31' }));
    await user.click(screen.getByRole('button', { name: 'October' }));
    await user.click(screen.getByRole('option', { name: 'February' }));

    await waitFor(() =>
      expect(getDiagnosedConditions).toHaveBeenLastCalledWith({ granularity: 'day', year: 2026, month: 2, day: 28 })
    );
    expect(screen.getByRole('button', { name: '28' })).toBeInTheDocument();
  });

  it('says so when nothing was recorded in the period', async () => {
    getDiagnosedConditions.mockResolvedValue({ total: 0, conditions: [], years: [2026] });
    renderChart();

    expect(await screen.findByText('No conditions recorded for October 2026')).toBeInTheDocument();
  });
});
