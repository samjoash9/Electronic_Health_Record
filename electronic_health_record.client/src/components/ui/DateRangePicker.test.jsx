import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DateRangePicker from './DateRangePicker';

const TODAY = '2026-10-09';

// The trigger's name is the label followed by the range it shows.
const trigger = () => screen.getByRole('button', { name: /^Visit date:/ });

function setup(props = {}) {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <DateRangePicker label="Visit date" from="" to="" today={TODAY} onChange={onChange} {...props} />
  );
  const open = () => user.click(trigger());
  const day = (name) => screen.getByRole('button', { name });
  return { onChange, user, open, day };
}

describe('DateRangePicker', () => {
  it('shows the applied range on the trigger', () => {
    setup({ from: '2026-10-03', to: '2026-10-09' });
    expect(trigger()).toHaveTextContent('10/03/2026 – 10/09/2026');
  });

  it('shows a placeholder when no range is applied', () => {
    setup();
    expect(trigger()).toHaveTextContent('mm/dd/yyyy – mm/dd/yyyy');
  });

  it('applies a preset relative to today', async () => {
    const { onChange, user, open } = setup();
    await open();
    await user.click(screen.getByRole('button', { name: 'Last 7 days' }));
    expect(screen.getByText('7 days selected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenCalledWith({ from: '2026-10-03', to: '2026-10-09' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('orders two clicked days earliest first', async () => {
    const { onChange, user, open, day } = setup();
    await open();
    await user.click(day('October 9, 2026'));
    await user.click(day('October 3, 2026'));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenCalledWith({ from: '2026-10-03', to: '2026-10-09' });
  });

  it('applies a single clicked day as a one-day range', async () => {
    const { onChange, user, open, day } = setup();
    await open();
    await user.click(day('October 5, 2026'));
    expect(screen.getByText('1 day selected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenCalledWith({ from: '2026-10-05', to: '2026-10-05' });
  });

  it('starts a new range on the click after a finished one', async () => {
    const { onChange, user, open, day } = setup();
    await open();
    await user.click(day('October 3, 2026'));
    await user.click(day('October 9, 2026'));
    await user.click(day('October 15, 2026'));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenCalledWith({ from: '2026-10-15', to: '2026-10-15' });
  });

  it('previews the range up to the hovered day', async () => {
    const { user, open, day } = setup();
    await open();
    await user.click(day('October 3, 2026'));
    await user.hover(day('October 6, 2026'));
    expect(day('October 3, 2026')).toHaveAttribute('data-range', 'start');
    expect(day('October 5, 2026')).toHaveAttribute('data-range', 'middle');
    expect(day('October 6, 2026')).toHaveAttribute('data-range', 'end');
    expect(day('October 7, 2026')).not.toHaveAttribute('data-range');
  });

  it('marks the preset that matches the current range', async () => {
    const { open } = setup({ from: '2026-10-03', to: '2026-10-09' });
    await open();
    expect(screen.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Today' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('discards the draft on Escape', async () => {
    const { onChange, user, open } = setup({ from: '2026-10-03', to: '2026-10-09' });
    await open();
    await user.click(screen.getByRole('button', { name: 'Last month' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();

    await open();
    expect(screen.getByText('7 days selected')).toBeInTheDocument();
  });

  it('discards the draft on an outside click', async () => {
    const { onChange, user, open } = setup();
    await open();
    await user.click(screen.getByRole('button', { name: 'Today' }));
    await user.click(document.body);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clears the applied range from the footer', async () => {
    const { onChange, user, open } = setup({ from: '2026-10-03', to: '2026-10-09' });
    await open();
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith({ from: '', to: '' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('clears the applied range from the trigger', async () => {
    const { onChange, user } = setup({ from: '2026-10-03', to: '2026-10-09' });
    await user.click(screen.getByRole('button', { name: 'Clear visit date' }));
    expect(onChange).toHaveBeenCalledWith({ from: '', to: '' });
  });

  it('offers no trigger clear button when nothing is applied', () => {
    setup();
    expect(screen.queryByRole('button', { name: 'Clear visit date' })).not.toBeInTheDocument();
  });

  it('opens on the month the applied range ends in and pages by month', async () => {
    const { user, open } = setup({ from: '2026-07-28', to: '2026-08-05' });
    await open();
    expect(screen.getByText('August 2026')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('September 2026')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByText('July 2026')).toBeInTheDocument();
  });

  it('opens on the month a preset lands in', async () => {
    const { user, open } = setup();
    await open();
    await user.click(screen.getByRole('button', { name: 'Last month' }));
    expect(screen.getByText('September 2026')).toBeInTheDocument();
  });

  it('cannot apply before a day is picked', async () => {
    const { open } = setup();
    await open();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });
});
