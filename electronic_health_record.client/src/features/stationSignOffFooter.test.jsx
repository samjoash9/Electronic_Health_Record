import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { saveDraft as saveStation3Draft } from '../lib/station3Draft';
import { saveDraft as saveStation4Draft } from '../lib/station4Draft';
import { saveDraft as saveStation5Draft } from '../lib/station5Draft';

const FORM = {
  formID: 42,
  rowVersion: 'AAAA',
  formDate: '2026-10-08T00:00:00',
  patient: {
    surname: 'DELA CRUZ', firstName: 'JUAN', birthdate: '1979-02-08',
    position: 'Clerk', agencyOffice: 'PHO', sex: 'Male',
  },
};

vi.mock('../hooks/useWellnessForm', () => ({
  useWellnessForm: () => ({ data: FORM, isLoading: false, error: null, refetch: vi.fn() }),
}));
vi.mock('../api/assessment.api', () => ({ getAssessmentTemplate: vi.fn(async () => []) }));
vi.mock('../api/onboarding.api', () => ({
  listPhysicians: vi.fn(async () => [
    { physicianID: 7, firstName: 'Ana', surname: 'Reyes', prcLicenseNo: '0012345', isActive: true, station: 3 },
    { physicianID: 8, firstName: 'Ben', surname: 'Cruz', prcLicenseNo: '0023456', isActive: true, station: 4 },
    { physicianID: 9, firstName: 'Cora', surname: 'Lim', prcLicenseNo: '0034567', isActive: true, station: 5 },
  ]),
}));
vi.mock('../api/forms.api', () => ({
  submitStation3: vi.fn(async () => ({})),
  submitStation4: vi.fn(async () => ({})),
  submitStation5: vi.fn(async () => ({})),
}));
vi.mock('../hooks/useStationFormGuard', () => ({ useStationFormGuard: () => false }));
vi.mock('../hooks/useMarkStationStarted', () => ({ useMarkStationStarted: () => {} }));
vi.mock('../hooks/useUnsavedChangesGuard', () => ({
  useUnsavedChangesGuard: () => ({ state: 'unblocked' }),
}));
// An admin, so no signer is preselected: a doctor starts on themselves.
vi.mock('../auth/useAuth', () => ({ useAuth: () => ({ user: { id: 1, role: 'admin' } }) }));
vi.mock('react-toastify', () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));
// The panel fetches visit history and the signature pad needs a real canvas;
// the signer and signature are seeded by the draft instead.
vi.mock('./station3/PriorStationsPanel', () => ({ default: () => null }));
vi.mock('./station3/PhysicianSignature', () => ({ default: () => null }));

import Station3ConsultationPage from './station3/Station3ConsultationPage';
import Station4DentalPage from './station4/Station4DentalPage';
import Station5VisionPage from './station5/Station5VisionPage';

const SIGNATURE = 'data:image/png;base64,AAAA';

const STATION_PAGES = [
  {
    name: 'Station 3',
    Page: Station3ConsultationPage,
    station: 3,
    noSigner: 'Select the attending physician.',
    seed: (signerID, signature) => saveStation3Draft('42', { signature, physicianID: signerID }),
    signerID: 7,
  },
  {
    name: 'Station 4',
    Page: Station4DentalPage,
    station: 4,
    noSigner: 'Select the examining dentist.',
    seed: (signerID, signature) => saveStation4Draft('42', { signature, dentistID: signerID }),
    signerID: 8,
  },
  {
    name: 'Station 5',
    Page: Station5VisionPage,
    station: 5,
    noSigner: 'Select the examining optometrist.',
    seed: (signerID, signature) => saveStation5Draft('42', { signature, optometristID: signerID }),
    signerID: 9,
  },
];

const NO_SIGNATURE = 'A signature is required before submitting.';

function renderPage(Page, station) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/station${station}/42`]}>
        <Routes>
          <Route path={`/station${station}/:formId`} element={<Page />} />
          <Route path={`/station${station}`} element={<p>Patient list</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const submitButton = () => screen.getByRole('button', { name: /sign and complete/i });

describe.each(STATION_PAGES)('$name sign-off footer', ({
  Page, station, noSigner, seed, signerID,
}) => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('asks for the signer first, and holds the submit until then', () => {
    renderPage(Page, station);

    expect(screen.getByText(noSigner)).toBeInTheDocument();
    expect(screen.queryByText(NO_SIGNATURE)).not.toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  it('asks for the signature once a signer is chosen', () => {
    seed(signerID, null);
    renderPage(Page, station);

    expect(screen.getByText(NO_SIGNATURE)).toBeInTheDocument();
    expect(screen.queryByText(noSigner)).not.toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  it('clears the notes and enables the submit once both are in, keeping the draft time', () => {
    seed(signerID, SIGNATURE);
    renderPage(Page, station);

    expect(screen.queryByText(noSigner)).not.toBeInTheDocument();
    expect(screen.queryByText(NO_SIGNATURE)).not.toBeInTheDocument();
    expect(screen.getByText(/^Draft saved /)).toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
  });

  it('keeps Back named for assistive tech, though a phone shows only its arrow', async () => {
    const user = userEvent.setup();
    renderPage(Page, station);

    const back = screen.getByRole('button', { name: 'Back to Patient List' });
    expect(screen.getByText('Back to Patient List')).toHaveClass('max-md:sr-only');

    await user.click(back);
    expect(screen.getByText('Patient list')).toBeInTheDocument();
  });
});
