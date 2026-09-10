import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import ChoiceWithOtherField from './ChoiceWithOtherField';

const OPTIONS = ['None', 'Refractive error', 'Other'];

function Harness({ onValues }) {
  const { control, register, watch } = useForm({
    defaultValues: { field: null, fieldOther: '' },
  });
  onValues?.(watch);
  return (
    <ChoiceWithOtherField
      control={control}
      register={register}
      name="field"
      otherName="fieldOther"
      label="Eye Condition Identified"
      options={OPTIONS}
      otherPlaceholder="e.g. glaucoma, cataract"
    />
  );
}

describe('ChoiceWithOtherField', () => {
  it('renders a radiogroup with every option', () => {
    render(<Harness />);
    const group = screen.getByRole('radiogroup', { name: 'Eye Condition Identified' });
    for (const option of OPTIONS) {
      expect(within(group).getByRole('radio', { name: option })).toBeInTheDocument();
    }
  });

  it('does not render the specify field until "Other" is selected', () => {
    render(<Harness />);
    expect(screen.queryByPlaceholderText('e.g. glaucoma, cataract')).not.toBeInTheDocument();
  });

  it('reveals the specify field when "Other" is selected', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const group = screen.getByRole('radiogroup', { name: 'Eye Condition Identified' });
    await user.click(within(group).getByRole('radio', { name: 'Other' }));
    expect(screen.getByPlaceholderText('e.g. glaucoma, cataract')).toBeInTheDocument();
  });

  it('hides the specify field again when switching away from "Other"', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const group = screen.getByRole('radiogroup', { name: 'Eye Condition Identified' });
    await user.click(within(group).getByRole('radio', { name: 'Other' }));
    await user.click(within(group).getByRole('radio', { name: 'None' }));
    expect(screen.queryByPlaceholderText('e.g. glaucoma, cataract')).not.toBeInTheDocument();
  });

  it('selects an option when clicked', async () => {
    const user = userEvent.setup();
    let watch;
    render(<Harness onValues={(w) => { watch = w; }} />);
    const group = screen.getByRole('radiogroup', { name: 'Eye Condition Identified' });
    await user.click(within(group).getByRole('radio', { name: 'Refractive error' }));
    expect(watch('field')).toBe('Refractive error');
  });

  it('accepts specify text once "Other" is selected', async () => {
    const user = userEvent.setup();
    let watch;
    render(<Harness onValues={(w) => { watch = w; }} />);
    const group = screen.getByRole('radiogroup', { name: 'Eye Condition Identified' });
    await user.click(within(group).getByRole('radio', { name: 'Other' }));
    await user.type(screen.getByPlaceholderText('e.g. glaucoma, cataract'), 'Suspected glaucoma');
    expect(watch('fieldOther')).toBe('Suspected glaucoma');
  });
});
