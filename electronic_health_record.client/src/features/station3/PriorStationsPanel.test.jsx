import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { db } from '../../api/mock/db';
import PriorStationsPanel from './PriorStationsPanel';

vi.mock('../../api/patients.api', () => ({
  getPatientVisitHistory: vi.fn().mockResolvedValue([]),
}));

const categories = db.read().assessmentCategories;

const form = {
  formID: 1,
  patientID: 1,
  station1SubmittedAt: '2026-10-01T09:00:00Z',
  station2SubmittedAt: '2026-10-01T09:30:00Z',
  bpSystolic: 118,
  bpDiastolic: 76,
  heartRate: 72,
  respRate: 16,
  tempCelsius: 36.8,
  weightKg: 78,
  heightCm: 165,
  bmi: 28.7,
  idealBMI: 20.7,
  assessmentAnswers: categories.flatMap((c) => c.questions).map((q) => ({
    questionID: q.questionID,
    optionID: q.options[0].optionID,
  })),
};

function renderPanel(props = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PriorStationsPanel form={form} categories={categories} {...props} />
    </QueryClientProvider>
  );
}

const stationButton = (name) => screen.getByRole('button', { name: new RegExp(name) });

describe('PriorStationsPanel', () => {
  it('heads Stations 1 and 2 with their station headers', () => {
    renderPanel();

    expect(stationButton('Vital signs')).toBeInTheDocument();
    expect(stationButton('Assessment')).toBeInTheDocument();
  });

  it('opens Station 1 onto the vitals detail', () => {
    renderPanel();

    fireEvent.click(stationButton('Vital signs'));

    expect(screen.getByRole('heading', { name: 'Body measurements' })).toBeInTheDocument();
  });

  it('attaches the scroll refs a patient record page jumps to', () => {
    const station1Ref = createRef();
    const station2HeaderRef = createRef();
    const station2SpiritualRef = createRef();
    renderPanel({ station1Ref, station2HeaderRef, station2SpiritualRef });

    expect(station1Ref.current).toContainElement(stationButton('Vital signs'));

    fireEvent.click(stationButton('Assessment'));

    expect(station2HeaderRef.current).not.toBeNull();
    expect(station2SpiritualRef.current).not.toBeNull();
  });
});
