import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import AssessmentPlanSection from './AssessmentPlanSection';

function Harness({ defaultValues }) {
  const form = useForm({
    defaultValues: {
      recommendedDiagnosticTest: '',
      impressionClinical: '',
      managementTreatment: '',
      ...defaultValues,
    },
  });
  return <AssessmentPlanSection {...form} />;
}

describe('AssessmentPlanSection', () => {
  it('renders every diagnostic test as an unchecked checkbox', () => {
    render(<Harness />);
    for (const name of ['CBC', 'FBS', 'Chest Xray', 'Papsmear']) {
      expect(screen.getByRole('checkbox', { name })).not.toBeChecked();
    }
  });

  it('sets the field to the label when a single test is checked', async () => {
    const user = userEvent.setup();
    let submitted;
    function Wrapper() {
      const form = useForm({
        defaultValues: { recommendedDiagnosticTest: '', impressionClinical: '', managementTreatment: '' },
      });
      return (
        <form onSubmit={form.handleSubmit((v) => { submitted = v; })}>
          <AssessmentPlanSection {...form} />
          <button type="submit">go</button>
        </form>
      );
    }
    render(<Wrapper />);
    await user.click(screen.getByRole('checkbox', { name: 'CBC' }));
    await user.click(screen.getByRole('button', { name: 'go' }));
    expect(submitted.recommendedDiagnosticTest).toBe('CBC');
  });

  it('joins multiple checked tests in list order regardless of click order', async () => {
    const user = userEvent.setup();
    let submitted;
    function Wrapper() {
      const form = useForm({
        defaultValues: { recommendedDiagnosticTest: '', impressionClinical: '', managementTreatment: '' },
      });
      return (
        <form onSubmit={form.handleSubmit((v) => { submitted = v; })}>
          <AssessmentPlanSection {...form} />
          <button type="submit">go</button>
        </form>
      );
    }
    render(<Wrapper />);
    await user.click(screen.getByRole('checkbox', { name: 'FBS' }));
    await user.click(screen.getByRole('checkbox', { name: 'CBC' }));
    await user.click(screen.getByRole('button', { name: 'go' }));
    expect(submitted.recommendedDiagnosticTest).toBe('CBC, FBS');
  });

  it('removes a test from the joined string when unchecked, keeping the rest', async () => {
    const user = userEvent.setup();
    let submitted;
    function Wrapper() {
      const form = useForm({
        defaultValues: { recommendedDiagnosticTest: '', impressionClinical: '', managementTreatment: '' },
      });
      return (
        <form onSubmit={form.handleSubmit((v) => { submitted = v; })}>
          <AssessmentPlanSection {...form} />
          <button type="submit">go</button>
        </form>
      );
    }
    render(<Wrapper />);
    const cbc = screen.getByRole('checkbox', { name: 'CBC' });
    await user.click(cbc);
    await user.click(screen.getByRole('checkbox', { name: 'FBS' }));
    await user.click(cbc);
    await user.click(screen.getByRole('button', { name: 'go' }));
    expect(submitted.recommendedDiagnosticTest).toBe('FBS');
  });

  it('pre-checks boxes from an existing comma-joined value', () => {
    render(<Harness defaultValues={{ recommendedDiagnosticTest: 'CBC, FBS' }} />);
    expect(screen.getByRole('checkbox', { name: 'CBC' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'FBS' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'BT' })).not.toBeChecked();
  });
});
