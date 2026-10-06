import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../api/reports.api', () => ({ getStationReport: vi.fn() }));

import { getStationReport } from '../../../api/reports.api';
import Station5Report from './Station5Report';
import { REPORTS } from './reportFixtures';

const PARAMS = { from: '2026-10-01', to: '2026-10-31' };
const item = (list, label) => within(list).getByText(label).closest('li');

function renderReport() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Station5Report params={PARAMS} />
    </QueryClientProvider>
  );
}

describe('Station5Report', () => {
  beforeEach(() => {
    getStationReport.mockReset();
    getStationReport.mockResolvedValue(REPORTS[5]);
  });

  it('shows symptom prevalence and the condition split', async () => {
    renderReport();
    const symptoms = await screen.findByRole('list', { name: 'Symptoms' });
    // Shares are of those who answered each indicator, not of every patient.
    expect(within(item(symptoms, 'Headache / eye strain')).getByText('100%')).toBeInTheDocument();
    const conditions = screen.getByRole('list', { name: 'Eye condition legend' });
    expect(within(item(conditions, 'Refractive error')).getByText('1')).toBeInTheDocument();
    expect(screen.getByText('1 (50%)')).toBeInTheDocument();
    expect(getStationReport).toHaveBeenCalledWith(5, PARAMS);
  });

  it('raises specialist referrals', async () => {
    renderReport();
    const flags = await screen.findByRole('list', { name: 'Flags' });
    expect(item(flags, 'Specialist referral')).toHaveClass('text-rose-600');
    expect(item(flags, 'Follow-up advised')).not.toHaveClass('text-rose-600');
  });
});
