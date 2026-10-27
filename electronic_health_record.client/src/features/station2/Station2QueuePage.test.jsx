import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

// Answers each `(max-width: Npx)` query as a viewport `width` px wide would.
function mockMatchMedia(width) {
  window.matchMedia = vi.fn((query) => ({
    matches: width <= Number(/max-width:\s*(\d+)px/.exec(query)[1]),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

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
  beforeEach(() => mockMatchMedia(1280));

  it('shows Answering once the kiosk was opened, Not yet answered otherwise', async () => {
    renderPage();

    const answeringRow = (await screen.findByText(/QUEENIE/)).closest('tr');
    const waitingRow = screen.getByText(/FELIX/).closest('tr');

    expect(within(answeringRow).getByText('Answering')).toBeInTheDocument();
    expect(within(waitingRow).getByText('Not yet answered')).toBeInTheDocument();
  });
});

describe('Station2QueuePage on a phone', () => {
  beforeEach(() => mockMatchMedia(390));

  it('lists the queue as cards that open the patient preview', async () => {
    const user = userEvent.setup();
    renderPage();

    const answeringCard = await screen.findByRole('button', { name: /QUEENIE/ });
    const waitingCard = screen.getByRole('button', { name: /FELIX/ });

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(within(answeringCard).getByText('Answering')).toBeInTheDocument();
    expect(within(answeringCard).getByText('DOPMH')).toBeInTheDocument();
    expect(within(waitingCard).getByText('Not yet answered')).toBeInTheDocument();

    await user.click(answeringCard);

    expect(await screen.findByRole('button', { name: 'Hand to Patient' })).toBeInTheDocument();
  });
});
