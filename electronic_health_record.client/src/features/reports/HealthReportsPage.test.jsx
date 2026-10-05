import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HealthReportsPage from './HealthReportsPage';
import { getSampleVitalsReport } from './sampleVitalsReport';

// The stat row comes first; "At-risk patients" also titles the table below.
const statValue = (label) => screen.getAllByText(label)[0].nextElementSibling;

async function pickOffice(user, name) {
  await user.click(screen.getByRole('button', { name: 'All offices' }));
  await user.click(screen.getByRole('option', { name }));
}

describe('HealthReportsPage', () => {
  it('says plainly that the figures are sample data', () => {
    render(<HealthReportsPage />);

    expect(screen.getByRole('note')).toHaveTextContent('Sample data.');
  });

  it('opens on every office', () => {
    render(<HealthReportsPage />);

    expect(statValue('Patients assessed')).toHaveTextContent('248');
    expect(statValue('Healthy BMI')).toHaveTextContent('33.1%');
    expect(statValue('High blood pressure')).toHaveTextContent('46.8%');
    expect(statValue('At-risk patients')).toHaveTextContent('14');
  });

  it('narrows every figure to the picked office', async () => {
    const user = userEvent.setup();
    render(<HealthReportsPage />);

    await pickOffice(user, 'PROVINCIAL ENGINEERING OFFICE');

    expect(statValue('Patients assessed')).toHaveTextContent('38');
    expect(statValue('Healthy BMI')).toHaveTextContent('23.7%');
    expect(statValue('At-risk patients')).toHaveTextContent('3');
  });

  it('keeps comparing every office in the heatmap, marking the picked one', async () => {
    const user = userEvent.setup();
    render(<HealthReportsPage />);

    await pickOffice(user, 'PROVINCIAL ENGINEERING OFFICE');

    const heatmap = screen.getAllByRole('table').at(-1);
    expect(within(heatmap).getAllByRole('row')).toHaveLength(9); // header + 8 offices
    const current = within(heatmap).getByRole('row', { current: true });
    expect(current).toHaveTextContent('PROVINCIAL ENGINEERING OFFICE');
  });

  it('says so when an office has no sample data', async () => {
    const user = userEvent.setup();
    render(<HealthReportsPage />);

    await pickOffice(user, 'PROVINCIAL LEGAL OFFICE');

    expect(screen.getByText(/No sample data for this office yet/)).toBeInTheDocument();
    expect(statValue('Patients assessed')).toHaveTextContent('0');
  });
});

describe('getSampleVitalsReport', () => {
  it('counts every patient once in both BMI and BP, for every office', () => {
    for (const { office } of getSampleVitalsReport(null).byOffice) {
      const r = getSampleVitalsReport(office);
      const bpTotal = Object.values(r.bp).reduce((a, b) => a + b, 0);
      expect(bpTotal, office).toBe(r.total);
    }
  });

  it('ends the trend on the snapshot the other cards show', () => {
    const r = getSampleVitalsReport(null);
    const last = r.trend.at(-1);

    expect(last.overweightPct).toBeCloseTo(((r.bmi.overweight + r.bmi.obese) / r.total) * 100, 1);
    expect(last.highBpPct).toBeCloseTo(((r.bp.stage1 + r.bp.stage2 + r.bp.crisis) / r.total) * 100, 1);
  });
});
