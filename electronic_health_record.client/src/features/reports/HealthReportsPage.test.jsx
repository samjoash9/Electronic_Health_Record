import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import HealthReportsPage from './HealthReportsPage';
import { getSampleVitalsReport } from './sampleVitalsReport';
import { installFakeIntersectionObserver } from '../../test/fakeIntersectionObserver';

// html-to-image needs a real canvas. A capture that never finishes holds the
// export on its first chart, which is where these tests look.
vi.mock('html-to-image', () => ({ toJpeg: vi.fn(() => new Promise(() => {})) }));

const chartsMounted = () => document.querySelectorAll('.recharts-responsive-container').length;
const jumpButton = (name) => screen.getByRole('button', { name });

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
});

afterEach(() => {
  delete Element.prototype.scrollIntoView;
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('HealthReportsPage charts', () => {
  it('draws no chart until its box scrolls into view', () => {
    const io = installFakeIntersectionObserver();
    render(<HealthReportsPage />);

    expect(chartsMounted()).toBe(0);

    io.setInView(document.querySelector('[data-chart-box]'));

    expect(chartsMounted()).toBe(1);
  });

  it('draws all 16 charts the moment a PDF export starts, scrolled to or not', async () => {
    vi.useFakeTimers();
    installFakeIntersectionObserver();
    render(<HealthReportsPage />);

    startExport();

    expect(chartsMounted()).toBe(16);
  });

  it('shows which chart the export is capturing', async () => {
    vi.useFakeTimers();
    installFakeIntersectionObserver();
    render(<HealthReportsPage />);

    startExport();
    // jsdom never sizes a chart, so the export waits out its full allowance.
    await act(() => vi.advanceTimersByTimeAsync(2100));

    expect(screen.getByText(/chart 1 of 14/i)).toBeInTheDocument();
  });
});

describe('HealthReportsPage Quick Jump', () => {
  it('marks the station being read', () => {
    const io = installFakeIntersectionObserver();
    render(<HealthReportsPage />);

    expect(jumpButton('1. Registration & Vitals')).toHaveAttribute('aria-current', 'location');

    io.setInView(document.getElementById('station-3'));

    expect(jumpButton('3. Consultation')).toHaveAttribute('aria-current', 'location');
    expect(jumpButton('1. Registration & Vitals')).not.toHaveAttribute('aria-current');
  });

  it('glides to the picked station', () => {
    preferReducedMotion(false);
    render(<HealthReportsPage />);

    fireEvent.click(jumpButton('4. Dental'));

    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById('station-4'));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('jumps without gliding when reduced motion is asked for', () => {
    preferReducedMotion(true);
    render(<HealthReportsPage />);

    fireEvent.click(jumpButton('4. Dental'));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  it('lands the station clear of the sticky bar', () => {
    render(<HealthReportsPage />);
    const stickyBar = screen.getByRole('navigation', { name: /stations/i }).parentElement;
    Object.defineProperty(stickyBar, 'offsetHeight', { value: 56 });

    fireEvent.click(jumpButton('4. Dental'));

    const margin = parseFloat(document.getElementById('station-4').style.scrollMarginTop);
    expect(margin).toBeGreaterThan(56);
  });

  it('rings the station once, after the glide settles', () => {
    vi.useFakeTimers();
    preferReducedMotion(false);
    render(<HealthReportsPage />);
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
    render(<HealthReportsPage />);
    const station = document.querySelector('#station-5 > section');
    station.animate = vi.fn();

    fireEvent.click(jumpButton('5. Vision'));
    vi.advanceTimersByTime(1000);

    expect(station.animate).toHaveBeenCalledOnce();
  });

  it('skips the ring when reduced motion is asked for', () => {
    vi.useFakeTimers();
    preferReducedMotion(true);
    render(<HealthReportsPage />);
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
