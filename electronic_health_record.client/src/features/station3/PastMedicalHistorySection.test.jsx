import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import PastMedicalHistorySection from './PastMedicalHistorySection';
import { yearBounds } from '../../lib/yearBounds';

const BLANK_ROW = {
  conditionOther: '', yearDiagnosed: '', maintenanceDrugGeneric: '', dosage: '', frequency: '',
};

function Harness({ bounds = yearBounds('1979-02-08', 2026) }) {
  const form = useForm({ mode: 'onChange', defaultValues: { pastMedicalHistory: [{ ...BLANK_ROW }] } });
  return <PastMedicalHistorySection control={form.control} register={form.register} yearBounds={bounds} />;
}

describe("PastMedicalHistorySection year diagnosed", () => {
  it('accepts a year between the birth year and the visit year', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const year = screen.getByLabelText(/year diagnosed, row 1/i);
    await user.type(year, '2019');

    expect(year).toHaveValue(2019);
    expect(year).not.toHaveAttribute('aria-invalid', 'true');
  });

  it("warns when the year is before the patient's birth year", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const year = screen.getByLabelText(/year diagnosed, row 1/i);
    await user.type(year, '1975');

    expect(screen.getByText("Before the patient's birth year (1979).")).toBeInTheDocument();
    expect(year).toHaveAttribute('aria-invalid', 'true');
    expect(year).toHaveAccessibleDescription("Before the patient's birth year (1979).");
  });

  it('warns on the right row when a later row is after the visit year', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: /add another condition/i }));
    await user.type(screen.getByLabelText(/year diagnosed, row 2/i), '2030');

    expect(screen.getByText("Can't be after 2026.")).toBeInTheDocument();
    expect(screen.getByLabelText(/year diagnosed, row 1/i)).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/year diagnosed, row 2/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it("leaves the range to the rule, so the browser's own popup never pre-empts the inline warning", () => {
    render(<Harness />);
    const year = screen.getByLabelText(/year diagnosed, row 1/i);

    expect(year).not.toHaveAttribute('min');
    expect(year).not.toHaveAttribute('max');
  });
});
