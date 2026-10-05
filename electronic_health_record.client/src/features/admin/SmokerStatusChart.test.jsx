import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api/patients.api', () => ({
  getSmokingStatus: vi.fn(),
}));

import { getSmokingStatus } from '../../api/patients.api';
import SmokerStatusChart from './SmokerStatusChart';

function renderChart() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SmokerStatusChart />
    </QueryClientProvider>
  );
}

const legendItem = (label) =>
  within(screen.getByRole('list', { name: 'Smoker status legend' })).getByText(label).closest('li');

describe('SmokerStatusChart', () => {
  beforeEach(() => {
    getSmokingStatus.mockReset();
    getSmokingStatus.mockResolvedValue({
      total: 12,
      nonSmokers: 5,
      smokers: { traditional: 4, eCigarette: 2, both: 1, unspecified: 0 },
    });
  });

  it('opens on all offices and splits smokers by what they smoke', async () => {
    renderChart();

    expect(await screen.findByText('12 patients · All offices')).toBeInTheDocument();
    expect(getSmokingStatus).toHaveBeenLastCalledWith({});
    expect(legendItem('Traditional')).toHaveTextContent('4');
    expect(legendItem('E-Cigarette')).toHaveTextContent('2');
    expect(legendItem('Both')).toHaveTextContent('1');
    expect(legendItem('Non-Smoker')).toHaveTextContent('5');
    expect(screen.queryByText('Unspecified')).not.toBeInTheDocument();
  });

  it('asks for one office once it is picked', async () => {
    const user = userEvent.setup();
    renderChart();
    await screen.findByText('12 patients · All offices');

    await user.click(screen.getByRole('button', { name: 'All offices' }));
    await user.click(screen.getByRole('option', { name: 'PROVINCIAL HEALTH OFFICE' }));

    await waitFor(() =>
      expect(getSmokingStatus).toHaveBeenLastCalledWith({ office: 'PROVINCIAL HEALTH OFFICE' })
    );
    expect(await screen.findByText('12 patients · PROVINCIAL HEALTH OFFICE')).toBeInTheDocument();
  });

  it('shows smokers who named no type as Unspecified', async () => {
    getSmokingStatus.mockResolvedValue({
      total: 3,
      nonSmokers: 1,
      smokers: { traditional: 1, eCigarette: 0, both: 0, unspecified: 1 },
    });
    renderChart();

    await screen.findByText('3 patients · All offices');
    expect(legendItem('Unspecified')).toHaveTextContent('1');
  });

  it('says so when no smoking history is on record', async () => {
    getSmokingStatus.mockResolvedValue({
      total: 0,
      nonSmokers: 0,
      smokers: { traditional: 0, eCigarette: 0, both: 0, unspecified: 0 },
    });
    renderChart();

    expect(await screen.findByText('No smoking history recorded')).toBeInTheDocument();
  });
});
