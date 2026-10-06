import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { formatDateAtTime } from '../../lib/formatters';
import StationCollapsible from './StationCollapsible';

const summary = [
  { label: 'BP', value: '100/80' },
  { label: 'HR', value: null },
];

function renderCard(props = {}) {
  return render(
    <StationCollapsible station={1} title="Vital signs" summary={summary} {...props}>
      <p>Full vitals</p>
    </StationCollapsible>,
  );
}

describe('StationCollapsible', () => {
  it('shows the headline readings while closed, with a dash for a missing one', () => {
    renderCard({ completed: true });

    expect(screen.getByText('Station 1')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('100/80')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('Full vitals')).not.toBeInTheDocument();
  });

  it('swaps the readings for the full detail once opened', async () => {
    renderCard({ completed: true });

    await userEvent.click(screen.getByRole('button', { expanded: false }));

    expect(screen.getByText('Full vitals')).toBeInTheDocument();
    expect(screen.queryByText('100/80')).not.toBeInTheDocument();
  });

  it('moves the signing time to the header once opened, in place of the subtitle', async () => {
    const signedAt = '2026-10-06T05:36:00Z';
    renderCard({ completed: true, subtitle: 'Signed earlier', signedAt });

    expect(screen.getByText('Signed earlier')).toBeInTheDocument();
    expect(screen.queryByText(formatDateAtTime(signedAt))).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { expanded: false }));

    expect(screen.getByText('Signed')).toBeInTheDocument();
    expect(screen.getByText(formatDateAtTime(signedAt))).toBeInTheDocument();
    expect(screen.queryByText('Signed earlier')).not.toBeInTheDocument();
  });

  it('drops the subtitle once opened when the body carries its own sign-off', async () => {
    renderCard({ completed: true, subtitle: 'Signed earlier', signOffInBody: true });

    expect(screen.getByText('Signed earlier')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { expanded: false }));

    expect(screen.getByText('Full vitals')).toBeInTheDocument();
    expect(screen.queryByText('Signed earlier')).not.toBeInTheDocument();
  });

  it('holds the readings back until the station is completed', () => {
    renderCard();

    expect(screen.queryByText('BP')).not.toBeInTheDocument();
    expect(screen.queryByText('100/80')).not.toBeInTheDocument();
  });

  it('sets a worded reading in the body face and keeps figures in mono', () => {
    renderCard({
      completed: true,
      summary: [...summary, { label: 'Referral', value: 'Not needed', mono: false }],
    });

    expect(screen.getByText('100/80')).toHaveClass('font-mono');
    expect(screen.getByText('Not needed')).not.toHaveClass('font-mono');
  });
});
