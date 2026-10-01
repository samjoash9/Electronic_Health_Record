import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api/forms.api', () => ({
  getQueue: vi.fn(async () => [
    {
      formID: 1,
      station1SubmittedAt: '2026-10-01T02:00:00Z',
      station2StartedAt: '2026-10-01T02:10:00Z',
      patient: { surname: 'ABAN', firstName: 'QUEENIE', agencyOffice: 'DOPMH' },
    },
    {
      formID: 2,
      station1SubmittedAt: '2026-10-01T02:05:00Z',
      station2StartedAt: null,
      patient: { surname: 'ABA-A', firstName: 'FELIX', agencyOffice: 'PGSO' },
    },
  ]),
}));

import Station2QueuePage from './Station2QueuePage';

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Station2QueuePage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Station2QueuePage status column', () => {
  it('shows Answering once the kiosk was opened, Not yet answered otherwise', async () => {
    renderPage();

    const answeringRow = (await screen.findByText(/QUEENIE/)).closest('tr');
    const waitingRow = screen.getByText(/FELIX/).closest('tr');

    expect(within(answeringRow).getByText('Answering')).toBeInTheDocument();
    expect(within(waitingRow).getByText('Not yet answered')).toBeInTheDocument();
  });
});
