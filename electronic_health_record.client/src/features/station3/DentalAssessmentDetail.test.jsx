import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import DentalAssessmentDetail from './DentalAssessmentDetail';

const at = '2026-10-06T06:08:00Z';

// The record the design was drawn from, shaped as the server sends it.
const assessment = {
  formID: 1,
  oralHygieneStatus: 'Good',
  oralHygieneStatusRemarks: null,
  dentalCaries: 'None',
  dentalCariesRemarks: null,
  gumCondition: 'Gingivitis',
  gumConditionRemarks: null,
  toothStatus: 'Complete/Functional',
  toothStatusRemarks: null,
  toothachePain: 'No',
  toothachePainRemarks: null,
  oralLesions: 'None',
  oralLesionsRemarks: null,
  dentureUse: 'Yes – satisfactory',
  dentureUseRemarks: null,
  dentalTreatmentNeed: 'Preventive Care',
  dentalTreatmentNeedRemarks: null,
  lastDentalVisit: 'Within 6 months',
  lastDentalVisitRemarks: null,
  dentalReferral: 'Not needed',
  dentalReferralRemarks: null,
};

const signed = {
  dentalSignedAt: at,
  dentalSignature: 'data:image/png;base64,AAAA',
  dentist: { firstName: 'Ramiel', surname: 'Rasonado', prcLicenseNo: '18902759812' },
  dentalSignedByName: null,
  dentalSignedByLicenseNo: null,
  dentalAssessment: assessment,
};

const withAnswers = (answers) => ({ ...signed, dentalAssessment: { ...assessment, ...answers } });

/** Each listed finding's name against the answer shown beside it. */
function listedFindings() {
  const names = screen.getAllByRole('term').map((term) => term.textContent);
  const answers = screen.getAllByRole('definition').map((answer) => answer.textContent);
  return Object.fromEntries(names.map((name, i) => [name, answers[i]]));
}

describe('DentalAssessmentDetail', () => {
  it('lists every finding by its short name, its answer in plain words', () => {
    render(<DentalAssessmentDetail form={signed} />);

    expect(listedFindings()).toEqual({
      'Oral hygiene': 'Good',
      'Dental caries': 'None',
      'Gum condition': 'Gingivitis',
      'Tooth status': 'Complete / functional',
      'Toothache / dental pain': 'No',
      'Oral lesions / abnormalities': 'None',
      'Denture / prosthesis use': 'Yes, satisfactory',
      'Treatment need': 'Preventive care',
      'Last dental visit': 'Within 6 months',
      'Dental referral': 'Not needed',
    });
  });

  it('says a finding left unanswered was not assessed', () => {
    render(<DentalAssessmentDetail form={withAnswers({ dentalReferral: null })} />);

    expect(listedFindings()['Dental referral']).toBe('Not assessed');
  });

  it('sets a finding that needs care the same as any other answer', () => {
    render(<DentalAssessmentDetail form={withAnswers({ oralLesions: 'Present – refer for evaluation' })} />);

    expect(listedFindings()['Oral lesions / abnormalities']).toBe('Present, refer for evaluation');
    expect(screen.getAllByRole('definition').some((answer) => answer.querySelector('svg'))).toBe(false);
  });

  it('lists the remarks the dentist wrote, each under its finding', () => {
    render(
      <DentalAssessmentDetail
        form={withAnswers({
          gumConditionRemarks: 'Bleeding on probing, upper anterior',
          toothStatusRemarks: '   ',
          dentalReferralRemarks: 'Recheck in 6 months',
        })}
      />,
    );
    const remarks = screen.getByRole('list', { name: 'Remarks' });

    expect(within(remarks).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Gum condition: Bleeding on probing, upper anterior',
      'Dental referral: Recheck in 6 months',
    ]);
    expect(screen.queryByText('No remarks recorded.')).not.toBeInTheDocument();
  });

  it('says so when no remarks were recorded', () => {
    render(<DentalAssessmentDetail form={signed} />);

    expect(screen.getByText('No remarks recorded.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Remarks' })).not.toBeInTheDocument();
  });

  it('signs off with the examining dentist', () => {
    render(<DentalAssessmentDetail form={signed} />);

    expect(screen.getByText('Examining dentist')).toBeInTheDocument();
    expect(screen.getByText('Dr. Ramiel Rasonado')).toBeInTheDocument();
    expect(screen.getByText('PRC License No. 18902759812')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Dentist signature' })).toBeInTheDocument();
    expect(screen.getByText('Signed Oct 6, 2026 at 2:08 PM')).toBeInTheDocument();
  });

  it("still names the dentist once their account is gone, from what the record kept", () => {
    render(
      <DentalAssessmentDetail
        form={{
          ...signed,
          dentist: null,
          dentalSignedByName: 'Dr. Ramiel Rasonado',
          dentalSignedByLicenseNo: '18902759812',
        }}
      />,
    );

    expect(screen.getByText('Dr. Ramiel Rasonado')).toBeInTheDocument();
    expect(screen.getByText('PRC License No. 18902759812')).toBeInTheDocument();
  });

  it('says so when the dental station has not been done', () => {
    render(
      <DentalAssessmentDetail
        form={{ ...signed, dentalAssessment: null, dentalSignedAt: null, dentalSignature: null, dentist: null }}
      />,
    );

    expect(screen.getByText('Not yet completed.')).toBeInTheDocument();
    expect(screen.queryByRole('term')).not.toBeInTheDocument();
  });
});
