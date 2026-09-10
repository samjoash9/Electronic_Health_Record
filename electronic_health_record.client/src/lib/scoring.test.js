import { describe, it, expect } from 'vitest';
import { scoreCategory, scoreAllCategories, answersToMap } from './scoring';

const sleepQuestion = {
  questionID: 2,
  questionText: 'How many hours of sleep do you get on average?',
  displayOrder: 2,
  options: [
    { optionID: 21, optionText: 'Less than 5 hrs', score: 1, displayOrder: 1 },
    { optionID: 22, optionText: '5-6 hrs', score: 2, displayOrder: 2 },
    { optionID: 23, optionText: '7-8 hrs', score: 4, displayOrder: 3 },
    { optionID: 24, optionText: 'More than 8 hrs', score: 3, displayOrder: 4 },
  ],
};

const stressQuestion = {
  questionID: 1,
  questionText: 'How would you rate your current stress level?',
  displayOrder: 1,
  options: [
    { optionID: 11, optionText: 'None', score: 4, displayOrder: 1 },
    { optionID: 12, optionText: 'Mild', score: 3, displayOrder: 2 },
    { optionID: 13, optionText: 'Moderate', score: 2, displayOrder: 3 },
    { optionID: 14, optionText: 'Severe', score: 1, displayOrder: 4 },
  ],
};

const category = {
  categoryID: 1,
  name: 'Mental Health',
  displayOrder: 1,
  questions: [stressQuestion, sleepQuestion],
};

describe('answersToMap', () => {
  it('keys option ids by question id', () => {
    expect(answersToMap([{ questionID: 1, optionID: 11 }])).toEqual({ 1: 11 });
  });

  it('returns an empty map for no answers', () => {
    expect(answersToMap([])).toEqual({});
    expect(answersToMap(undefined)).toEqual({});
  });
});

describe('scoreCategory', () => {
  it('sums the score of each selected option', () => {
    const result = scoreCategory(category, { 1: 11, 2: 23 });
    expect(result.total).toBe(8);
  });

  it('takes max from the highest option score per question, not a constant', () => {
    const result = scoreCategory(category, {});
    expect(result.max).toBe(8);
  });

  it('scores the sleep question from its data, not its display order', () => {
    // "7-8 hrs" is third in display order but is the healthiest answer.
    const best = scoreCategory(category, { 1: 11, 2: 23 });
    const eightPlus = scoreCategory(category, { 1: 11, 2: 24 });
    expect(best.total).toBeGreaterThan(eightPlus.total);
  });

  it('scores less than 5 hours as the worst sleep answer', () => {
    const worst = scoreCategory(category, { 2: 21 });
    expect(worst.total).toBe(1);
  });

  it('counts answered questions', () => {
    expect(scoreCategory(category, { 1: 11 }).answered).toBe(1);
    expect(scoreCategory(category, {}).answered).toBe(0);
    expect(scoreCategory(category, { 1: 11, 2: 23 }).questionCount).toBe(2);
  });

  it('normalises to a percentage of the maximum', () => {
    expect(scoreCategory(category, { 1: 11, 2: 23 }).percent).toBe(100);
    expect(scoreCategory(category, { 1: 14, 2: 21 }).percent).toBe(25);
  });

  it('ignores an option id that does not belong to the question', () => {
    expect(scoreCategory(category, { 1: 999 }).total).toBe(0);
    expect(scoreCategory(category, { 1: 999 }).answered).toBe(0);
  });

  it('returns a null percent for a category with no questions', () => {
    const empty = { categoryID: 9, name: 'Empty', displayOrder: 9, questions: [] };
    expect(scoreCategory(empty, {}).percent).toBeNull();
  });
});

describe('scoreAllCategories', () => {
  it('makes unequal-length categories comparable by percentage', () => {
    const short = {
      categoryID: 2,
      name: 'Social Health',
      displayOrder: 2,
      questions: [stressQuestion],
    };
    const [mental, social] = scoreAllCategories(
      [category, short],
      [{ questionID: 1, optionID: 11 }, { questionID: 2, optionID: 23 }],
    );
    expect(mental.total).toBe(8);
    expect(social.total).toBe(4);
    expect(mental.percent).toBe(100);
    expect(social.percent).toBe(100);
  });

  it('carries the category identity through', () => {
    const [only] = scoreAllCategories([category], []);
    expect(only.categoryID).toBe(1);
    expect(only.name).toBe('Mental Health');
  });
});
