import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportFilterFields } from './ReportFilterBar';
import { useReportFilter } from './useReportFilter';

// Drives the real filter state, so each test reads back what the reports
// would be asked for rather than which setter was called.
function Harness() {
  const filter = useReportFilter();
  return (
    <>
      <ReportFilterFields filter={filter} />
      <output>{filter.label}</output>
    </>
  );
}

const label = () => screen.getByRole('status').textContent;
// jsdom applies no CSS, so it joins a trigger's caption and value without the
// space a browser puts between them.
const trigger = (caption, value) => screen.getByRole('button', { name: new RegExp(`^${caption}\\s*${value}$`) });

describe('ReportFilterFields', () => {
  beforeEach(() => {
    // 2026-10-05 11:00 in Manila.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-05T03:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens on the current month for every office', () => {
    render(<Harness />);

    expect(screen.getByRole('radio', { name: 'Month' })).toHaveAttribute('aria-checked', 'true');
    expect(trigger('Month', 'October')).toBeInTheDocument();
    expect(trigger('Year', '2026')).toBeInTheDocument();
    expect(trigger('Office', 'All offices')).toBeInTheDocument();
    expect(screen.queryByLabelText('Date')).not.toBeInTheDocument();
    expect(label()).toBe('All offices · October 2026');
  });

  it('picks another month', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(trigger('Month', 'October'));
    await user.click(screen.getByRole('option', { name: 'March' }));

    expect(label()).toBe('All offices · March 2026');
  });

  it('offers the last five years', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(trigger('Year', '2026'));

    expect(screen.getAllByRole('option').map((o) => o.textContent))
      .toEqual(['2026', '2025', '2024', '2023', '2022']);
    await user.click(screen.getByRole('option', { name: '2024' }));
    expect(label()).toBe('All offices · October 2024');
  });

  it('narrows to an office', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(trigger('Office', 'All offices'));
    await user.click(screen.getByRole('option', { name: 'PROVINCIAL HEALTH OFFICE' }));

    expect(label()).toBe('PROVINCIAL HEALTH OFFICE · October 2026');
  });

  it('swaps the month and year pickers for a date on Day', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('radio', { name: 'Day' }));

    const date = screen.getByLabelText('Date');
    expect(date).toHaveValue('2026-10-05');
    expect(date).toHaveAttribute('max', '2026-10-05');
    expect(screen.queryByRole('button', { name: /^Month/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Year/ })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute('aria-checked', 'true');
    expect(label()).toBe('All offices · October 5, 2026');

    fireEvent.change(date, { target: { value: '2026-10-01' } });
    expect(label()).toBe('All offices · October 1, 2026');
  });

  it('keeps the last real date when the picker is cleared', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('radio', { name: 'Day' }));

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '' } });

    expect(label()).toBe('All offices · October 5, 2026');
  });

  it('leaves Year alone, across both columns, on Year', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('radio', { name: 'Year' }));

    expect(screen.queryByRole('button', { name: /^Month/ })).not.toBeInTheDocument();
    expect(trigger('Year', '2026').parentElement).toHaveClass('col-span-2');
    expect(label()).toBe('All offices · 2026');
  });
});
