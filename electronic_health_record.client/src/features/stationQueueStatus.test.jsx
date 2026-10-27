import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { getQueue } from '../api/forms.api';
import Station3QueuePage from './station3/Station3QueuePage';
import Station4QueuePage from './station4/Station4QueuePage';
import Station5QueuePage from './station5/Station5QueuePage';

vi.mock('../api/forms.api', () => ({ getQueue: vi.fn() }));

// Answers each `(max-width: Npx)` query as a viewport `width` px wide would.
function mockMatchMedia(width) {
  window.matchMedia = vi.fn((query) => ({
    matches: width <= Number(/max-width:\s*(\d+)px/.exec(query)[1]),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

// Desktop: these assert on table rows.
beforeEach(() => mockMatchMedia(1280));

function renderPage(Page) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Page />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const STATION_QUEUES = [
  { Page: Station3QueuePage, field: 'station3StartedAt', on: 'Consulting', off: 'Not yet consulted' },
  { Page: Station4QueuePage, field: 'station4StartedAt', on: 'Examining', off: 'Not yet examined' },
  { Page: Station5QueuePage, field: 'station5StartedAt', on: 'Examining', off: 'Not yet examined' },
];

const queueRows = (field) => [
  { formID: 1, [field]: '2026-10-01T02:10:00Z', patient: { surname: 'ABAN', firstName: 'QUEENIE' } },
  { formID: 2, [field]: null, patient: { surname: 'ABA-A', firstName: 'FELIX' } },
];

describe.each(STATION_QUEUES)('$Page.name status column', ({ Page, field, on, off }) => {
  it(`shows ${on} once the page was opened, ${off} otherwise`, async () => {
    getQueue.mockResolvedValue(queueRows(field));
    renderPage(Page);

    const startedRow = (await screen.findByText(/QUEENIE/)).closest('tr');
    const waitingRow = screen.getByText(/FELIX/).closest('tr');

    expect(within(startedRow).getByText(on)).toBeInTheDocument();
    expect(within(waitingRow).getByText(off)).toBeInTheDocument();
  });
});

// Same phone layout as Station 2's queue: the search box sits above the list,
// and the list is cards rather than a table.
describe.each(STATION_QUEUES)('$Page.name on a phone', ({ Page, field, on, off }) => {
  beforeEach(() => mockMatchMedia(390));

  it('lists the queue as cards under the search box', async () => {
    getQueue.mockResolvedValue(queueRows(field));
    renderPage(Page);

    const startedCard = await screen.findByRole('button', { name: /QUEENIE/ });
    const waitingCard = screen.getByRole('button', { name: /FELIX/ });

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by name or agency')).toBeInTheDocument();
    expect(within(startedCard).getByText(on)).toBeInTheDocument();
    expect(within(waitingCard).getByText(off)).toBeInTheDocument();
  });
});
