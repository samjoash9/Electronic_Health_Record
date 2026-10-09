import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRef } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api/reports.api', () => ({ getHealthReport: vi.fn() }));

import { getHealthReport } from '../../api/reports.api';
import Station2HealthSection from './Station2HealthSection';
import { STATION2_HEALTH } from './healthReportFixtures';
import { installFakeIntersectionObserver } from '../../test/fakeIntersectionObserver';

const PARAMS = { from: '2026-10-01', to: '2026-10-31', office: 'PROVINCIAL HEALTH OFFICE' };

// A KPI card's value sits right under the row that holds its label.
const kpiValue = (label) => screen.getByText(label).parentElement.nextElementSibling;

// A chart legend entry's value sits right after its name; each aspect has one
// entry per chart.
const legendValues = (name) => screen.getAllByTitle(name).map((el) => el.nextElementSibling.textContent);

function renderSection(props = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Station2HealthSection params={PARAMS} {...props} />
    </QueryClientProvider>
  );
}

describe('Station2HealthSection', () => {
  beforeEach(() => {
    getHealthReport.mockReset();
    getHealthReport.mockResolvedValue(STATION2_HEALTH);
  });

  it('asks for station 2 with the filter params', async () => {
    renderSection();

    await waitFor(() => expect(getHealthReport).toHaveBeenCalledWith(2, PARAMS));
  });

  it('shows the assessments and the overall score', async () => {
    renderSection();

    expect(await screen.findByText('Average Global Wellness Score')).toBeInTheDocument();
    expect(kpiValue('Total Assessments Completed')).toHaveTextContent('12');
    expect(kpiValue('Average Global Wellness Score')).toHaveTextContent('71.4 / 100');
  });

  it('charts each aspect’s score and its patients at risk', async () => {
    renderSection();

    expect(await screen.findByText('7 Aspects of Wellness (Average Assessment Scores)')).toBeInTheDocument();
    expect(legendValues('Financial')).toEqual(['48.8', '4']);
    expect(legendValues('Emotional')).toEqual(['—', '0']);
  });

  it('hands the chart cards to the PDF export', async () => {
    const chartRefs = { scores: createRef(), atRisk: createRef() };
    renderSection({ chartRefs });

    await screen.findByText('7 Aspects of Wellness (Average Assessment Scores)');
    expect(chartRefs.scores.current).toHaveTextContent('7 Aspects of Wellness');
    expect(chartRefs.atRisk.current).toHaveTextContent('At-Risk Patients by Wellness Aspect');
  });

  it('draws its charts at once while a PDF export runs, scrolled to or not', async () => {
    installFakeIntersectionObserver();
    renderSection({ exporting: true });

    await screen.findByText('7 Aspects of Wellness (Average Assessment Scores)');
    expect(document.querySelectorAll('.recharts-responsive-container')).toHaveLength(2);
  });

  it('says so when the period has no assessments, instead of drawing empty charts', async () => {
    getHealthReport.mockResolvedValue({
      assessments: 0,
      patients: 0,
      overallScore: null,
      aspects: STATION2_HEALTH.aspects.map((a) => ({ ...a, score: null, patients: 0, atRisk: 0 })),
    });
    renderSection();

    expect(await screen.findByText('No Station 2 assessments in this period.')).toBeInTheDocument();
    expect(screen.queryByText('7 Aspects of Wellness (Average Assessment Scores)')).not.toBeInTheDocument();
  });

  it('shows the error with a retry that asks again', async () => {
    const user = userEvent.setup();
    getHealthReport.mockRejectedValueOnce(new Error('Server unavailable'));
    renderSection();

    expect(await screen.findByText('Server unavailable')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Average Global Wellness Score')).toBeInTheDocument();
    expect(getHealthReport).toHaveBeenCalledTimes(2);
  });
});
