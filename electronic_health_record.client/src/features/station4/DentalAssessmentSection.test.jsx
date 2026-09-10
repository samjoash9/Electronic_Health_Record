import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import DentalAssessmentSection from './DentalAssessmentSection';
import { DENTAL_INDICATORS } from '../../lib/constants';

function Harness({ onValues }) {
  const { control, register, watch } = useForm({
    defaultValues: {
      dentalAssessment: Object.fromEntries(
        DENTAL_INDICATORS.flatMap((i) => [[i.name, null], [`${i.name}Remarks`, '']]),
      ),
    },
  });
  onValues?.(watch);
  return <DentalAssessmentSection control={control} register={register} />;
}

describe('DentalAssessmentSection', () => {
  it('renders a radiogroup for every indicator', () => {
    render(<Harness />);
    for (const indicator of DENTAL_INDICATORS) {
      expect(screen.getByRole('radiogroup', { name: indicator.label })).toBeInTheDocument();
    }
  });

  it('renders every option of every indicator', () => {
    render(<Harness />);
    for (const indicator of DENTAL_INDICATORS) {
      const group = screen.getByRole('radiogroup', { name: indicator.label });
      for (const option of indicator.options) {
        expect(within(group).getByRole('radio', { name: option })).toBeInTheDocument();
      }
    }
  });

  it('renders a remarks field for every indicator', () => {
    render(<Harness />);
    for (const indicator of DENTAL_INDICATORS) {
      expect(
        screen.getByRole('textbox', { name: `Remarks for the doctor — ${indicator.label}` }),
      ).toBeInTheDocument();
    }
  });

  it('selects an option when clicked', async () => {
    const user = userEvent.setup();
    let watch;
    render(<Harness onValues={(w) => { watch = w; }} />);
    const group = screen.getByRole('radiogroup', { name: 'Oral Hygiene Status' });
    await user.click(within(group).getByRole('radio', { name: 'Fair' }));
    expect(watch('dentalAssessment.oralHygieneStatus')).toBe('Fair');
  });

  it('accepts remarks text', async () => {
    const user = userEvent.setup();
    let watch;
    render(<Harness onValues={(w) => { watch = w; }} />);
    await user.type(
      screen.getByRole('textbox', { name: 'Remarks for the doctor — Gum Condition' }),
      'Bleeding on probing',
    );
    expect(watch('dentalAssessment.gumConditionRemarks')).toBe('Bleeding on probing');
  });
});
