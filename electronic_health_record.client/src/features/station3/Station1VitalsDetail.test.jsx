import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Station1VitalsDetail from './Station1VitalsDetail';

const recorded = {
  bpSystolic: 118,
  bpDiastolic: 76,
  heartRate: 72,
  respRate: 16,
  tempCelsius: 36.8,
  weightKg: 78,
  heightCm: 165,
  bmi: 28.7,
  idealBMI: 20.7,
};

const empty = {
  bpSystolic: null,
  bpDiastolic: null,
  heartRate: null,
  respRate: null,
  tempCelsius: null,
  weightKg: null,
  heightCm: null,
  bmi: null,
  idealBMI: null,
};

describe('Station1VitalsDetail', () => {
  it('shows each reading with its unit, grouped as vital signs and body measurements', () => {
    render(<Station1VitalsDetail form={recorded} />);

    expect(screen.getByRole('heading', { name: 'Vital signs' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Body measurements' })).toBeInTheDocument();
    expect(screen.getByText('118/76')).toBeInTheDocument();
    expect(screen.getByText('mmHg')).toBeInTheDocument();
    expect(screen.getByText('72')).toBeInTheDocument();
    expect(screen.getByText('beats/min')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('breaths/min')).toBeInTheDocument();
    expect(screen.getByText('36.8')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText('165')).toBeInTheDocument();
  });

  it('classifies BMI on the Asia-Pacific cutoffs and keys the scale against ideal and normal', () => {
    render(<Station1VitalsDetail form={recorded} />);

    expect(screen.getByText('28.7')).toBeInTheDocument();
    expect(screen.getByText('Obese')).toBeInTheDocument();
    expect(screen.getByText('This patient, 28.7')).toBeInTheDocument();
    expect(screen.getByText('Ideal BMI, 20.7')).toBeInTheDocument();
    expect(screen.getByText('Normal range 18.5 to 22.9')).toBeInTheDocument();
  });

  it('dashes out missing readings and drops the BMI scale when nothing was recorded', () => {
    render(<Station1VitalsDetail form={empty} />);

    expect(screen.getAllByText('—')).toHaveLength(7);
    expect(screen.queryByText('mmHg')).not.toBeInTheDocument();
    expect(screen.queryByText(/This patient/)).not.toBeInTheDocument();
  });
});
