import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import SocialHistorySection from './SocialHistorySection';

function Harness() {
  const form = useForm({
    defaultValues: {
      socialHistory: {
        smokingSticksPerDay: '', exerciseFrequency: '', exerciseType: '',
        alcoholType: '', drinkFrequency: '', drinksPerSession: '',
        hasBeenDrunk: null, drunkFrequency: '',
      },
    },
  });
  return <SocialHistorySection control={form.control} watch={form.watch} />;
}

describe('SocialHistorySection', () => {
  it('starts with neither Yes nor No selected', () => {
    render(<Harness />);
    expect(screen.getByRole('radio', { name: /^yes$/i })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: /^no$/i })).not.toBeChecked();
  });

  it('reveals the drunk-frequency field only after answering Yes', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.queryByText(/how often have you been drunk/i)).toBeNull();

    await user.click(screen.getByRole('radio', { name: /^yes$/i }));
    expect(screen.getByText(/how often have you been drunk/i)).toBeInTheDocument();

    // Answering No retracts it, so a stale frequency cannot be submitted.
    await user.click(screen.getByRole('radio', { name: /^no$/i }));
    expect(screen.queryByText(/how often have you been drunk/i)).toBeNull();
  });

  it('steps the smoking counter and clamps at zero', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const counter = screen.getByLabelText(/sticks per day/i);

    await user.click(screen.getByRole('button', { name: /increase/i }));
    expect(counter).toHaveValue(1);

    await user.click(screen.getByRole('button', { name: /decrease/i }));
    expect(counter).toHaveValue(0);
    // Already at the minimum, so decrementing is unavailable rather than negative.
    expect(screen.getByRole('button', { name: /decrease/i })).toBeDisabled();
  });
});
