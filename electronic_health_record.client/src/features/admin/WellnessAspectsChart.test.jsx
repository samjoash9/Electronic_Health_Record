import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api/assessment.api', () => ({
  getWellnessScores: vi.fn(),
}));

import { getWellnessScores } from '../../api/assessment.api';
import WellnessAspectsChart from './WellnessAspectsChart';

function renderChart() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <WellnessAspectsChart />
    </QueryClientProvider>
  );
}

const ASPECTS = [
  { categoryID: 3, name: 'Spiritual', score: 82.5 },
  { categoryID: 5, name: 'Psychological', score: 74 },
  { categoryID: 1, name: 'Mental', score: 68 },
  { categoryID: 6, name: 'Emotional', score: 71 },
  { categoryID: 2, name: 'Physical', score: 88 },
  { categoryID: 7, name: 'Financial', score: 60 },
  { categoryID: 4, name: 'Social', score: 79 },
];

describe('WellnessAspectsChart', () => {
  beforeEach(() => {
    getWellnessScores.mockReset();
    getWellnessScores.mockResolvedValue({ total: 12, aspects: ASPECTS });
  });

  it('opens on all offices and says how many patients the averages cover', async () => {
    renderChart();

    expect(await screen.findByText('Average Assessment Scores · 12 patients')).toBeInTheDocument();
    expect(getWellnessScores).toHaveBeenLastCalledWith({});
  });

  it('asks for one office once it is picked', async () => {
    const user = userEvent.setup();
    renderChart();
    await screen.findByText('Average Assessment Scores · 12 patients');

    await user.click(screen.getByRole('button', { name: 'All offices' }));
    await user.click(screen.getByRole('option', { name: 'PROVINCIAL HEALTH OFFICE' }));

    await waitFor(() =>
      expect(getWellnessScores).toHaveBeenLastCalledWith({ office: 'PROVINCIAL HEALTH OFFICE' })
    );
  });

  it('says so when nobody in the office has been assessed', async () => {
    getWellnessScores.mockResolvedValue({
      total: 0,
      aspects: ASPECTS.map((a) => ({ ...a, score: null })),
    });
    renderChart();

    expect(await screen.findByText('No assessments recorded')).toBeInTheDocument();
  });

  it('offers a retry when the scores fail to load', async () => {
    const user = userEvent.setup();
    getWellnessScores.mockRejectedValueOnce(new Error('boom'));
    renderChart();

    await user.click(await screen.findByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Average Assessment Scores · 12 patients')).toBeInTheDocument();
  });
});
