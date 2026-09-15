import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isFormDoneAtStation, useStationFormGuard } from './useStationFormGuard';
import { useWellnessForm } from './useWellnessForm';
import { FORM_STATUS, STATIONS } from '../lib/constants';

describe('isFormDoneAtStation', () => {
  it('keeps the form while it is this desk\'s work', () => {
    expect(isFormDoneAtStation({ status: FORM_STATUS.PENDING_DENTAL }, STATIONS.FOUR)).toBe(false);
  });

  it('treats a status behind this desk as a stale read, not finished work', () => {
    // Station 3 hands off to Station 4; the cached form can still say
    // PendingConsultation for as long as the app-wide staleTime allows.
    expect(isFormDoneAtStation({ status: FORM_STATUS.PENDING_CONSULTATION }, STATIONS.FOUR)).toBe(false);
    expect(isFormDoneAtStation({ status: FORM_STATUS.PENDING_ASSESSMENT }, STATIONS.FOUR)).toBe(false);
    expect(isFormDoneAtStation({ status: FORM_STATUS.PENDING_CONSULTATION }, STATIONS.FIVE)).toBe(false);
  });

  it('reports done once the form has moved past this desk', () => {
    expect(isFormDoneAtStation({ status: FORM_STATUS.PENDING_VISION }, STATIONS.FOUR)).toBe(true);
    expect(isFormDoneAtStation({ status: FORM_STATUS.COMPLETED }, STATIONS.FOUR)).toBe(true);
    expect(isFormDoneAtStation({ status: FORM_STATUS.PENDING_DENTAL }, STATIONS.THREE)).toBe(true);
  });

  it('reports done for a cancelled or unrecognised status', () => {
    expect(isFormDoneAtStation({ status: FORM_STATUS.CANCELLED }, STATIONS.FOUR)).toBe(true);
    expect(isFormDoneAtStation({ status: 'SomethingNew' }, STATIONS.FOUR)).toBe(true);
  });

  it('never reports done while the form is still loading', () => {
    expect(isFormDoneAtStation(undefined, STATIONS.FOUR)).toBe(false);
    expect(isFormDoneAtStation({ status: null }, STATIONS.FOUR)).toBe(false);
  });
});

function Station4() {
  const { data: form } = useWellnessForm('7');
  useStationFormGuard(form, STATIONS.FOUR);
  return <div>STATION 4 PAGE</div>;
}

function Harness({ client }) {
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/station4/7']}>
        <Routes>
          <Route path="/station4/:formId" element={<Station4 />} />
          <Route path="/forms/:formId" element={<div>FORMS PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// Mirrors App.jsx's staleTime, which is what let a just-handed-off form be
// read from cache with the previous station's status still on it.
function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 10_000 } },
  });
}

describe('useStationFormGuard against a warm cache', () => {
  it('stays on the station page when the cached status is one station behind', async () => {
    const client = makeClient();
    client.setQueryData(['form', 7], { formID: 7, status: FORM_STATUS.PENDING_CONSULTATION });

    render(<Harness client={client} />);

    await waitFor(() => {
      expect(screen.getByText('STATION 4 PAGE')).toBeInTheDocument();
    });
    expect(screen.queryByText('FORMS PAGE')).not.toBeInTheDocument();
  });

  it('still redirects a form this desk has genuinely finished', async () => {
    const client = makeClient();
    client.setQueryData(['form', 7], { formID: 7, status: FORM_STATUS.PENDING_VISION });

    render(<Harness client={client} />);

    await waitFor(() => {
      expect(screen.getByText('FORMS PAGE')).toBeInTheDocument();
    });
  });
});
