import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import FamilyHistorySection from './FamilyHistorySection';

function Harness() {
  const form = useForm({
    defaultValues: {
      familyHistory: { none: false, conditions: {}, other: { checked: false } },
    },
  });
  return <FamilyHistorySection {...form} />;
}

describe('FamilyHistorySection', () => {
  it('reveals a specific-type input when Diabetes Mellitus is checked', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.queryByLabelText(/specific type/i)).toBeNull();
    await user.click(screen.getByRole('checkbox', { name: /^DIABETES MELLITUS$/i }));
    expect(screen.getByLabelText(/specific type/i)).toBeInTheDocument();
  });

  it('reveals a specific-type input when Cancer is checked', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('checkbox', { name: /^CANCER/i }));
    expect(screen.getByLabelText(/specific type/i)).toBeInTheDocument();
  });

  it('reveals a condition-name input when Others is checked', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('checkbox', { name: /others/i }));
    expect(screen.getByRole('textbox', { name: /^condition$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/specific type/i)).toBeInTheDocument();
  });

  it('does not reveal any input for Hypertension', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('checkbox', { name: /^HYPERTENSION$/i }));
    expect(screen.queryByLabelText(/specific type/i)).toBeNull();
  });

  it('does not reveal any input for Stroke', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('checkbox', { name: /^STROKE$/i }));
    expect(screen.queryByLabelText(/specific type/i)).toBeNull();
  });

  it('does not reveal any input for Tuberculosis', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('checkbox', { name: /^TUBERCULOSIS$/i }));
    expect(screen.queryByLabelText(/specific type/i)).toBeNull();
  });

  it('does not reveal any input for Bronchial Asthma', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('checkbox', { name: /^BRONCHIAL ASTHMA$/i }));
    expect(screen.queryByLabelText(/specific type/i)).toBeNull();
  });

  it('clears and disables every other condition when None is checked', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const stroke = screen.getByRole('checkbox', { name: /^STROKE$/i });
    await user.click(stroke);
    expect(stroke).toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: /^NONE$/i }));
    expect(stroke).not.toBeChecked();
    expect(stroke).toBeDisabled();
    expect(screen.queryByLabelText(/family members affected/i)).toBeNull();
  });

  it('re-enables the other conditions when None is unchecked', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const none = screen.getByRole('checkbox', { name: /^NONE$/i });
    await user.click(none);
    await user.click(none);
    expect(screen.getByRole('checkbox', { name: /^STROKE$/i })).toBeEnabled();
  });
});
