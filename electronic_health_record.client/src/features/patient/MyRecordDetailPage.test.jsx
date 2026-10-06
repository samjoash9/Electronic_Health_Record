import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FORM_STATUS } from '../../lib/constants';
import MyRecordDetailPage from './MyRecordDetailPage';

const at = '2026-10-06T05:36:00Z';

const form = {
  formID: 7,
  patientID: 3,
  status: FORM_STATUS.COMPLETED,
  formDate: '2026-10-06T00:00:00',
  patient: {
    firstName: 'Maria',
    surname: 'Santos',
    birthdate: '1990-04-12',
    position: 'Clerk',
    agencyOffice: 'Regional Office',
  },
  station1SubmittedAt: at,
  station2SubmittedAt: at,
  assessmentAnswers: [],
  signedAt: at,
  physician: { firstName: 'Diana', surname: 'Caingat', prcLicenseNo: '6154763' },
  familyMedicalHistory: [],
  pastMedicalHistory: [],
  socialHistory: null,
  exercise: [],
  dentalSignedAt: at,
  dentist: { firstName: 'Ramon', surname: 'Dizon', prcLicenseNo: '1122334' },
  dentalAssessment: { oralHygieneStatus: 'Good' },
  visionSignedAt: at,
  optometrist: { firstName: 'Lea', surname: 'Reyes', prcLicenseNo: '5566778' },
  visionAssessment: { visualAcuityRightEye: '20/20', visualAcuityLeftEye: '20/25' },
};

vi.mock('../../hooks/useWellnessForm', () => ({
  useWellnessForm: () => ({ data: form, isLoading: false, error: null, refetch: vi.fn() }),
}));

vi.mock('../../api/assessment.api', () => ({
  getAssessmentTemplate: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../api/patients.api', () => ({
  getPatientVisitHistory: vi.fn().mockResolvedValue([]),
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/my-record/7']}>
        <Routes>
          <Route path="/my-record/:formId" element={<MyRecordDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const stationButton = (name) => screen.getByRole('button', { name: new RegExp(name) });

describe('MyRecordDetailPage', () => {
  it('heads the record with the patient and the form status, as the Forms page does', () => {
    renderPage();

    // The name sits beside the status badge in the card's header row.
    const headerRow = screen.getByText('Santos, Maria').parentElement.parentElement;
    expect(within(headerRow).getByText('Completed')).toBeInTheDocument();
  });

  it('shows Stations 3 to 5 as the same collapsed station cards the Forms page uses', () => {
    renderPage();

    for (const title of ['Consultation', 'Dental assessment', 'Vision assessment']) {
      expect(stationButton(title)).toHaveAttribute('aria-expanded', 'false');
    }
    expect(screen.queryByText('Family Medical History')).not.toBeInTheDocument();
  });

  it('opens each station onto its record and sign-off', () => {
    renderPage();

    fireEvent.click(stationButton('Dental assessment'));
    expect(screen.getByText('Examining dentist')).toBeInTheDocument();
    expect(screen.getByText('Dr. Ramon Dizon')).toBeInTheDocument();

    fireEvent.click(stationButton('Vision assessment'));
    expect(screen.getByText('Examining optometrist')).toBeInTheDocument();
    expect(screen.getByText('Dr. Lea Reyes')).toBeInTheDocument();
  });
});
