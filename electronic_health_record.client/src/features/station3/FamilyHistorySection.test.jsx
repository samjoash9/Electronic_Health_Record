import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import FamilyHistorySection from './FamilyHistorySection';

function Harness() {
  const form = useForm({
    defaultValues: {
      familyHistory: {
        none: false,
        conditions: {},
        other: { checked: false, entries: [{ conditionOther: '', conditionType: '' }] },
      },
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

  it('reveals a specific-type input when Mental Health is checked', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('checkbox', { name: /^MENTAL HEALTH CONDITION$/i }));
    expect(screen.getByLabelText(/specific type/i)).toBeInTheDocument();
  });

  it('reveals a condition-name input when Others is checked', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('checkbox', { name: /others/i }));
    expect(screen.getByRole('textbox', { name: /condition, row 1/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/specific type, row 1/i)).toBeInTheDocument();
  });

  it('adds another Others row and removes one', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('checkbox', { name: /others/i }));
    expect(screen.getAllByRole('textbox', { name: /^condition, row/i })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /add another condition/i }));
    expect(screen.getAllByRole('textbox', { name: /^condition, row/i })).toHaveLength(2);
    expect(screen.getByRole('textbox', { name: /condition, row 2/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /remove row 1/i }));
    expect(screen.getAllByRole('textbox', { name: /^condition, row/i })).toHaveLength(1);
  });

  it('resets to a single blank row when Others is unchecked and rechecked', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const othersCheckbox = screen.getByRole('checkbox', { name: /others/i });
    await user.click(othersCheckbox);
    await user.click(screen.getByRole('button', { name: /add another condition/i }));
    expect(screen.getAllByRole('textbox', { name: /^condition, row/i })).toHaveLength(2);

    await user.click(othersCheckbox);
    await user.click(othersCheckbox);
    expect(screen.getAllByRole('textbox', { name: /^condition, row/i })).toHaveLength(1);
  });

  it('does not reveal any input for Hypertension', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('checkbox', { name: /^HYPERTENSION$/i }));
    expect(screen.queryByLabelText(/specific type/i)).toBeNull();
  });

  it('reveals a "Please specify" input when Respiratory Illness is checked', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('checkbox', { name: /^RESPIRATORY ILLNESS$/i }));
    expect(screen.getByLabelText(/^please specify$/i)).toBeInTheDocument();
  });

  it.each([
    ['KIDNEY DISEASE'],
    ['LIVER DISEASE'],
    ['ARTHRITIS'],
    ['REPRODUCTIVE HEALTH PROBLEM'],
  ])('reveals a "Please specify" input when %s is checked', async (name) => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('checkbox', { name: new RegExp(`^${name}$`, 'i') }));
    expect(screen.getByLabelText(/^please specify$/i)).toBeInTheDocument();
  });

  it('clears and disables every other condition when None is checked', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const hypertension = screen.getByRole('checkbox', { name: /^HYPERTENSION$/i });
    await user.click(hypertension);
    expect(hypertension).toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: /^NONE$/i }));
    expect(hypertension).not.toBeChecked();
    expect(hypertension).toBeDisabled();
    expect(screen.queryByLabelText(/specific type/i)).toBeNull();
  });

  it('re-enables the other conditions when None is unchecked', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const none = screen.getByRole('checkbox', { name: /^NONE$/i });
    await user.click(none);
    await user.click(none);
    expect(screen.getByRole('checkbox', { name: /^HYPERTENSION$/i })).toBeEnabled();
  });
});
