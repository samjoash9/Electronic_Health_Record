import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { toast } from 'react-toastify';
import { saveDraft } from '../../lib/station3Draft';
import { DEFAULT_CONSULTATION_VALUES } from '../../lib/station3Payload';
import { submitStation3 } from '../../api/forms.api';

const FORM = {
  formID: 42,
  rowVersion: 'AAAA',
  formDate: '2026-10-08T00:00:00',
  patient: {
    surname: 'DELA CRUZ', firstName: 'JUAN', birthdate: '1979-02-08',
    position: 'Clerk', agencyOffice: 'PHO', sex: 'Male',
  },
};

vi.mock('../../hooks/useWellnessForm', () => ({
  useWellnessForm: () => ({ data: FORM, isLoading: false, error: null, refetch: vi.fn() }),
}));
vi.mock('../../api/assessment.api', () => ({ getAssessmentTemplate: vi.fn(async () => []) }));
vi.mock('../../api/onboarding.api', () => ({
  listPhysicians: vi.fn(async () => [
    { physicianID: 7, firstName: 'Ana', surname: 'Reyes', prcLicenseNo: '0012345', isActive: true, station: 3 },
  ]),
}));
vi.mock('../../api/forms.api', () => ({ submitStation3: vi.fn(async () => ({})) }));
vi.mock('../../hooks/useStationFormGuard', () => ({ useStationFormGuard: () => false }));
vi.mock('../../hooks/useMarkStationStarted', () => ({ useMarkStationStarted: () => {} }));
vi.mock('../../hooks/useUnsavedChangesGuard', () => ({
  useUnsavedChangesGuard: () => ({ state: 'unblocked' }),
}));
vi.mock('../../auth/useAuth', () => ({ useAuth: () => ({ user: { id: 7, role: 'Doctor' } }) }));
vi.mock('react-toastify', () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));
// Neither is what these tests exercise: the panel fetches visit history, and
// the signature pad needs a real canvas. The signature is seeded by the draft.
vi.mock('./PriorStationsPanel', () => ({ default: () => null }));
vi.mock('./PhysicianSignature', () => ({ default: () => null }));

import Station3ConsultationPage from './Station3ConsultationPage';

/** A restored draft that is otherwise ready to sign, with the given exercise year. */
function seedDraft(exerciseYearStarted) {
  saveDraft(String(FORM.formID), {
    values: {
      ...DEFAULT_CONSULTATION_VALUES,
      exercise: [{ exerciseType: 'Jogging', exerciseFrequency: 'Daily', exerciseYearStarted }],
    },
    signature: 'data:image/png;base64,AAAA',
    physicianID: 7,
  });
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/station3/${FORM.formID}`]}>
        <Routes>
          <Route path="/station3/:formId" element={<Station3ConsultationPage />} />
          <Route path="/station3" element={<p>Station 3 queue</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Station3ConsultationPage year validation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // jsdom has no layout, so scrolling is only observable as a call.
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('warns as soon as a year falls outside the birth-to-visit range', async () => {
    seedDraft('');
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/year diagnosed, row 1/i), '2030');

    expect(screen.getByText("Can't be after 2026.")).toBeInTheDocument();
  });

  it('blocks Sign and Complete and brings the first bad year into view', async () => {
    seedDraft('1970');
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /sign and complete/i }));

    expect(await screen.findByText("Before the patient's birth year (1979).")).toBeInTheDocument();
    const year = screen.getByLabelText(/year started, row 1/i);
    await waitFor(() => expect(year).toHaveFocus());
    expect(year.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: 'center' }));
    expect(toast.error).toHaveBeenCalledWith('Fix the highlighted year before submitting.');
    expect(submitStation3).not.toHaveBeenCalled();
  });

  it('ignores a stale year left in a smoking block that is no longer shown', async () => {
    // Unticking Cigarette hides its fields and the payload sends them as null,
    // so a bad year still sitting in them must not block the submit.
    saveDraft(String(FORM.formID), {
      values: {
        ...DEFAULT_CONSULTATION_VALUES,
        socialHistory: {
          ...DEFAULT_CONSULTATION_VALUES.socialHistory,
          smokes: false, smokesCigarette: true, cigaretteYearStarted: '1970',
        },
      },
      signature: 'data:image/png;base64,AAAA',
      physicianID: 7,
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /sign and complete/i }));

    await waitFor(() => expect(submitStation3).toHaveBeenCalledTimes(1));
  });

  it('submits once every year is within range', async () => {
    seedDraft('2000');
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /sign and complete/i }));

    await waitFor(() => expect(submitStation3).toHaveBeenCalledTimes(1));
  });
});
