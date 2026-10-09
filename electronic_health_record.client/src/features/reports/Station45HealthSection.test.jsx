import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRef } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api/reports.api', () => ({ getHealthReport: vi.fn() }));

import { getHealthReport } from '../../api/reports.api';
import Station4HealthSection from './Station4HealthSection';
import Station5HealthSection from './Station5HealthSection';
import { STATION4_HEALTH, STATION5_HEALTH } from './healthReportFixtures';
import { installFakeIntersectionObserver } from '../../test/fakeIntersectionObserver';

const PARAMS = { from: '2026-10-01', to: '2026-10-31' };

// A KPI card's value sits right under the row that holds its label.
const kpiValue = (label) => screen.getByText(label).parentElement.nextElementSibling;

// A legend row: the count sits after the dot-and-name group.
const legendValue = (name) => screen.getByText(name).parentElement.nextElementSibling;

function renderSection(Section, props = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Section params={PARAMS} {...props} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  getHealthReport.mockReset();
  getHealthReport.mockImplementation((station) =>
    Promise.resolve(station === 4 ? STATION4_HEALTH : STATION5_HEALTH)
  );
});

describe('Station4HealthSection', () => {
  it('asks for station 4 with the filter params', async () => {
    renderSection(Station4HealthSection);

    await waitFor(() => expect(getHealthReport).toHaveBeenCalledWith(4, PARAMS));
  });

  it('shows screenings and the caries, gum and treatment figures', async () => {
    renderSection(Station4HealthSection);

    expect(await screen.findByText('Active Dental Caries Rate')).toBeInTheDocument();
    expect(kpiValue('Dental Screenings')).toHaveTextContent('12');
    expect(kpiValue('Active Dental Caries Rate')).toHaveTextContent('60%');
    expect(kpiValue('Periodontal / Gingivitis')).toHaveTextContent('44.4%');
    expect(kpiValue('Restorative & Extraction Needed')).toHaveTextContent('4');
    expect(screen.getByText('6 of 10 answered')).toBeInTheDocument();
  });

  it('charts oral hygiene and gum condition with their shares', async () => {
    renderSection(Station4HealthSection);

    expect(await screen.findByText('Oral Hygiene Status Distribution')).toBeInTheDocument();
    expect(screen.getByText('Poor').nextElementSibling).toHaveTextContent('(20%)');
    expect(legendValue('Gingivitis')).toHaveTextContent('3 (33.3%)');
  });

  it('hands both chart cards to the PDF export and draws them at once while it runs', async () => {
    installFakeIntersectionObserver();
    const chartRefs = { hygiene: createRef(), gum: createRef() };
    renderSection(Station4HealthSection, { chartRefs, exporting: true });

    await screen.findByText('Oral Hygiene Status Distribution');
    expect(chartRefs.hygiene.current).toHaveTextContent('Oral Hygiene Status Distribution');
    expect(chartRefs.gum.current).toHaveTextContent('Periodontal & Gum Condition Assessment');
    expect(document.querySelectorAll('.recharts-responsive-container')).toHaveLength(2);
  });

  it('keeps its section frame while loading, for the quick-jump ring', () => {
    getHealthReport.mockReturnValue(new Promise(() => {}));
    const { container } = renderSection(Station4HealthSection);

    expect(container.firstElementChild.tagName).toBe('SECTION');
    expect(screen.getByText('Station 4: Dental Assessment Graphical Reports')).toBeInTheDocument();
  });

  it('says so when the period has no screenings', async () => {
    getHealthReport.mockResolvedValue({ ...STATION4_HEALTH, screenings: 0, patients: 0 });
    renderSection(Station4HealthSection);

    expect(await screen.findByText('No Station 4 dental screenings in this period.')).toBeInTheDocument();
    expect(screen.queryByText('Oral Hygiene Status Distribution')).not.toBeInTheDocument();
  });

  it('shows the error with a retry that asks again', async () => {
    const user = userEvent.setup();
    getHealthReport.mockRejectedValueOnce(new Error('Server unavailable'));
    renderSection(Station4HealthSection);

    expect(await screen.findByText('Server unavailable')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Active Dental Caries Rate')).toBeInTheDocument();
  });
});

describe('Station5HealthSection', () => {
  it('asks for station 5 with the filter params', async () => {
    renderSection(Station5HealthSection);

    await waitFor(() => expect(getHealthReport).toHaveBeenCalledWith(5, PARAMS));
  });

  it('shows screenings, eye pain and near and distant difficulty', async () => {
    renderSection(Station5HealthSection);

    expect(await screen.findByText('Reported Eye Pain / Discomfort')).toBeInTheDocument();
    expect(kpiValue('Vision Screenings Performed')).toHaveTextContent('12');
    expect(kpiValue('Reported Eye Pain / Discomfort')).toHaveTextContent('10%');
    expect(kpiValue('Near Vision Difficulty (Presbyopia Risk)')).toHaveTextContent('3');
    expect(screen.getByText('37.5% of 8 answered')).toBeInTheDocument();
  });

  it('charts each symptom with its share of those who answered it', async () => {
    renderSection(Station5HealthSection);

    expect(await screen.findByText('Prevalence of Reported Visual Symptoms')).toBeInTheDocument();
    expect(legendValue('Difficulty Seeing Near Objects')).toHaveTextContent('3 (37.5%)');
  });

  it('hands the chart card to the PDF export and draws it at once while it runs', async () => {
    installFakeIntersectionObserver();
    const chartRefs = { symptoms: createRef() };
    renderSection(Station5HealthSection, { chartRefs, exporting: true });

    await screen.findByText('Prevalence of Reported Visual Symptoms');
    expect(chartRefs.symptoms.current).toHaveTextContent('Prevalence of Reported Visual Symptoms');
    expect(document.querySelectorAll('.recharts-responsive-container')).toHaveLength(1);
  });

  it('says so when the period has no screenings', async () => {
    getHealthReport.mockResolvedValue({ ...STATION5_HEALTH, screenings: 0, patients: 0 });
    renderSection(Station5HealthSection);

    expect(await screen.findByText('No Station 5 vision screenings in this period.')).toBeInTheDocument();
  });
});
