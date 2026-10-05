import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../api/reports.api', () => ({ getStationReport: vi.fn() }));

import { getStationReport } from '../../../api/reports.api';
import StationReportsSection from './StationReportsSection';
import { REPORTS } from './reportFixtures';

const STATIONS = [1, 2, 3, 4, 5, 6];

function renderSection() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <StationReportsSection />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const expectEveryStationAsked = (params) =>
  waitFor(() => {
    for (const station of STATIONS) {
      expect(getStationReport).toHaveBeenCalledWith(station, params);
    }
  });

describe('StationReportsSection', () => {
  beforeEach(() => {
    // 2026-10-05 11:00 in Manila. Only Date is faked so react-query's timers
    // and findBy* polling still run on real time.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-05T03:00:00Z'));
    getStationReport.mockReset();
    getStationReport.mockImplementation((station) => Promise.resolve(REPORTS[station]));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens on the current month for every office, one card per station', async () => {
    renderSection();
    await expectEveryStationAsked({ from: '2026-10-01', to: '2026-10-31' });
    for (const station of STATIONS) {
      expect(await screen.findByRole('region', { name: `Station ${station} report` })).toBeInTheDocument();
    }
  });

  it('narrows every card to one office', async () => {
    const user = userEvent.setup();
    renderSection();
    await user.click(screen.getByRole('button', { name: 'All offices' }));
    await user.click(screen.getByRole('option', { name: 'D.O.P. MEMORIAL HOSPITAL' }));
    await expectEveryStationAsked({ from: '2026-10-01', to: '2026-10-31', office: 'D.O.P. MEMORIAL HOSPITAL' });
  });

  it('switches to a single day, starting today, and follows the picked date', async () => {
    const user = userEvent.setup();
    renderSection();
    await user.click(screen.getByRole('button', { name: 'Month' }));
    await user.click(screen.getByRole('option', { name: 'Day' }));
    await expectEveryStationAsked({ from: '2026-10-05', to: '2026-10-05' });

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-09-30' } });
    await expectEveryStationAsked({ from: '2026-09-30', to: '2026-09-30' });
  });

  it('keeps the last date when the day picker is cleared', async () => {
    const user = userEvent.setup();
    renderSection();
    await user.click(screen.getByRole('button', { name: 'Month' }));
    await user.click(screen.getByRole('option', { name: 'Day' }));
    await expectEveryStationAsked({ from: '2026-10-05', to: '2026-10-05' });

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '' } });
    expect(screen.getByLabelText('Date')).toHaveValue('2026-10-05');
    expect(getStationReport).not.toHaveBeenCalledWith(1, { from: '', to: '' });
  });

  it('covers the whole year for Year', async () => {
    const user = userEvent.setup();
    renderSection();
    await user.click(screen.getByRole('button', { name: 'Month' }));
    await user.click(screen.getByRole('option', { name: 'Year' }));
    await expectEveryStationAsked({ from: '2026-01-01', to: '2026-12-31' });
    expect(screen.queryByRole('button', { name: 'October' })).not.toBeInTheDocument();
  });
});
