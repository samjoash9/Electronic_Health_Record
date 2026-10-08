import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormEditPanel from './FormEditPanel';

const categories = [
  {
    categoryID: 1,
    name: 'Physical',
    questions: [
      {
        questionID: 11,
        questionText: 'How often do you exercise?',
        options: [
          { optionID: 101, optionText: 'Never' },
          { optionID: 102, optionText: 'Often' },
        ],
      },
    ],
  },
];

const form = {
  formID: 1009,
  status: 'Completed',
  rowVersion: 'AAAA',
  signedAt: '2026-10-01T03:00:00.000Z',
  formDate: '2026-10-01T00:00:00.000Z',
  patient: { surname: 'DELA CRUZ', firstName: 'JUAN', birthdate: '1979-02-08' },
  physicianID: null,
  weightKg: 70,
  assessmentAnswers: [{ questionID: 11, optionID: 101 }],
  familyMedicalHistory: [{ conditionID: 2, conditionOther: null, isNone: false, conditionType: null }],
  pastMedicalHistory: [],
  socialHistory: null,
  exercise: [],
  recommendedDiagnosticTest: 'CBC',
  impressionClinical: 'Stage 1 Hypertension',
  managementTreatment: 'Medications:\n• Losartan — 50mg — Once Daily',
};

function renderPanel(onSave = vi.fn(), overrides = {}) {
  render(
    <FormEditPanel
      form={{ ...form, ...overrides }}
      categories={categories}
      onSave={onSave}
      onCancel={vi.fn()}
      isPending={false}
    />,
  );
  return onSave;
}

describe('FormEditPanel', () => {
  it('offers a tab for every station that records data', () => {
    renderPanel();
    for (const name of [/Vitals/, /Assessment/, /Consultation/, /Dental/, /Vision/]) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument();
    }
  });

  it('edits the whole consultation through the Station 3 sections, prefilled', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole('tab', { name: /Consultation/ }));

    expect(screen.getByRole('heading', { name: 'Family Medical History' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Past Medical History' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Social History' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'HYPERTENSION' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'CBC' })).toBeChecked();
    expect(screen.getByLabelText('Medication (Generic), row 1')).toHaveValue('Losartan');
    expect(screen.getByLabelText('Impression / Clinical')).toHaveValue('Stage 1 Hypertension');
  });

  it('saves only the consultation section that changed', async () => {
    const user = userEvent.setup();
    const onSave = renderPanel();
    await user.click(screen.getByRole('tab', { name: /Consultation/ }));

    const impression = screen.getByLabelText('Impression / Clinical');
    await user.clear(impression);
    await user.type(impression, 'Stage 2 Hypertension');
    await user.type(screen.getByLabelText(/Reason for this correction/), 'Typo at signing');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onSave).toHaveBeenCalledWith({
      changes: { impressionClinical: 'Stage 2 Hypertension' },
      reason: 'Typo at signing',
    });
  });

  it('corrects a Station 2 answer and sends the full answer set', async () => {
    const user = userEvent.setup();
    const onSave = renderPanel();
    await user.click(screen.getByRole('tab', { name: /Assessment/ }));

    await user.click(screen.getByRole('radio', { name: /Often/ }));
    expect(screen.getByRole('tab', { name: /Assessment/ })).toHaveTextContent('1');

    await user.type(screen.getByLabelText(/Reason for this correction/), 'Patient misread');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onSave.mock.calls[0][0].changes).toEqual({
      assessmentAnswers: [{ questionID: 11, optionID: 102 }],
    });
  });

  it('starts with nothing to save', () => {
    renderPanel();
    expect(screen.getByText('No changes yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  describe("year fields bounded by the patient's birth year", () => {
    beforeEach(() => {
      // jsdom has no layout, so scrolling is only observable as a call.
      Element.prototype.scrollIntoView = vi.fn();
    });

    it('warns about a year before the birth year as it is typed', async () => {
      const user = userEvent.setup();
      renderPanel();
      await user.click(screen.getByRole('tab', { name: /Consultation/ }));

      await user.type(screen.getByLabelText(/year started, row 1/i), '1970');

      expect(screen.getByText("Before the patient's birth year (1979).")).toBeInTheDocument();
    });

    it('blocks Save and returns to the Consultation tab to show the bad year', async () => {
      const user = userEvent.setup();
      const onSave = renderPanel();
      await user.click(screen.getByRole('tab', { name: /Consultation/ }));
      await user.type(screen.getByLabelText(/type of exercise, row 1/i), 'Jogging');
      await user.type(screen.getByLabelText(/year started, row 1/i), '1970');

      // Saving from another tab, where the bad year is not on screen.
      await user.click(screen.getByRole('tab', { name: /Vitals/ }));
      await user.type(screen.getByLabelText(/Reason for this correction/), 'Paper intake sheet');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByRole('tab', { name: /Consultation/ })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText("Before the patient's birth year (1979).")).toBeInTheDocument();
      const year = screen.getByLabelText(/year started, row 1/i);
      await waitFor(() => expect(year).toHaveFocus());
      expect(year.scrollIntoView).toHaveBeenCalled();
    });

    it('still saves an unrelated correction when an old bad year is left untouched', async () => {
      const user = userEvent.setup();
      const onSave = renderPanel(vi.fn(), {
        exercise: [{ exerciseType: 'Jogging', exerciseFrequency: 'Daily', exerciseYearStarted: '1970' }],
      });
      await user.click(screen.getByRole('tab', { name: /Consultation/ }));

      const impression = screen.getByLabelText('Impression / Clinical');
      await user.clear(impression);
      await user.type(impression, 'Stage 2 Hypertension');
      await user.type(screen.getByLabelText(/Reason for this correction/), 'Typo at signing');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(onSave).toHaveBeenCalledWith({
        changes: { impressionClinical: 'Stage 2 Hypertension' },
        reason: 'Typo at signing',
      });
    });
  });
});
