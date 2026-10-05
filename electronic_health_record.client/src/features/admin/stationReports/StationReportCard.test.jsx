import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StationReportCard from './StationReportCard';

const station = { id: 2, name: 'Station 2', hex: '#10b981' };

function renderCard(query, extra = {}) {
  return render(
    <StationReportCard
      station={station}
      title="Wellness"
      query={query}
      isEmpty={(d) => d.completed === 0}
      kpis={(d) => [{ label: 'Done', value: d.completed }]}
      flags={(d) => <p>Flag {d.completed}</p>}
      {...extra}
    >
      {(d) => <p>Body {d.completed}</p>}
    </StationReportCard>
  );
}

describe('StationReportCard', () => {
  it('names the card after its station and report', () => {
    renderCard({ data: { completed: 3 } });
    expect(screen.getByRole('region', { name: 'Station 2 report' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Station 2 · Wellness' })).toBeInTheDocument();
  });

  it('shows KPIs, body and flags once the report is in', () => {
    renderCard({ data: { completed: 3 } }, { caption: () => 'All offices' });
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Body 3')).toBeInTheDocument();
    expect(screen.getByText('Flag 3')).toBeInTheDocument();
    expect(screen.getByText('All offices')).toBeInTheDocument();
  });

  it('says the period is empty instead of drawing zeroes', () => {
    renderCard({ data: { completed: 0 } });
    expect(screen.getByText('No visits in this period.')).toBeInTheDocument();
    expect(screen.queryByText('Body 0')).not.toBeInTheDocument();
    expect(screen.queryByText('Done')).not.toBeInTheDocument();
  });

  it('uses the card’s own empty text when it has one', () => {
    renderCard({ data: { completed: 0 } }, { emptyText: 'No billing period covers this date.' });
    expect(screen.getByText('No billing period covers this date.')).toBeInTheDocument();
  });

  it('shows the error with a retry that refetches', async () => {
    const refetch = vi.fn();
    renderCard({ error: new Error('Server down'), refetch });
    expect(screen.getByText('Server down')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows a skeleton while loading', () => {
    const { container } = renderCard({ isLoading: true });
    expect(container.querySelector('.animate-pulse')).not.toBeNull();
    expect(screen.queryByText('Done')).not.toBeInTheDocument();
  });
});
