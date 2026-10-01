import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { getQueue } from '../api/forms.api';
import Station3QueuePage from './station3/Station3QueuePage';
import Station4QueuePage from './station4/Station4QueuePage';
import Station5QueuePage from './station5/Station5QueuePage';

vi.mock('../api/forms.api', () => ({ getQueue: vi.fn() }));

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

describe.each([
  { Page: Station3QueuePage, field: 'station3StartedAt', on: 'Consulting', off: 'Not yet consulted' },
  { Page: Station4QueuePage, field: 'station4StartedAt', on: 'Examining', off: 'Not yet examined' },
  { Page: Station5QueuePage, field: 'station5StartedAt', on: 'Examining', off: 'Not yet examined' },
])('$Page.name status column', ({ Page, field, on, off }) => {
  it(`shows ${on} once the page was opened, ${off} otherwise`, async () => {
    getQueue.mockResolvedValue([
      { formID: 1, [field]: '2026-10-01T02:10:00Z', patient: { surname: 'ABAN', firstName: 'QUEENIE' } },
      { formID: 2, [field]: null, patient: { surname: 'ABA-A', firstName: 'FELIX' } },
    ]);
    renderPage(Page);

    const startedRow = (await screen.findByText(/QUEENIE/)).closest('tr');
    const waitingRow = screen.getByText(/FELIX/).closest('tr');

    expect(within(startedRow).getByText(on)).toBeInTheDocument();
    expect(within(waitingRow).getByText(off)).toBeInTheDocument();
  });
});
