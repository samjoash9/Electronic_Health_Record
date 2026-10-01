import { describe, it, expect } from 'vitest';
import { scoreBand, bandRange, concerningAnswers, BANDS } from './interpretation';

// Same shape as the seeded template: every option scores 1-4, 4 healthiest,
// and the sleep question deliberately does not score in display order.
const sleepQuestion = {
  questionID: 2,
  questionText: 'How many hours of sleep do you get on average?',
  options: [
    { optionID: 21, optionText: 'Less than 5 hrs', score: 1, displayOrder: 1 },
    { optionID: 22, optionText: '5-6 hrs', score: 2, displayOrder: 2 },
    { optionID: 23, optionText: '7-8 hrs', score: 4, displayOrder: 3 },
    { optionID: 24, optionText: 'More than 8 hrs', score: 3, displayOrder: 4 },
  ],
};

const anxietyQuestion = {
  questionID: 4,
  questionText: 'Do you experience frequent anxiety or worry?',
  options: [
    { optionID: 41, optionText: 'Never', score: 4, displayOrder: 1 },
    { optionID: 42, optionText: 'Rarely', score: 3, displayOrder: 2 },
    { optionID: 43, optionText: 'Sometimes', score: 2, displayOrder: 3 },
    { optionID: 44, optionText: 'Often', score: 1, displayOrder: 4 },
  ],
};

const mental = { categoryID: 3, name: 'Mental', questions: [sleepQuestion, anxietyQuestion] };

describe('scoreBand', () => {
  // A 5-question section can only land on multiples of 5 between 25 and 100;
  // the overall score is finer-grained, so the edges just under each cutoff
  // are checked too.
  it.each([
    [100, 'excellent'],
    [90, 'excellent'],
    [89.9, 'good'],
    [85, 'good'],
    [75, 'good'],
    [74.9, 'fair'],
    [70, 'fair'],
    [65, 'fair'],
    [64.9, 'attention'],
    [60, 'attention'],
    [50, 'attention'],
    [49.9, 'support'],
    [45, 'support'],
    [25, 'support'],
  ])('puts %s%% in the %s band', (percent, band) => {
    expect(scoreBand(percent)).toBe(band);
  });

  it('has no band for a section that could not be scored', () => {
    expect(scoreBand(null)).toBeNull();
    expect(scoreBand(undefined)).toBeNull();
  });
});

describe('bandRange', () => {
  it.each([
    ['excellent', 90, 100],
    ['good', 75, 89.9],
    ['fair', 65, 74.9],
    ['attention', 50, 64.9],
    ['support', 25, 49.9],
  ])('labels %s as %s-%s%%', (band, min, max) => {
    expect(bandRange(band)).toEqual({ min, max });
  });

  // The legend a patient reads must never disagree with the band they are
  // actually given: both ends of every advertised range land in that band.
  it('advertises ranges that scoreBand agrees with', () => {
    BANDS.forEach((band) => {
      const { min, max } = bandRange(band);
      expect(scoreBand(min)).toBe(band);
      expect(scoreBand(max)).toBe(band);
    });
  });
});

describe('concerningAnswers', () => {
  it('flags an answer at the lowest score for its question', () => {
    const flagged = concerningAnswers(mental, { 2: 23, 4: 44 });
    expect(flagged.map((f) => f.question.questionID)).toEqual([4]);
    expect(flagged[0].option.optionText).toBe('Often');
  });

  // "More than 8 hrs" is last in display order but is not the worst answer;
  // "Less than 5 hrs" is first in display order and is.
  it('judges the worst answer by score, not by display position', () => {
    expect(concerningAnswers(mental, { 2: 24 })).toEqual([]);
    expect(concerningAnswers(mental, { 2: 21 }).map((f) => f.option.optionID)).toEqual([21]);
  });

  it('does not flag an answer one step above the worst', () => {
    expect(concerningAnswers(mental, { 2: 22, 4: 43 })).toEqual([]);
  });

  it('skips unanswered questions and unknown option ids', () => {
    expect(concerningAnswers(mental, {})).toEqual([]);
    expect(concerningAnswers(mental, { 4: 999 })).toEqual([]);
  });

  it('tolerates a missing category', () => {
    expect(concerningAnswers(undefined, { 4: 44 })).toEqual([]);
  });
});
