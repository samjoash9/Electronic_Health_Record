import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { getForm, startStation } from '../../api/forms.api';

const CATEGORY = {
  categoryID: 1,
  name: 'Mental Health',
  displayOrder: 1,
  questions: [{
    questionID: 1,
    questionText: 'How would you rate your current stress level?',
    displayOrder: 1,
    options: [
      { optionID: 11, optionText: 'None', score: 4, displayOrder: 1 },
      { optionID: 12, optionText: 'Mild', score: 3, displayOrder: 2 },
    ],
  }],
};

vi.mock('../../api/forms.api', () => ({
  getForm: vi.fn(),
  startStation: vi.fn(async () => ({})),
}));

vi.mock('../../api/assessment.api', () => ({
  getAssessmentTemplate: vi.fn(async () => [CATEGORY]),
}));

import KioskPage from './KioskPage';

function renderKiosk() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/station2/7/kiosk']}>
        <Routes>
          <Route path="/station2/:formId/kiosk" element={<KioskPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function formWith(overrides) {
  return {
    formID: 7,
    status: 'PendingAssessment',
    station2StartedAt: null,
    patient: { surname: 'ABAN', firstName: 'QUEENIE' },
    ...overrides,
  };
}

describe('KioskPage start-of-assessment marker', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('marks the form as answering and re-reads it for the new RowVersion', async () => {
    getForm.mockResolvedValue(formWith({}));
    renderKiosk();

    await waitFor(() => expect(startStation).toHaveBeenCalledWith(7, 2));
    await waitFor(() => expect(getForm).toHaveBeenCalledTimes(2));
  });

  it('does not mark a form that is already answering', async () => {
    getForm.mockResolvedValue(formWith({ station2StartedAt: '2026-10-01T02:10:00Z' }));
    renderKiosk();

    await screen.findByText('Wellness Assessment');
    expect(startStation).not.toHaveBeenCalled();
  });

  it('does not mark a form that has left Station 2', async () => {
    getForm.mockResolvedValue(formWith({ status: 'PendingConsultation' }));
    renderKiosk();

    await screen.findByText('Wellness Assessment');
    expect(startStation).not.toHaveBeenCalled();
  });
});
