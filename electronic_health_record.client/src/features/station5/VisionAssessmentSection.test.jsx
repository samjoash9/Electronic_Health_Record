import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import VisionAssessmentSection from './VisionAssessmentSection';
import { VISION_INDICATORS } from '../../lib/constants';

function defaultValues() {
  return Object.fromEntries(
    VISION_INDICATORS.flatMap((i) => {
      const entries = [[i.name, i.type === 'text' ? '' : null], [`${i.name}Remarks`, '']];
      if (i.hasOther) entries.push([i.otherFieldName, '']);
      return entries;
    }),
  );
}

function Harness({ onValues }) {
  const { control, register, watch } = useForm({
    defaultValues: { visionAssessment: defaultValues() },
  });
  onValues?.(watch);
  return <VisionAssessmentSection control={control} register={register} />;
}

const CHOICE_INDICATORS = VISION_INDICATORS.filter((i) => i.type === 'choice');
const TEXT_INDICATORS = VISION_INDICATORS.filter((i) => i.type === 'text');

describe('VisionAssessmentSection', () => {
  it('renders a radiogroup for every choice indicator', () => {
    render(<Harness />);
    for (const indicator of CHOICE_INDICATORS) {
      expect(screen.getByRole('radiogroup', { name: indicator.label })).toBeInTheDocument();
    }
  });

  it('renders every option of every choice indicator', () => {
    render(<Harness />);
    for (const indicator of CHOICE_INDICATORS) {
      const group = screen.getByRole('radiogroup', { name: indicator.label });
      for (const option of indicator.options) {
        expect(within(group).getByRole('radio', { name: option })).toBeInTheDocument();
      }
    }
  });

  it('renders a text input for every text indicator', () => {
    render(<Harness />);
    for (const indicator of TEXT_INDICATORS) {
      expect(screen.getByRole('textbox', { name: indicator.label })).toBeInTheDocument();
    }
  });

  it('renders a remarks field for every indicator', () => {
    render(<Harness />);
    for (const indicator of VISION_INDICATORS) {
      expect(
        screen.getByRole('textbox', { name: `Remarks for the examiner — ${indicator.label}` }),
      ).toBeInTheDocument();
    }
  });

  it('selects an option when clicked', async () => {
    const user = userEvent.setup();
    let watch;
    render(<Harness onValues={(w) => { watch = w; }} />);
    const group = screen.getByRole('radiogroup', { name: 'Blurred Vision' });
    await user.click(within(group).getByRole('radio', { name: 'Yes' }));
    expect(watch('visionAssessment.blurredVision')).toBe('Yes');
  });

  it('accepts a visual acuity reading', async () => {
    const user = userEvent.setup();
    let watch;
    render(<Harness onValues={(w) => { watch = w; }} />);
    await user.type(screen.getByRole('textbox', { name: 'Visual Acuity – Right Eye' }), '20/20');
    expect(watch('visionAssessment.visualAcuityRightEye')).toBe('20/20');
  });

  it('accepts remarks text', async () => {
    const user = userEvent.setup();
    let watch;
    render(<Harness onValues={(w) => { watch = w; }} />);
    await user.type(
      screen.getByRole('textbox', { name: 'Remarks for the examiner — Blurred Vision' }),
      'Worse in the evening',
    );
    expect(watch('visionAssessment.blurredVisionRemarks')).toBe('Worse in the evening');
  });

  it('reveals the specify field when eye condition is set to Other', async () => {
    const user = userEvent.setup();
    let watch;
    render(<Harness onValues={(w) => { watch = w; }} />);
    const group = screen.getByRole('radiogroup', { name: 'Eye Condition Identified' });
    await user.click(within(group).getByRole('radio', { name: 'Other' }));
    await user.type(screen.getByPlaceholderText('e.g. glaucoma, cataract'), 'Suspected glaucoma');
    expect(watch('visionAssessment.eyeConditionOther')).toBe('Suspected glaucoma');
  });
});
