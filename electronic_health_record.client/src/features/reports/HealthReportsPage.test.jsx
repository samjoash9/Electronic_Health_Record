import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HealthReportsPage from './HealthReportsPage';
import { getSampleVitalsReport } from './sampleVitalsReport';
import { STATION1_HEALTH, STATION2_HEALTH, STATION3_HEALTH } from './healthReportFixtures';
import { installFakeIntersectionObserver } from '../../test/fakeIntersectionObserver';

// html-to-image needs a real canvas. A capture that never finishes holds the
// export on its first chart, which is where these tests look.
vi.mock('html-to-image', () => ({ toJpeg: vi.fn(() => new Promise(() => {})) }));

vi.mock('../../api/reports.api', () => ({ getHealthReport: vi.fn() }));

import { getHealthReport } from '../../api/reports.api';

const chartsMounted = () => document.querySelectorAll('.recharts-responsive-container').length;
const jumpButton = (name) => screen.getByRole('button', { name });

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <HealthReportsPage />
    </QueryClientProvider>
  );
}

const LIVE_REPORTS = { 1: STATION1_HEALTH, 2: STATION2_HEALTH, 3: STATION3_HEALTH };

// Stations 1-3 load their figures from the server; their charts exist once
// all three land.
async function liveStationsLoaded() {
  await screen.findByText('Healthy Normal BMI');
  await screen.findByText('71.4 / 100');
  await screen.findByText(/8 of 12 consultations/);
}

function preferReducedMotion(reduce) {
  vi.stubGlobal('matchMedia', (query) => ({
    matches: reduce && query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
}

function startExport() {
  fireEvent.click(screen.getByRole('button', { name: /download pdf report/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Generate PDF' }));
}

let scrollIntoView;

beforeEach(() => {
  // jsdom does no layout, so it has no scrollIntoView.
  scrollIntoView = vi.fn();
  Element.prototype.scrollIntoView = scrollIntoView;
  getHealthReport.mockReset();
  getHealthReport.mockImplementation((station) => Promise.resolve(LIVE_REPORTS[station]));
});

afterEach(() => {
  delete Element.prototype.scrollIntoView;
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('HealthReportsPage charts', () => {
  it('draws no chart until its box scrolls into view', () => {
    const io = installFakeIntersectionObserver();
    renderPage();

    expect(chartsMounted()).toBe(0);

    io.setInView(document.querySelector('[data-chart-box]'));

    expect(chartsMounted()).toBe(1);
  });

  it('draws all 15 charts the moment a PDF export starts, scrolled to or not', async () => {
    installFakeIntersectionObserver();
    renderPage();
    await liveStationsLoaded();
    vi.useFakeTimers();

    startExport();

    expect(chartsMounted()).toBe(15);
  });

  it('shows which chart the export is capturing', async () => {
    installFakeIntersectionObserver();
    renderPage();
    await liveStationsLoaded();
    vi.useFakeTimers();

    startExport();
    // jsdom never sizes a chart, so the export waits out its full allowance.
    await act(() => vi.advanceTimersByTimeAsync(2100));

    expect(screen.getByText(/chart 1 of 13/i)).toBeInTheDocument();
  });
});

describe('HealthReportsPage live stations', () => {
  beforeEach(() => {
    // 2026-10-05 11:00 in Manila. Only Date is faked so react-query's timers
    // and findBy* polling still run on real time.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-05T03:00:00Z'));
  });

  it('opens Stations 1–3 on the current month for every office', async () => {
    renderPage();

    const month = { from: '2026-10-01', to: '2026-10-31' };
    await waitFor(() => {
      for (const station of [1, 2, 3]) expect(getHealthReport).toHaveBeenCalledWith(station, month);
    });
  });

  it('narrows every live station to the picked office', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'All offices' }));
    await user.click(screen.getByRole('option', { name: 'PROVINCIAL HEALTH OFFICE' }));

    const picked = { from: '2026-10-01', to: '2026-10-31', office: 'PROVINCIAL HEALTH OFFICE' };
    await waitFor(() => {
      for (const station of [1, 2, 3]) expect(getHealthReport).toHaveBeenCalledWith(station, picked);
    });
  });

  it('shows Station 1 figures from the server', async () => {
    renderPage();

    expect(await screen.findByText('33.3%')).toBeInTheDocument();
  });

  it('shows Station 2 figures from the server', async () => {
    renderPage();

    expect(await screen.findByText('71.4 / 100')).toBeInTheDocument();
  });

  it('shows Station 3 figures from the server', async () => {
    renderPage();

    expect(await screen.findByText(/8 of 12 consultations/)).toBeInTheDocument();
  });

  it('says plainly that Stations 4–5 are still sample figures', () => {
    renderPage();

    expect(screen.getByRole('note')).toHaveTextContent('Stations 4–5 still show sample figures');
  });
});

describe('HealthReportsPage Quick Jump', () => {
  it('marks the station being read', () => {
    const io = installFakeIntersectionObserver();
    renderPage();

    expect(jumpButton('1. Registration & Vitals')).toHaveAttribute('aria-current', 'location');

    io.setInView(document.getElementById('station-3'));

    expect(jumpButton('3. Consultation')).toHaveAttribute('aria-current', 'location');
    expect(jumpButton('1. Registration & Vitals')).not.toHaveAttribute('aria-current');
  });

  it('glides to the picked station', () => {
    preferReducedMotion(false);
    renderPage();

    fireEvent.click(jumpButton('4. Dental'));

    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById('station-4'));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('jumps without gliding when reduced motion is asked for', () => {
    preferReducedMotion(true);
    renderPage();

    fireEvent.click(jumpButton('4. Dental'));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  it('lands the station clear of the sticky bar', () => {
    renderPage();
    const stickyBar = screen.getByRole('navigation', { name: /stations/i }).parentElement;
    Object.defineProperty(stickyBar, 'offsetHeight', { value: 56 });

    fireEvent.click(jumpButton('4. Dental'));

    const margin = parseFloat(document.getElementById('station-4').style.scrollMarginTop);
    expect(margin).toBeGreaterThan(56);
  });

  it('rings the station once, after the glide settles', () => {
    vi.useFakeTimers();
    preferReducedMotion(false);
    renderPage();
    const station = document.querySelector('#station-5 > section');
    station.animate = vi.fn();

    fireEvent.click(jumpButton('5. Vision'));
    expect(station.animate).not.toHaveBeenCalled();

    fireEvent(document, new Event('scrollend'));
    expect(station.animate).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(2000);
    expect(station.animate).toHaveBeenCalledOnce();
  });

  it('still rings where the browser never reports the glide ending', () => {
    vi.useFakeTimers();
    preferReducedMotion(false);
    renderPage();
    const station = document.querySelector('#station-5 > section');
    station.animate = vi.fn();

    fireEvent.click(jumpButton('5. Vision'));
    vi.advanceTimersByTime(1000);

    expect(station.animate).toHaveBeenCalledOnce();
  });

  it('skips the ring when reduced motion is asked for', () => {
    vi.useFakeTimers();
    preferReducedMotion(true);
    renderPage();
    const station = document.querySelector('#station-5 > section');
    station.animate = vi.fn();

    fireEvent.click(jumpButton('5. Vision'));
    fireEvent(document, new Event('scrollend'));
    vi.advanceTimersByTime(2000);

    expect(station.animate).not.toHaveBeenCalled();
  });
});

describe('getSampleVitalsReport', () => {
  it('counts every patient once in both BMI and BP, for every office', () => {
    for (const { office } of getSampleVitalsReport(null).byOffice) {
      const r = getSampleVitalsReport(office);
      const bpTotal = Object.values(r.bp).reduce((a, b) => a + b, 0);
      expect(bpTotal, office).toBe(r.total);
    }
  });

  it('ends the trend on the snapshot the other cards show', () => {
    const r = getSampleVitalsReport(null);
    const last = r.trend.at(-1);

    expect(last.overweightPct).toBeCloseTo(((r.bmi.overweight + r.bmi.obese) / r.total) * 100, 1);
    expect(last.highBpPct).toBeCloseTo(((r.bp.stage1 + r.bp.stage2 + r.bp.crisis) / r.total) * 100, 1);
  });
});
