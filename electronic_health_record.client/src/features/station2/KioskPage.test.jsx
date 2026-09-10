import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import KioskShell from '../../components/layout/KioskShell';

describe('KioskShell', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders no navigation landmarks', () => {
    render(<KioskShell title="Health Assessment"><p>Body</p></KioskShell>);
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button', { name: /sign out|log ?out/i })).toBeNull();
  });

  it('pushes a history entry so back navigation has something to trap', () => {
    const pushState = vi.spyOn(window.history, 'pushState');
    render(<KioskShell title="Health Assessment"><p>Body</p></KioskShell>);
    expect(pushState).toHaveBeenCalled();
  });

  it('re-pushes the entry when the user attempts to go back', () => {
    render(<KioskShell title="Health Assessment"><p>Body</p></KioskShell>);
    const pushState = vi.spyOn(window.history, 'pushState');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(pushState).toHaveBeenCalled();
  });

  it('shows the progress indicator when given one', () => {
    render(<KioskShell title="T" progress="3 of 16 answered"><p>Body</p></KioskShell>);
    expect(screen.getByRole('status')).toHaveTextContent('3 of 16 answered');
  });
});
