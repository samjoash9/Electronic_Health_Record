import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../api/reports.api', () => ({ getStationReport: vi.fn() }));

import { getStationReport } from '../../../api/reports.api';
import Station2Report from './Station2Report';
import { REPORTS } from './reportFixtures';

const PARAMS = { from: '2026-10-01', to: '2026-10-31' };
const item = (list, label) => within(list).getByText(label).closest('li');

function renderReport() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Station2Report params={PARAMS} />
    </QueryClientProvider>
  );
}

describe('Station2Report', () => {
  beforeEach(() => {
    getStationReport.mockReset();
    getStationReport.mockResolvedValue(REPORTS[2]);
  });

  it('shows throughput and the median time at the kiosk', async () => {
    renderReport();
    expect(await screen.findByText('Assessments')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
    expect(getStationReport).toHaveBeenCalledWith(2, PARAMS);
  });

  it('spreads patients across the wellness bands', async () => {
    renderReport();
    const bands = await screen.findByRole('list', { name: 'Overall wellness legend' });
    expect(within(item(bands, 'Good')).getByText('3')).toBeInTheDocument();
    expect(within(item(bands, 'Needs support')).getByText('1')).toBeInTheDocument();
  });

  it('names the weakest category as the focus area', async () => {
    renderReport();
    const flags = await screen.findByRole('list', { name: 'Flags' });
    expect(within(item(flags, 'Focus area')).getByText('Sleep (61.2%)')).toBeInTheDocument();
  });
});
