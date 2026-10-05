import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api/forms.api', () => ({
  getActivityLogs: vi.fn(),
  deleteActivityLogs: vi.fn(),
}));

import { getActivityLogs, deleteActivityLogs } from '../../api/forms.api';
import ActivityLogsPage from './ActivityLogsPage';

const log = (logID, action, occurredAt) => ({
  logID,
  formID: 7,
  actorType: 'Admin',
  actorID: 1,
  actorName: 'System Developer',
  action,
  details: null,
  occurredAt,
  patient: { surname: 'ABAN', firstName: 'QUEENIE', middleName: null },
});

const LOGS = [
  log(3, 'FormReverted', '2026-10-01T08:20:00Z'),
  log(2, 'Station5Submitted', '2026-10-01T07:14:00Z'),
  log(1, 'Station9Approved', '2026-10-01T02:44:00Z'),
];

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ActivityLogsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ActivityLogsPage', () => {
  beforeEach(() => {
    getActivityLogs.mockReset();
    deleteActivityLogs.mockReset();
    getActivityLogs.mockResolvedValue(LOGS);
    deleteActivityLogs.mockResolvedValue({ deleted: 1 });
  });

  it('labels every action instead of showing its raw key', async () => {
    renderPage();

    expect(await screen.findByRole('cell', { name: 'Reverted Form' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Submitted Station 5 — Vision' })).toBeInTheDocument();
    // Not in the label map yet: still split into words.
    expect(screen.getByRole('cell', { name: 'Station 9 Approved' })).toBeInTheDocument();
    expect(screen.queryByText('FormReverted')).not.toBeInTheDocument();
  });

  it('deletes one entry from its row after confirming', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('cell', { name: 'Reverted Form' });

    await user.click(screen.getByRole('button', { name: 'Delete entry #3' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Delete this log entry?')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Delete permanently' }));

    await waitFor(() => expect(deleteActivityLogs).toHaveBeenCalledWith([3]));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(getActivityLogs).toHaveBeenCalledTimes(2);
  });

  it('deletes the ticked entries together', async () => {
    const user = userEvent.setup();
    deleteActivityLogs.mockResolvedValue({ deleted: 2 });
    renderPage();
    await screen.findByRole('cell', { name: 'Reverted Form' });

    await user.click(screen.getByRole('checkbox', { name: 'Select entry #3' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select entry #1' }));
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    // Ticking a box must not also open the row's detail modal.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Delete selected/ }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete permanently' }));

    await waitFor(() => expect(deleteActivityLogs).toHaveBeenCalledWith([3, 1]));
  });

  it('selects the whole page from the header box', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('cell', { name: 'Reverted Form' });

    await user.click(screen.getByRole('checkbox', { name: 'Select all entries on this page' }));

    expect(screen.getByText('3 selected')).toBeInTheDocument();
  });

  it('keeps the dialog open with the error when the delete fails', async () => {
    const user = userEvent.setup();
    deleteActivityLogs.mockRejectedValue(new Error('Forbidden'));
    renderPage();
    await screen.findByRole('cell', { name: 'Reverted Form' });

    await user.click(screen.getByRole('button', { name: 'Delete entry #2' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete permanently' }));

    expect(await within(screen.getByRole('dialog')).findByText('Forbidden')).toBeInTheDocument();
  });
});
