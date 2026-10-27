import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from './Select';

const OPTIONS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  'PROVINCIAL HEALTH OFFICE',
];

// jsdom has no layout, so every element measures 0x0 unless told otherwise.
function placeTrigger(container, right) {
  container.firstChild.getBoundingClientRect = () => ({ right });
}

describe('Select', () => {
  it('shows a placeholder until a value is picked', () => {
    render(<Select options={OPTIONS} />);

    expect(screen.getByRole('button', { name: 'Select…' })).toBeInTheDocument();
  });

  it('opens a listbox and commits the picked option', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Select name="month" options={OPTIONS} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Select…' }));
    await user.click(screen.getByRole('option', { name: 'February' }));

    expect(onChange).toHaveBeenCalledWith({ target: { name: 'month', value: '2' } });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'February' })).toBeInTheDocument();
  });

  it('accepts plain strings as options', async () => {
    const user = userEvent.setup();
    render(<Select options={OPTIONS} />);

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('option', { name: 'PROVINCIAL HEALTH OFFICE' }));

    expect(screen.getByRole('button', { name: 'PROVINCIAL HEALTH OFFICE' })).toBeInTheDocument();
  });

  it('keeps the hidden native select in step, for form libraries reading it', async () => {
    const user = userEvent.setup();
    const { container } = render(<Select name="month" options={OPTIONS} />);

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('option', { name: 'January' }));

    expect(container.querySelector('select')).toHaveValue('1');
  });

  it('marks the current option as selected', async () => {
    const user = userEvent.setup();
    render(<Select options={OPTIONS} value="2" onChange={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'February' }));

    expect(screen.getByRole('option', { name: 'February' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'January' })).toHaveAttribute('aria-selected', 'false');
  });

  it('follows a controlled value', () => {
    const { rerender } = render(<Select options={OPTIONS} value="1" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'January' })).toBeInTheDocument();

    rerender(<Select options={OPTIONS} value="2" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'February' })).toBeInTheDocument();
  });

  it('closes when the user clicks elsewhere', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Select options={OPTIONS} />
        <p>Outside</p>
      </>
    );

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByText('Outside'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('cannot be opened while disabled', async () => {
    const user = userEvent.setup();
    render(<Select options={OPTIONS} disabled />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

describe('Select label', () => {
  it('captions the value inside the trigger', () => {
    render(<Select label="Month" options={OPTIONS} value="1" onChange={() => {}} />);

    // jsdom applies no CSS, so it joins the two spans without the space a
    // browser puts between flex items.
    expect(screen.getByRole('button', { name: /^Month\s*January$/ })).toBeInTheDocument();
  });

  it('leaves the trigger uncaptioned without one', () => {
    render(<Select options={OPTIONS} value="1" onChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'January' })).toBeInTheDocument();
  });
});

describe('Select menu width', () => {
  it('caps the menu at the room left of the trigger, less the 16px gutter', async () => {
    const user = userEvent.setup();
    const { container } = render(<Select options={OPTIONS} />);
    placeTrigger(container, 300);

    await user.click(screen.getByRole('button'));

    const menu = screen.getByRole('listbox');
    expect(menu).toHaveStyle({ maxWidth: '284px' });
    expect(menu).toHaveClass('w-max', 'min-w-full');
  });

  it('pins the menu to the trigger with matchWidth', async () => {
    const user = userEvent.setup();
    const { container } = render(<Select options={OPTIONS} matchWidth />);
    placeTrigger(container, 300);

    await user.click(screen.getByRole('button'));

    const menu = screen.getByRole('listbox');
    expect(menu).toHaveClass('w-full');
    expect(menu).not.toHaveClass('w-max');
    expect(menu.style.maxWidth).toBe('');
  });

  it('sets no cap when the trigger has not been laid out', async () => {
    const user = userEvent.setup();
    render(<Select options={OPTIONS} />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByRole('listbox').style.maxWidth).toBe('');
  });
});
