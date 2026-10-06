import { describe, it, expect } from 'vitest';
import { formatDate, formatTime } from '../../lib/formatters';
import {
  vitalsHeader, assessmentHeader, consultationHeader, dentalHeader, visionHeader,
} from './stationHeaders';

const at = '2026-10-02T06:15:00Z';
const stamp = `${formatDate(at)} at ${formatTime(at)}`;

const readings = (header) => Object.fromEntries(header.summary.map(({ label, value }) => [label, value]));

// Every option scores 1-4, so a category's percent is its answer's score over 4.
const question = (questionID) => ({
  questionID,
  options: [1, 2, 3, 4].map((score) => ({ optionID: questionID * 10 + score, score })),
});

const categories = [
  { categoryID: 1, name: 'Physical', questions: [question(1)] },
  { categoryID: 2, name: 'Financial', questions: [question(2)] },
];

describe('station headers', () => {
  it('numbers and names each station the same wherever it is shown', () => {
    expect(vitalsHeader({})).toMatchObject({ station: 1, title: 'Vital signs' });
    expect(assessmentHeader({}, categories)).toMatchObject({ station: 2, title: 'Assessment' });
    expect(consultationHeader({})).toMatchObject({ station: 3, title: 'Consultation' });
    expect(dentalHeader({})).toMatchObject({ station: 4, title: 'Dental assessment' });
    expect(visionHeader({})).toMatchObject({ station: 5, title: 'Vision assessment' });
  });

  it('stamps a finished station with the day and time it was done', () => {
    expect(vitalsHeader({ station1SubmittedAt: at })).toMatchObject({ completed: true, subtitle: `Recorded ${stamp}` });
    expect(assessmentHeader({ station2SubmittedAt: at }, categories)).toMatchObject({ completed: true, subtitle: `Recorded ${stamp}` });
    expect(consultationHeader({ signedAt: at })).toMatchObject({ completed: true, subtitle: `Signed ${stamp}` });
    expect(dentalHeader({ dentalSignedAt: at })).toMatchObject({ completed: true, subtitle: `Signed ${stamp}` });
    expect(visionHeader({ visionSignedAt: at })).toMatchObject({ completed: true, subtitle: `Signed ${stamp}` });
  });

  it('hands the consultation its signing time for the open header', () => {
    expect(consultationHeader({ signedAt: at })).toMatchObject({ signedAt: at });
  });

  it('says so plainly when a station has not been done yet', () => {
    expect(vitalsHeader({})).toMatchObject({ completed: false, subtitle: 'Not yet recorded' });
    expect(assessmentHeader({}, categories)).toMatchObject({ completed: false, subtitle: 'Not yet recorded' });
    expect(consultationHeader({})).toMatchObject({ completed: false, subtitle: 'Not yet completed' });
    expect(dentalHeader({})).toMatchObject({ completed: false, subtitle: 'Not yet completed' });
    expect(visionHeader({})).toMatchObject({ completed: false, subtitle: 'Not yet completed' });
  });

  it('heads the assessment with the overall score and the weakest aspect', () => {
    const form = {
      station2SubmittedAt: at,
      assessmentAnswers: [
        { questionID: 1, optionID: 14 },
        { questionID: 2, optionID: 22 },
      ],
    };

    expect(readings(assessmentHeader(form, categories))).toEqual({ Overall: '75%', Lowest: 'Financial 50%' });
  });

  it('leaves the assessment scores blank while the template is still loading', () => {
    expect(readings(assessmentHeader({ station2SubmittedAt: at }, undefined))).toEqual({ Overall: null, Lowest: null });
  });

  it('heads the consultation with the signing physician and the tests ordered', () => {
    const form = {
      signedAt: at,
      physician: { firstName: 'Ana', surname: 'Santos' },
      recommendedDiagnosticTest: 'CBC, ECG (500)',
    };

    expect(readings(consultationHeader(form))).toEqual({ Physician: 'Dr. Santos', Tests: 2 });
  });

  it('heads dental with hygiene, caries and referral', () => {
    const form = {
      dentalSignedAt: at,
      dentalAssessment: { oralHygieneStatus: 'Fair', dentalCaries: 'Present', dentalReferral: 'Routine referral' },
    };

    expect(readings(dentalHeader(form))).toEqual({ Hygiene: 'Fair', Caries: 'Present', Referral: 'Routine referral' });
  });

  it('heads vision with each eye\'s acuity and the specialist referral', () => {
    const form = {
      visionSignedAt: at,
      visionAssessment: { visualAcuityRightEye: '20/20', visualAcuityLeftEye: '20/40', referralToEyeSpecialist: 'No' },
    };

    expect(readings(visionHeader(form))).toEqual({ 'Right eye': '20/20', 'Left eye': '20/40', Referral: 'No' });
  });

  it('keeps figures in the mono face and sets worded readings in the body face', () => {
    const mono = (header) => Object.fromEntries(header.summary.map(({ label, mono: m = true }) => [label, m]));

    expect(mono(vitalsHeader({}))).toEqual({ BP: true, HR: true, RR: true, Temp: true, BMI: true });
    expect(mono(consultationHeader({}))).toEqual({ Physician: false, Tests: true });
    expect(mono(visionHeader({}))).toEqual({ 'Right eye': true, 'Left eye': true, Referral: false });
  });
});
