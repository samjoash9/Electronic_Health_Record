import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StationStepIndicator from './StationStepIndicator';

const STEPS = ['Search Employee', 'Confirm Information', 'Vital Signs'];

function renderIndicator(props = {}) {
  const onSelect = vi.fn();
  render(
    <StationStepIndicator steps={STEPS} current={2} unlockedUpTo={2} onSelect={onSelect} {...props} />
  );
  return onSelect;
}

describe('StationStepIndicator', () => {
  it('labels every circle under it and has no caption', () => {
    renderIndicator();

    STEPS.forEach((step) => expect(screen.getByText(step)).toBeInTheDocument());
    expect(screen.queryByText(/Step \d of \d/)).not.toBeInTheDocument();
  });

  it('opens an unlocked step and keeps a locked one out of reach', async () => {
    const user = userEvent.setup();
    const onSelect = renderIndicator();

    await user.click(screen.getByRole('button', { name: /Search Employee/ }));
    expect(onSelect).toHaveBeenCalledWith(1);

    const locked = screen.getByRole('button', { name: /Vital Signs/ });
    expect(locked).toBeDisabled();
    await user.click(locked);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe('StationStepIndicator compact', () => {
  it('names each circle for assistive tech, since no label is on screen', () => {
    renderIndicator({ compact: true });

    STEPS.forEach((step) => {
      expect(screen.getByRole('button', { name: step })).toBeInTheDocument();
    });
    // The only visible step name is the caption's.
    expect(screen.queryByText('Search Employee')).not.toBeInTheDocument();
    expect(screen.queryByText('Vital Signs')).not.toBeInTheDocument();
  });

  it('names the current step once, under the row', () => {
    renderIndicator({ compact: true });

    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('Confirm Information')).toBeInTheDocument();
  });

  it('drops the caption when captioned is false', () => {
    renderIndicator({ compact: true, captioned: false });

    expect(screen.queryByText('Step 2 of 3')).not.toBeInTheDocument();
    expect(screen.queryByText('Confirm Information')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm Information' })).toBeInTheDocument();
  });

  it('still locks steps past unlockedUpTo', () => {
    renderIndicator({ compact: true });

    expect(screen.getByRole('button', { name: 'Vital Signs' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Search Employee' })).toBeEnabled();
  });
});
