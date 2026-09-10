import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import SocialHistorySection from './SocialHistorySection';

function Harness() {
  const form = useForm({
    defaultValues: {
      socialHistory: {
        smokes: null,
        smokesCigarette: false,
        cigaretteSticksPerDay: '', cigaretteFrequency: '', cigaretteYearStarted: '', cigarettePuffsPerDay: '',
        smokesEcig: false,
        ecigPodsPerMonth: '', ecigFrequency: '', ecigYearStarted: '', ecigPuffsPerDay: '',
        alcoholType: '', drinkFrequency: '', drinksPerSession: '',
      },
      exercise: [{ exerciseType: '', exerciseFrequency: '', exerciseYearStarted: '' }],
    },
  });
  return <SocialHistorySection control={form.control} watch={form.watch} />;
}

describe('SocialHistorySection', () => {
  it('starts with neither Yes nor No selected for smoking, and no cigarette/e-cig fields shown', () => {
    render(<Harness />);
    const radios = screen.getAllByRole('radio', { name: /^(yes|no)$/i });
    radios.forEach((r) => expect(r).not.toBeChecked());
    expect(screen.queryByRole('checkbox', { name: /cigarette/i })).toBeNull();
  });

  it('reveals the cigarette/e-cigarette choice only after answering Yes to smoking', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.queryByRole('checkbox', { name: /^cigarette$/i })).toBeNull();

    await user.click(screen.getByRole('radio', { name: /^yes$/i, hidden: true }));
    expect(screen.getByRole('checkbox', { name: /^cigarette$/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /^e-cigarette$/i })).toBeInTheDocument();

    // Answering No retracts the choice, so stale sub-fields cannot be submitted.
    await user.click(screen.getByRole('radio', { name: /^no$/i, hidden: true }));
    expect(screen.queryByRole('checkbox', { name: /^cigarette$/i })).toBeNull();
  });

  it('shows cigarette fields when Cigarette is checked, with free-form typing', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('radio', { name: /^yes$/i, hidden: true }));
    await user.click(screen.getByRole('checkbox', { name: /^cigarette$/i }));

    const sticks = screen.getByLabelText(/sticks per day/i);
    const frequency = screen.getByLabelText(/^cigarette frequency$/i);
    const yearStarted = screen.getByLabelText(/cigarette.*year started/i);
    const puffs = screen.getByLabelText(/puffs per day/i);

    await user.type(sticks, '10-15');
    await user.type(frequency, 'Daily');
    await user.type(yearStarted, '2015');
    await user.type(puffs, '20');

    expect(sticks).toHaveValue('10-15');
    expect(frequency).toHaveValue('Daily');
    expect(yearStarted).toHaveValue('2015');
    expect(puffs).toHaveValue('20');

    // E-cigarette fields stay hidden since only Cigarette is checked.
    expect(screen.queryByLabelText(/pods per month/i)).toBeNull();
  });

  it('shows e-cigarette fields when E-cigarette is checked', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('radio', { name: /^yes$/i, hidden: true }));
    await user.click(screen.getByRole('checkbox', { name: /^e-cigarette$/i }));

    const pods = screen.getByLabelText(/pods per month/i);
    await user.type(pods, '2');
    expect(pods).toHaveValue('2');

    // Cigarette fields stay hidden since only E-cigarette is checked.
    expect(screen.queryByLabelText(/sticks per day/i)).toBeNull();
  });

  it('shows both cigarette and e-cigarette fields when both are checked', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('radio', { name: /^yes$/i, hidden: true }));
    await user.click(screen.getByRole('checkbox', { name: /^cigarette$/i }));
    await user.click(screen.getByRole('checkbox', { name: /^e-cigarette$/i }));

    expect(screen.getByLabelText(/sticks per day/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pods per month/i)).toBeInTheDocument();
  });

  it('has no "have you ever been drunk" field in the Alcohol panel', () => {
    render(<Harness />);
    expect(screen.queryByText(/have you ever been drunk/i)).toBeNull();
  });

  it('accepts free-form typing for exercise type, frequency, and year started', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const type = screen.getByLabelText(/type of exercise, row 1/i);
    const frequency = screen.getByLabelText(/^frequency, row 1$/i);
    const yearStarted = screen.getByLabelText(/year started, row 1/i);

    // Plain text inputs, not dropdowns: any value the patient types is valid.
    await user.type(type, 'Badminton twice a week');
    await user.type(frequency, '2x weekly');
    await user.type(yearStarted, '2019');

    expect(type).toHaveValue('Badminton twice a week');
    expect(frequency).toHaveValue('2x weekly');
    expect(yearStarted).toHaveValue('2019');
  });

  it('adds another exercise row and removes one, keeping at least one on screen', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getAllByLabelText(/type of exercise, row/i)).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /add another exercise/i }));
    expect(screen.getAllByLabelText(/type of exercise, row/i)).toHaveLength(2);

    await user.type(screen.getByLabelText(/type of exercise, row 2/i), 'Swimming');

    await user.click(screen.getByRole('button', { name: /remove row 1/i }));
    // Row 2 shifted into row 1's slot; its typed value survived the removal.
    expect(screen.getAllByLabelText(/type of exercise, row/i)).toHaveLength(1);
    expect(screen.getByLabelText(/type of exercise, row 1/i)).toHaveValue('Swimming');

    // Removing the last remaining row resets it instead of leaving zero rows.
    await user.click(screen.getByRole('button', { name: /remove row 1/i }));
    expect(screen.getAllByLabelText(/type of exercise, row/i)).toHaveLength(1);
    expect(screen.getByLabelText(/type of exercise, row 1/i)).toHaveValue('');
  });
});
