import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { peso } from '../../lib/formatters';
import BillingCardList from './BillingCardList';

const period = (title, capital, consumed, extra = {}) => ({
  billingFormID: title.length,
  title,
  startDate: '2026-09-01',
  endDate: '2026-10-31',
  employeeCount: 3,
  capital,
  consumed,
  remaining: capital - consumed,
  isOverBudget: consumed > capital,
  unpricedCount: 0,
  ...extra,
});

function renderList(periods, props = {}) {
  const onOpen = vi.fn();
  const onDelete = vi.fn();
  render(
    <BillingCardList periods={periods} onOpen={onOpen} onDelete={onDelete} empty="No periods." {...props} />
  );
  return { onOpen, onDelete };
}

const bar = (title) => screen.getByRole('progressbar', { name: `${title} capital used` });
const fill = (title) => bar(title).firstChild;

describe('BillingCardList usage bar', () => {
  it('stays brand-coloured under 80% of capital', () => {
    renderList([period('Q3', 1000, 790)]);

    expect(fill('Q3')).toHaveClass('bg-brand-500');
    expect(fill('Q3')).toHaveStyle({ width: '79%' });
    expect(screen.getByText('79% used')).toBeInTheDocument();
  });

  it('turns amber from 80% of capital, before it runs out', () => {
    renderList([period('Q3', 1000, 800)]);

    expect(fill('Q3')).toHaveClass('bg-amber-500');
  });

  it('turns rose and stops at full once over budget', () => {
    renderList([period('Q3', 1000, 1500)]);

    expect(fill('Q3')).toHaveClass('bg-rose-500');
    expect(fill('Q3')).toHaveStyle({ width: '100%' });
    expect(bar('Q3')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('150% used')).toBeInTheDocument();
  });

  it('reads a charge against zero capital as fully used', () => {
    renderList([period('Q3', 0, 250)]);

    expect(screen.getByText('100% used')).toBeInTheDocument();
  });

  it('reads an untouched zero-capital period as unused', () => {
    renderList([period('Q3', 0, 0)]);

    expect(screen.getByText('0% used')).toBeInTheDocument();
    expect(bar('Q3')).toHaveAttribute('aria-valuenow', '0');
  });

  it('shows a sliver of spending as <1% rather than 0%', () => {
    renderList([period('Q3', 1000000, 50)]);

    expect(screen.getByText('<1% used')).toBeInTheDocument();
  });
});

describe('BillingCardList ledger', () => {
  it('lists capital, consumed and what remains', () => {
    renderList([period('Q3', 1000, 400)]);

    expect(screen.getByText('Remaining')).toBeInTheDocument();
    expect(screen.getByText(peso(1000))).toBeInTheDocument();
    expect(screen.getByText(peso(400))).toBeInTheDocument();
    expect(screen.getByText(peso(600))).toBeInTheDocument();
    expect(screen.getByText('Within Budget')).toBeInTheDocument();
  });

  it('shows the overrun as a positive amount', () => {
    renderList([period('Q3', 1000, 1250)]);

    expect(screen.getByText('Over by')).toBeInTheDocument();
    expect(screen.queryByText('Remaining')).not.toBeInTheDocument();
    expect(screen.getByText(peso(250))).toBeInTheDocument();
    expect(screen.getByText('Over Budget')).toBeInTheDocument();
  });

  it('flags unpriced charges only when there are some', () => {
    renderList([period('Q3', 1000, 0, { unpricedCount: 2 }), period('Q4 2026', 1000, 0)]);

    expect(screen.getAllByText(/unpriced/)).toHaveLength(1);
    expect(screen.getByText('2 unpriced')).toBeInTheDocument();
  });
});

describe('BillingCardList actions', () => {
  it('opens a period from its card', async () => {
    const user = userEvent.setup();
    const q3 = period('Q3', 1000, 0);
    const { onOpen } = renderList([q3]);

    await user.click(screen.getByRole('button', { name: /^Q3/ }));

    expect(onOpen).toHaveBeenCalledWith(q3);
  });

  it('deletes without opening the card', async () => {
    const user = userEvent.setup();
    const q3 = period('Q3', 1000, 0);
    const { onOpen, onDelete } = renderList([q3]);

    const card = screen.getByRole('button', { name: /^Q3/ });
    await user.click(within(card).getByRole('button', { name: 'Delete Q3' }));

    expect(onDelete).toHaveBeenCalledWith(q3);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('shows the empty message with no periods', () => {
    renderList([]);

    expect(screen.getByText('No periods.')).toBeInTheDocument();
  });
});
