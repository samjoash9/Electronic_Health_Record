import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../api/reports.api', () => ({ getStationReport: vi.fn() }));

import { getStationReport } from '../../../api/reports.api';
import Station6Report from './Station6Report';
import { REPORTS } from './reportFixtures';

const PARAMS = { from: '2026-10-01', to: '2026-10-31', office: 'D.O.P. MEMORIAL HOSPITAL' };
const item = (list, label) => within(list).getByText(label).closest('li');

function renderReport() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Station6Report params={PARAMS} />
    </QueryClientProvider>
  );
}

describe('Station6Report', () => {
  beforeEach(() => {
    getStationReport.mockReset();
    getStationReport.mockResolvedValue(REPORTS[6]);
  });

  it('shows the covering period’s budget for every office', async () => {
    renderReport();
    expect(await screen.findByText(/Q4 2026/)).toHaveTextContent('All offices');
    expect(screen.getByText('₱100,000.00')).toBeInTheDocument();
    expect(screen.getByText('₱15,000.00', { selector: 'dd' })).toBeInTheDocument();
    const top = screen.getByRole('list', { name: 'Top items' });
    expect(within(item(top, 'CBC')).getByText('₱30,000.00')).toBeInTheDocument();
  });

  it('flags a budget past 80% and unpriced charges', async () => {
    renderReport();
    const flags = await screen.findByRole('list', { name: 'Flags' });
    expect(item(flags, 'Budget used')).toHaveClass('text-rose-600');
    expect(within(item(flags, 'Budget used')).getByText('85%')).toBeInTheDocument();
    expect(item(flags, 'Unpriced charges')).toHaveClass('text-rose-600');
    expect(screen.queryByText('Over budget by')).not.toBeInTheDocument();
  });

  it('says how far over budget a period is without drawing a negative remainder', async () => {
    getStationReport.mockResolvedValue({
      ...REPORTS[6],
      period: { ...REPORTS[6].period, consumed: 110000, remaining: -10000, percentUsed: 110 },
    });
    renderReport();
    const flags = await screen.findByRole('list', { name: 'Flags' });
    expect(within(item(flags, 'Over budget by')).getByText('₱10,000.00')).toBeInTheDocument();
    const budget = screen.getByRole('list', { name: 'Budget legend' });
    expect(within(item(budget, 'Remaining')).getByText('₱0.00')).toBeInTheDocument();
  });

  it('says so when no billing period covers the date', async () => {
    getStationReport.mockResolvedValue({ asOf: '2026-10-05', period: null, byType: { lab: 0, medication: 0 }, topItems: [], unpricedCount: 0 });
    renderReport();
    expect(await screen.findByText('No billing period covers this date.')).toBeInTheDocument();
  });
});
