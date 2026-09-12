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
      medications: [{ drug: '', dosage: '', frequency: '', price: '' }],
      lifestyleFollowUp: '',
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

  it('captures medication rows and the advice text separately', async () => {
    const user = userEvent.setup();
    let submitted;
    function Wrapper() {
      const form = useForm({
        defaultValues: {
          recommendedDiagnosticTest: '',
          impressionClinical: '',
          medications: [{ drug: '', dosage: '', frequency: '', price: '' }],
          lifestyleFollowUp: '',
        },
      });
      return (
        <form onSubmit={form.handleSubmit((v) => { submitted = v; })}>
          <AssessmentPlanSection {...form} />
          <button type="submit">go</button>
        </form>
      );
    }
    render(<Wrapper />);
    await user.type(screen.getByRole('textbox', { name: 'Medication (Generic), row 1' }), 'Losartan');
    await user.type(screen.getByRole('textbox', { name: 'Dosage, row 1' }), '50 mg');
    await user.type(screen.getByRole('textbox', { name: 'Frequency, row 1' }), 'Once daily');
    await user.type(screen.getByRole('spinbutton', { name: 'Price, row 1' }), '250');
    await user.type(
      screen.getByRole('textbox', { name: 'Lifestyle advice and follow-up' }),
      'Recheck BP in 4 weeks',
    );
    await user.click(screen.getByRole('button', { name: 'go' }));

    expect(submitted.medications[0]).toEqual({
      drug: 'Losartan', dosage: '50 mg', frequency: 'Once daily', price: '250',
    });
    expect(submitted.lifestyleFollowUp).toBe('Recheck BP in 4 weeks');
  });

  it('totals the medication prices, ignoring rows with no drug named', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByRole('textbox', { name: 'Medication (Generic), row 1' }), 'Losartan');
    await user.type(screen.getByRole('spinbutton', { name: 'Price, row 1' }), '250');
    await user.click(screen.getByRole('button', { name: 'Add another medication' }));
    await user.type(screen.getByRole('textbox', { name: 'Medication (Generic), row 2' }), 'Metformin');
    await user.type(screen.getByRole('spinbutton', { name: 'Price, row 2' }), '150');

    // A priced row with no drug named is not a prescription, so it is skipped.
    await user.click(screen.getByRole('button', { name: 'Add another medication' }));
    await user.type(screen.getByRole('spinbutton', { name: 'Price, row 3' }), '999');

    expect(screen.getByText('Medication Total').parentElement).toHaveTextContent('₱400.00');
  });

  it('adds and removes medication rows', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getByRole('textbox', { name: 'Medication (Generic), row 1' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add another medication' }));
    expect(screen.getByRole('textbox', { name: 'Medication (Generic), row 2' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove row 2' }));
    expect(screen.queryByRole('textbox', { name: 'Medication (Generic), row 2' })).not.toBeInTheDocument();
  });

  it('totals the prices of the checked tests', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    // CBC 180 + BT 100
    await user.click(screen.getByRole('checkbox', { name: 'CBC' }));
    await user.click(screen.getByRole('checkbox', { name: 'BT' }));
    expect(screen.getByText('₱280.00')).toBeInTheDocument();
  });

  it('stores an unpriced test bare until an amount is quoted', async () => {
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
    await user.click(screen.getByRole('checkbox', { name: 'ECG' }));
    await user.type(screen.getByRole('spinbutton', { name: 'Price for ECG' }), '500');
    await user.click(screen.getByRole('button', { name: 'go' }));
    expect(submitted.recommendedDiagnosticTest).toBe('ECG (500)');
  });

  it('adds a quoted price for an unpriced test into the total', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('checkbox', { name: 'CBC' }));
    await user.click(screen.getByRole('checkbox', { name: 'ECG' }));
    await user.type(screen.getByRole('spinbutton', { name: 'Price for ECG' }), '500');
    expect(screen.getByText('₱680.00')).toBeInTheDocument();
  });

  it('includes a typed other test and its price in the value and total', async () => {
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
    await user.click(screen.getByRole('checkbox', { name: 'Others (Please Specify)' }));
    await user.type(screen.getByRole('textbox', { name: 'Other diagnostic test, row 1' }), '2D Echo');
    await user.type(screen.getByRole('spinbutton', { name: 'Price, row 1' }), '1200');
    expect(screen.getByText('₱1,380.00')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'go' }));
    expect(submitted.recommendedDiagnosticTest).toBe('CBC, 2D Echo (1200)');
  });

  it('pre-checks a test saved under its former name', () => {
    render(<Harness defaultValues={{ recommendedDiagnosticTest: 'Liquid Profile, HVC' }} />);
    expect(screen.getByRole('checkbox', { name: 'Lipid Profile' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'HCV' })).toBeChecked();
  });

  it('restores a quoted price from a saved value', () => {
    const { container } = render(<Harness defaultValues={{ recommendedDiagnosticTest: 'ECG (500)' }} />);
    expect(screen.getByRole('checkbox', { name: 'ECG' })).toBeChecked();
    expect(screen.getByRole('spinbutton', { name: 'Price for ECG' })).toHaveValue(500);
    // The tile shows the quoted amount too, so the total is read by position
    // rather than by text.
    expect(container.querySelector('.tabular-nums.font-extrabold')).toHaveTextContent('₱500.00');
  });

  it('renders the thyroid panel as its own three-column row', () => {
    const { container } = render(<Harness />);
    const row = container.querySelector('.grid-cols-3');
    const names = [...row.querySelectorAll('input[type="checkbox"]')].map((el) =>
      el.getAttribute('aria-label'),
    );
    expect(names).toEqual(['TT3', 'TT4', 'TSH']);
  });

  it('keeps the thyroid panel in catalog order within the joined value', async () => {
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
    await user.click(screen.getByRole('checkbox', { name: 'TSH' }));
    await user.click(screen.getByRole('checkbox', { name: 'TT3' }));
    await user.click(screen.getByRole('checkbox', { name: 'ECG' }));
    await user.click(screen.getByRole('button', { name: 'go' }));
    expect(submitted.recommendedDiagnosticTest).toBe('TT3, TSH, ECG');
  });

  it('appends a typed other test after the catalog selections', async () => {
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
    await user.click(screen.getByRole('checkbox', { name: 'Others (Please Specify)' }));
    await user.type(screen.getByRole('textbox', { name: 'Other diagnostic test, row 1' }), '2D Echo');
    await user.click(screen.getByRole('button', { name: 'go' }));
    expect(submitted.recommendedDiagnosticTest).toBe('CBC, 2D Echo');
  });

  it('restores typed other rows from a value holding non-catalog entries', () => {
    render(<Harness defaultValues={{ recommendedDiagnosticTest: 'CBC, 2D Echo' }} />);
    expect(screen.getByRole('checkbox', { name: 'Others (Please Specify)' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Other diagnostic test, row 1' })).toHaveValue('2D Echo');
  });

  it('drops typed entries from the value when Others is unchecked', async () => {
    const user = userEvent.setup();
    let submitted;
    function Wrapper() {
      const form = useForm({
        defaultValues: { recommendedDiagnosticTest: 'CBC, 2D Echo', impressionClinical: '', managementTreatment: '' },
      });
      return (
        <form onSubmit={form.handleSubmit((v) => { submitted = v; })}>
          <AssessmentPlanSection {...form} />
          <button type="submit">go</button>
        </form>
      );
    }
    render(<Wrapper />);
    await user.click(screen.getByRole('checkbox', { name: 'Others (Please Specify)' }));
    await user.click(screen.getByRole('button', { name: 'go' }));
    expect(submitted.recommendedDiagnosticTest).toBe('CBC');
  });

  it('keeps multiple typed tests in row order', async () => {
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
    await user.click(screen.getByRole('checkbox', { name: 'Others (Please Specify)' }));
    await user.type(screen.getByRole('textbox', { name: 'Other diagnostic test, row 1' }), '2D Echo');
    await user.click(screen.getByRole('button', { name: 'Add another test' }));
    await user.type(screen.getByRole('textbox', { name: 'Other diagnostic test, row 2' }), 'Bone density scan');
    await user.click(screen.getByRole('button', { name: 'go' }));
    expect(submitted.recommendedDiagnosticTest).toBe('2D Echo, Bone density scan');
  });
});
