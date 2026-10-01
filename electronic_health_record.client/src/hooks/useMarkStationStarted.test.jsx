import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { startStation } from '../api/forms.api';
import { FORM_STATUS, STATIONS } from '../lib/constants';
import { useMarkStationStarted } from './useMarkStationStarted';

vi.mock('../api/forms.api', () => ({
  startStation: vi.fn(async () => ({})),
}));

function render(form, station) {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const hook = renderHook(({ f }) => useMarkStationStarted(f, station), {
    wrapper,
    initialProps: { f: form },
  });
  return { ...hook, invalidate };
}

const DESKS = [
  { station: STATIONS.THREE, open: FORM_STATUS.PENDING_CONSULTATION, previous: FORM_STATUS.PENDING_ASSESSMENT },
  { station: STATIONS.FOUR, open: FORM_STATUS.PENDING_DENTAL, previous: FORM_STATUS.PENDING_CONSULTATION },
  { station: STATIONS.FIVE, open: FORM_STATUS.PENDING_VISION, previous: FORM_STATUS.PENDING_DENTAL },
];

describe.each(DESKS)('useMarkStationStarted at station $station', ({ station, open, previous }) => {
  beforeEach(() => vi.clearAllMocks());

  it('marks an unstarted form and re-reads it for the new RowVersion', async () => {
    const { invalidate } = render({ formID: 9, status: open }, station);

    await waitFor(() => expect(startStation).toHaveBeenCalledWith(9, station));
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['form', 9] }));
  });

  it('skips a form this desk already started', () => {
    render({ formID: 9, status: open, [`station${station}StartedAt`]: '2026-10-01T02:00:00Z' }, station);
    expect(startStation).not.toHaveBeenCalled();
  });

  it('waits out a stale cached status, then marks once the fresh read lands', async () => {
    const { rerender } = render({ formID: 9, status: previous }, station);
    expect(startStation).not.toHaveBeenCalled();

    rerender({ f: { formID: 9, status: open } });
    await waitFor(() => expect(startStation).toHaveBeenCalledWith(9, station));
  });
});
