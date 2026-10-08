import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import VisionAssessmentDetail from './VisionAssessmentDetail';

const at = '2026-10-01T07:14:00Z';

// The record the design was drawn from, shaped as the server sends it.
const assessment = {
  formID: 1,
  historyOfEyeProblems: 'No',
  historyOfEyeProblemsRemarks: null,
  eyePainDiscomfort: 'No',
  eyePainDiscomfortRemarks: null,
  blurredVision: 'No',
  blurredVisionRemarks: null,
  difficultySeeingNear: 'No',
  difficultySeeingNearRemarks: null,
  difficultySeeingDistant: 'No',
  difficultySeeingDistantRemarks: null,
  headacheEyeStrain: 'No',
  headacheEyeStrainRemarks: null,
  usesEyeglassesContactLenses: 'No',
  usesEyeglassesContactLensesRemarks: null,
  visualAcuityRightEye: null,
  visualAcuityRightEyeRemarks: null,
  visualAcuityLeftEye: null,
  visualAcuityLeftEyeRemarks: null,
  eyeConditionIdentified: 'None',
  eyeConditionOther: null,
  eyeConditionIdentifiedRemarks: null,
  correctiveLensesRecommended: 'No',
  correctiveLensesRecommendedRemarks: null,
  referralToEyeSpecialist: 'No',
  referralToEyeSpecialistRemarks: null,
  followUpConsultationAdvised: 'No',
  followUpConsultationAdvisedRemarks: null,
};

const signed = {
  visionSignedAt: at,
  visionSignature: 'data:image/png;base64,AAAA',
  optometrist: { firstName: 'Mark', surname: 'John', prcLicenseNo: '10625791285' },
  visionSignedByName: null,
  visionSignedByLicenseNo: null,
  visionAssessment: assessment,
};

const withAnswers = (answers) => ({ ...signed, visionAssessment: { ...assessment, ...answers } });
const measured = { visualAcuityRightEye: '20/20', visualAcuityLeftEye: '20/40' };

/** Each listed finding's name against the answer shown beside it. */
function listedFindings() {
  const names = screen.getAllByRole('term').map((term) => term.textContent);
  const answers = screen.getAllByRole('definition').map((answer) => answer.textContent);
  return Object.fromEntries(names.map((name, i) => [name, answers[i]]));
}

describe('VisionAssessmentDetail', () => {
  it('lists every finding by its short name, both eyes read on one row', () => {
    render(<VisionAssessmentDetail form={withAnswers(measured)} />);

    expect(listedFindings()).toEqual({
      'History of eye problems': 'No',
      'Eye pain / discomfort': 'No',
      'Blurred vision': 'No',
      'Difficulty seeing near objects': 'No',
      'Difficulty seeing distant objects': 'No',
      'Headache / eye strain': 'No',
      'Uses eyeglasses / contact lenses': 'No',
      'Visual acuity (right / left)': '20/20 / 20/40',
      'Eye condition identified': 'None',
      'Corrective lenses recommended': 'No',
      'Referral to eye specialist': 'Not needed',
      'Follow-up consultation advised': 'No',
    });
  });

  it('says whether a referral is needed rather than answering yes or no', () => {
    render(<VisionAssessmentDetail form={withAnswers({ referralToEyeSpecialist: 'Yes' })} />);

    expect(listedFindings()['Referral to eye specialist']).toBe('Needed');
  });

  it('names the condition the optometrist specified under Other', () => {
    render(
      <VisionAssessmentDetail
        form={withAnswers({ eyeConditionIdentified: 'Other', eyeConditionOther: 'glaucoma' })}
      />,
    );

    expect(listedFindings()['Eye condition identified']).toBe('Glaucoma');
  });

  it('says acuity read for neither eye was not recorded', () => {
    render(<VisionAssessmentDetail form={signed} />);

    expect(listedFindings()['Visual acuity (right / left)']).toBe('Not recorded');
  });

  it('leaves a dash for the one eye with no reading', () => {
    render(<VisionAssessmentDetail form={withAnswers({ visualAcuityRightEye: '20/20' })} />);

    expect(listedFindings()['Visual acuity (right / left)']).toBe('20/20 / —');
  });

  it('says a finding left unanswered was not recorded', () => {
    render(<VisionAssessmentDetail form={withAnswers({ blurredVision: null })} />);

    expect(listedFindings()['Blurred vision']).toBe('Not recorded');
  });

  it('puts no note above the findings, even with readings missing', () => {
    render(<VisionAssessmentDetail form={withAnswers({ blurredVision: null })} />);

    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('lists the remarks the optometrist wrote, each under its finding', () => {
    render(
      <VisionAssessmentDetail
        form={withAnswers({
          blurredVisionRemarks: 'Worse toward end of shift',
          headacheEyeStrainRemarks: '   ',
          visualAcuityLeftEyeRemarks: 'With corrective lenses',
        })}
      />,
    );
    const remarks = screen.getByRole('list', { name: 'Remarks' });

    expect(within(remarks).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Blurred vision: Worse toward end of shift',
      'Visual acuity (left): With corrective lenses',
    ]);
    expect(screen.queryByText('No remarks recorded.')).not.toBeInTheDocument();
  });

  it('says so when no remarks were recorded', () => {
    render(<VisionAssessmentDetail form={signed} />);

    expect(screen.getByText('No remarks recorded.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Remarks' })).not.toBeInTheDocument();
  });

  it('signs off with the examining optometrist', () => {
    render(<VisionAssessmentDetail form={signed} />);

    expect(screen.getByText('Examining optometrist')).toBeInTheDocument();
    expect(screen.getByText('Dr. Mark John')).toBeInTheDocument();
    expect(screen.getByText('PRC License No. 10625791285')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Optometrist signature' })).toBeInTheDocument();
    expect(screen.getByText('Signed Oct 1, 2026 at 3:14 PM')).toBeInTheDocument();
  });

  it('still names the optometrist once their account is gone, from what the record kept', () => {
    render(
      <VisionAssessmentDetail
        form={{
          ...signed,
          optometrist: null,
          visionSignedByName: 'Dr. Mark John',
          visionSignedByLicenseNo: '10625791285',
        }}
      />,
    );

    expect(screen.getByText('Dr. Mark John')).toBeInTheDocument();
    expect(screen.getByText('PRC License No. 10625791285')).toBeInTheDocument();
  });

  it('says so when the vision station has not been done', () => {
    render(
      <VisionAssessmentDetail
        form={{ ...signed, visionAssessment: null, visionSignedAt: null, visionSignature: null, optometrist: null }}
      />,
    );

    expect(screen.getByText('Not yet completed.')).toBeInTheDocument();
    expect(screen.queryByRole('term')).not.toBeInTheDocument();
  });
});
