import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../api/reports.api', () => ({ getStationReport: vi.fn() }));

import { getStationReport } from '../../../api/reports.api';
import Station3Report from './Station3Report';
import { REPORTS } from './reportFixtures';

const PARAMS = { from: '2026-10-01', to: '2026-10-31' };
const item = (list, label) => within(list).getByText(label).closest('li');

function renderReport() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Station3Report params={PARAMS} />
    </QueryClientProvider>
  );
}

describe('Station3Report', () => {
  beforeEach(() => {
    getStationReport.mockReset();
    getStationReport.mockResolvedValue(REPORTS[3]);
  });

  it('ranks the labs and medications ordered', async () => {
    renderReport();
    const labs = await screen.findByRole('list', { name: 'Top labs' });
    const rows = within(labs).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('CBC');
    expect(rows[1]).toHaveTextContent('Urinalysis');
    const meds = screen.getByRole('list', { name: 'Top medications' });
    expect(within(item(meds, 'Amlodipine')).getByText('2')).toBeInTheDocument();
    expect(getStationReport).toHaveBeenCalledWith(3, PARAMS);
  });

  it('shows each physician’s consultations', async () => {
    renderReport();
    const doctors = await screen.findByRole('list', { name: 'By physician' });
    expect(within(item(doctors, 'Dr. Reyes')).getByText('4')).toBeInTheDocument();
  });

  it('gives risk factors as a count and a share of patients', async () => {
    renderReport();
    const flags = await screen.findByRole('list', { name: 'Flags' });
    expect(within(item(flags, 'Chronic condition')).getByText('3 (50%)')).toBeInTheDocument();
    expect(within(item(flags, 'Smokers')).getByText('2 (33%)')).toBeInTheDocument();
  });
});
