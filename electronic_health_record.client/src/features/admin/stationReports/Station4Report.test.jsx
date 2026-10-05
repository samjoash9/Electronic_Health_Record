import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../api/reports.api', () => ({ getStationReport: vi.fn() }));

import { getStationReport } from '../../../api/reports.api';
import Station4Report from './Station4Report';
import { REPORTS } from './reportFixtures';

const PARAMS = { from: '2026-10-01', to: '2026-10-31' };
const item = (list, label) => within(list).getByText(label).closest('li');

function renderReport() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Station4Report params={PARAMS} />
    </QueryClientProvider>
  );
}

describe('Station4Report', () => {
  beforeEach(() => {
    getStationReport.mockReset();
    getStationReport.mockResolvedValue(REPORTS[4]);
  });

  it('splits oral hygiene and lists findings as a share of patients', async () => {
    renderReport();
    const hygiene = await screen.findByRole('list', { name: 'Oral hygiene legend' });
    expect(within(item(hygiene, 'Poor')).getByText('1')).toBeInTheDocument();
    const findings = screen.getByRole('list', { name: 'Findings' });
    expect(within(item(findings, 'Dental caries')).getByText('3')).toBeInTheDocument();
    expect(within(item(findings, 'Dental caries')).getByText('60%')).toBeInTheDocument();
    expect(getStationReport).toHaveBeenCalledWith(4, PARAMS);
  });

  it('raises urgent referrals but not routine ones', async () => {
    renderReport();
    const flags = await screen.findByRole('list', { name: 'Flags' });
    expect(item(flags, 'Urgent referral')).toHaveClass('text-rose-600');
    expect(item(flags, 'Routine referral')).not.toHaveClass('text-rose-600');
  });
});
