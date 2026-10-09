import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRef } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api/reports.api', () => ({ getHealthReport: vi.fn() }));

import { getHealthReport } from '../../api/reports.api';
import Station1HealthSection from './Station1HealthSection';
import { STATION1_HEALTH } from './healthReportFixtures';
import { installFakeIntersectionObserver } from '../../test/fakeIntersectionObserver';

const PARAMS = { from: '2026-10-01', to: '2026-10-31' };

// A KPI card's value sits right under the row that holds its label.
const kpiValue = (label) => screen.getByText(label).parentElement.nextElementSibling;

// A chart legend entry's count sits right after its name.
const legendValue = (name) => screen.getByTitle(name).nextElementSibling;

function renderSection(props = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Station1HealthSection params={PARAMS} {...props} />
    </QueryClientProvider>
  );
}

describe('Station1HealthSection', () => {
  beforeEach(() => {
    getHealthReport.mockReset();
    getHealthReport.mockResolvedValue(STATION1_HEALTH);
  });

  it('asks for station 1 with the filter params', async () => {
    renderSection();

    await waitFor(() => expect(getHealthReport).toHaveBeenCalledWith(1, PARAMS));
  });

  it('shows the KPIs as shares of the patients measured', async () => {
    renderSection();

    expect(await screen.findByText('Healthy Normal BMI')).toBeInTheDocument();
    expect(kpiValue('Patients Registered & Screened')).toHaveTextContent('10');
    expect(kpiValue('Healthy Normal BMI')).toHaveTextContent('33.3%');
    expect(kpiValue('High BP Flagged (Stage 1+)')).toHaveTextContent('40%');
  });

  it('charts every office, the BMI classes and the BP stages', async () => {
    renderSection();

    expect(await screen.findByText('Intake Volume by Agency / Office')).toBeInTheDocument();
    expect(legendValue('PROV. HEALTH OFFICE')).toHaveTextContent('6');
    expect(legendValue('No office recorded')).toHaveTextContent('1');
    expect(legendValue('Obese Class II')).toHaveTextContent('1');
    expect(legendValue('Hypertensive Crisis')).toHaveTextContent('1');
  });

  it('says the classification chart is not tracked yet', async () => {
    renderSection();

    expect(await screen.findByText(/^Not tracked yet/)).toBeInTheDocument();
  });

  it('hands the chart cards to the PDF export', async () => {
    const chartRefs = { byOffice: createRef(), bmi: createRef(), bp: createRef() };
    renderSection({ chartRefs });

    await screen.findByText('Intake Volume by Agency / Office');
    expect(chartRefs.byOffice.current).toHaveTextContent('Intake Volume by Agency / Office');
    expect(chartRefs.bmi.current).toHaveTextContent('Asia-Pacific BMI Classification');
    expect(chartRefs.bp.current).toHaveTextContent('Blood Pressure Stage Distribution');
  });

  it('draws its charts at once while a PDF export runs, scrolled to or not', async () => {
    installFakeIntersectionObserver();
    renderSection({ exporting: true });

    await screen.findByText('Intake Volume by Agency / Office');
    expect(document.querySelectorAll('.recharts-responsive-container')).toHaveLength(3);
  });

  it('says so when the period has no visits, instead of drawing empty charts', async () => {
    getHealthReport.mockResolvedValue({
      ...STATION1_HEALTH,
      visits: 0,
      patients: 0,
      bmi: { underweight: 0, normal: 0, overweight: 0, obese1: 0, obese2: 0 },
      bp: { normal: 0, elevated: 0, stage1: 0, stage2: 0, crisis: 0 },
      byOffice: [],
    });
    renderSection();

    expect(await screen.findByText('No Station 1 visits in this period.')).toBeInTheDocument();
    expect(screen.queryByText('Intake Volume by Agency / Office')).not.toBeInTheDocument();
  });

  it('shows the error with a retry that asks again', async () => {
    const user = userEvent.setup();
    getHealthReport.mockRejectedValueOnce(new Error('Server unavailable'));
    renderSection();

    expect(await screen.findByText('Server unavailable')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Healthy Normal BMI')).toBeInTheDocument();
    expect(getHealthReport).toHaveBeenCalledTimes(2);
  });
});
