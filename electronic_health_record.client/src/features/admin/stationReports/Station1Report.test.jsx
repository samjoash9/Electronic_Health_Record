import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../api/reports.api', () => ({ getStationReport: vi.fn() }));

import { getStationReport } from '../../../api/reports.api';
import Station1Report from './Station1Report';
import { REPORTS } from './reportFixtures';

const PARAMS = { from: '2026-10-01', to: '2026-10-31' };
const item = (list, label) => within(list).getByText(label).closest('li');

function renderReport() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Station1Report params={PARAMS} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Station1Report', () => {
  beforeEach(() => {
    getStationReport.mockReset();
    getStationReport.mockResolvedValue(REPORTS[1]);
  });

  it('asks for station 1 with the filter params', async () => {
    renderReport();
    expect(await screen.findByRole('heading', { name: 'Station 1 · Intake & Vitals' })).toBeInTheDocument();
    expect(getStationReport).toHaveBeenCalledWith(1, PARAMS);
  });

  it('breaks the latest vitals down by BMI and blood pressure class', async () => {
    renderReport();
    const bmi = await screen.findByRole('list', { name: 'BMI legend' });
    expect(within(item(bmi, 'Obese')).getByText('3')).toBeInTheDocument();
    const bp = screen.getByRole('list', { name: 'Blood pressure legend' });
    expect(within(item(bp, 'Stage 2')).getByText('1')).toBeInTheDocument();
  });

  it('flags out-of-range intake vitals and links to the full report', async () => {
    renderReport();
    const flags = await screen.findByRole('list', { name: 'Flags' });
    expect(within(item(flags, 'Fast heart rate')).getByText('2')).toBeInTheDocument();
    expect(item(flags, 'Fast heart rate')).toHaveClass('text-rose-600');
    expect(item(flags, 'Slow heart rate')).not.toHaveClass('text-rose-600');
    expect(screen.getByRole('link', { name: /full health report/i })).toHaveAttribute('href', '/health-reports');
  });
});
