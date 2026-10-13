import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRef } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api/reports.api', () => ({ getHealthReport: vi.fn() }));

import { getHealthReport } from '../../api/reports.api';
import Station3HealthSection from './Station3HealthSection';
import { STATION3_HEALTH } from './healthReportFixtures';
import { installFakeIntersectionObserver } from '../../test/fakeIntersectionObserver';

const PARAMS = { from: '2026-10-01', to: '2026-10-31' };

// A KPI card's value sits right under the row that holds its label.
const kpiValue = (label) => screen.getByText(label).parentElement.nextElementSibling;

// StationReportSection's legend: the count sits right after the name.
const chartLegendValue = (name) => screen.getByTitle(name).nextElementSibling;

// The section's own cards: the count sits after the name's dot-and-label row.
const cardLegendValue = (name) => screen.getByTitle(name).parentElement.nextElementSibling;

function renderSection(props = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Station3HealthSection params={PARAMS} {...props} />
    </QueryClientProvider>
  );
}

describe('Station3HealthSection', () => {
  beforeEach(() => {
    getHealthReport.mockReset();
    getHealthReport.mockResolvedValue(STATION3_HEALTH);
  });

  it('asks for station 3 with the filter params', async () => {
    renderSection();

    await waitFor(() => expect(getHealthReport).toHaveBeenCalledWith(3, PARAMS));
  });

  it('shows consultations and the prescribing and lab rates', async () => {
    renderSection();

    expect(await screen.findByText('Diagnostic Labs Ordered')).toBeInTheDocument();
    expect(kpiValue('Consultations Completed')).toHaveTextContent('12');
    expect(kpiValue('Prescription Issuance Rate')).toHaveTextContent('66.7%');
    expect(kpiValue('Diagnostic Labs Ordered')).toHaveTextContent('41.7%');
  });

  it('charts medical history and maintenance drugs', async () => {
    renderSection();

    expect(await screen.findByText('Past & Recent Medical History')).toBeInTheDocument();
    expect(chartLegendValue('Hypertension')).toHaveTextContent('4');
    expect(chartLegendValue('Amlodipine')).toHaveTextContent('3');
  });

  it('shows smoking, exercise and drinking from the server', async () => {
    renderSection();

    expect(await screen.findByText('Lifestyle Risk & Social History')).toBeInTheDocument();
    expect(cardLegendValue('Both')).toHaveTextContent('1');
    expect(cardLegendValue('Non-Drinker')).toHaveTextContent('5');
    expect(screen.getByText(/6 of 10 patients exercise/)).toHaveTextContent('Top: Walking · 6 of 10 patients exercise');
  });

  it('ranks the labs ordered and the medications prescribed', async () => {
    renderSection();

    expect(await screen.findByText('Recommended Diagnostic & Laboratory Tests')).toBeInTheDocument();
    expect(cardLegendValue('Lipid Profile')).toHaveTextContent('3');
    expect(cardLegendValue('Paracetamol')).toHaveTextContent('3');
  });

  it('hands every chart card to the PDF export', async () => {
    const chartRefs = {
      conditions: createRef(),
      maintenance: createRef(),
      social: createRef(),
      labs: createRef(),
      medications: createRef(),
    };
    renderSection({ chartRefs });

    await screen.findByText('Past & Recent Medical History');
    expect(chartRefs.conditions.current).toHaveTextContent('Past & Recent Medical History');
    expect(chartRefs.maintenance.current).toHaveTextContent('Maintenance Medication Tracking');
    expect(chartRefs.social.current).toHaveTextContent('Lifestyle Risk & Social History');
    expect(chartRefs.labs.current).toHaveTextContent('Recommended Diagnostic & Laboratory Tests');
    expect(chartRefs.medications.current).toHaveTextContent('Top Prescribed Medications');
  });

  it('draws all seven charts at once while a PDF export runs, scrolled to or not', async () => {
    installFakeIntersectionObserver();
    renderSection({ exporting: true });

    await screen.findByText('Past & Recent Medical History');
    expect(document.querySelectorAll('.recharts-responsive-container')).toHaveLength(7);
  });

  it('says so when a list is empty, instead of drawing empty axes', async () => {
    getHealthReport.mockResolvedValue({
      ...STATION3_HEALTH,
      conditions: [],
      labs: [],
      exercise: { patients: 0, top: [] },
      smoking: { nonSmoker: 0, cigarette: 0, ecig: 0, both: 0, unspecified: 0 },
    });
    renderSection();

    expect(await screen.findByText('No conditions recorded in this period.')).toBeInTheDocument();
    expect(screen.getByText('No labs ordered in this period.')).toBeInTheDocument();
    expect(screen.getByText('No exercise recorded in this period.')).toBeInTheDocument();
    expect(screen.getByText('No smoking answers recorded.')).toBeInTheDocument();
    expect(chartLegendValue('Amlodipine')).toHaveTextContent('3');
  });

  it('says so when the period has no consultations', async () => {
    getHealthReport.mockResolvedValue({ ...STATION3_HEALTH, consultations: 0, patients: 0 });
    renderSection();

    expect(await screen.findByText('No Station 3 consultations in this period.')).toBeInTheDocument();
    expect(screen.queryByText('Past & Recent Medical History')).not.toBeInTheDocument();
  });

  it('shows the error with a retry that asks again', async () => {
    const user = userEvent.setup();
    getHealthReport.mockRejectedValueOnce(new Error('Server unavailable'));
    renderSection();

    expect(await screen.findByText('Server unavailable')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Diagnostic Labs Ordered')).toBeInTheDocument();
    expect(getHealthReport).toHaveBeenCalledTimes(2);
  });
});
