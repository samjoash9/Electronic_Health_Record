import { describe, it, expect } from 'vitest';
import { buildSeed } from './seed';

const seed = buildSeed();

describe('assessment seed', () => {
  it('has four categories in display order', () => {
    const names = seed.assessmentCategories.map((c) => c.name);
    expect(names).toEqual([
      'Mental Health', 'Physical Health', 'Spiritual Health', 'Social Health',
    ]);
  });

  it('has sixteen questions in total', () => {
    const count = seed.assessmentCategories.reduce(
      (n, c) => n + c.questions.length, 0,
    );
    expect(count).toBe(16);
  });

  it('gives every question exactly four options', () => {
    for (const category of seed.assessmentCategories) {
      for (const question of category.questions) {
        expect(question.options).toHaveLength(4);
      }
    }
  });

  it('uses each score from 1 to 4 exactly once per question', () => {
    for (const category of seed.assessmentCategories) {
      for (const question of category.questions) {
        const scores = question.options.map((o) => o.score).sort();
        expect(scores).toEqual([1, 2, 3, 4]);
      }
    }
  });

  it('gives every option a globally unique id', () => {
    const ids = seed.assessmentCategories.flatMap((c) =>
      c.questions.flatMap((q) => q.options.map((o) => o.optionID)),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('scores the sleep question against its display order', () => {
    const mental = seed.assessmentCategories[0];
    const sleep = mental.questions.find((q) =>
      q.questionText.includes('hours of sleep'));
    const byText = Object.fromEntries(
      sleep.options.map((o) => [o.optionText, o.score]),
    );
    expect(byText['7-8 hrs']).toBe(4);
    expect(byText['More than 8 hrs']).toBe(3);
    expect(byText['5-6 hrs']).toBe(2);
    expect(byText['Less than 5 hrs']).toBe(1);
  });

  it('is the only question whose score does not descend with display order', () => {
    const offenders = [];
    for (const category of seed.assessmentCategories) {
      for (const question of category.questions) {
        const ordered = [...question.options]
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((o) => o.score);
        const descends = ordered.every((s, i) => i === 0 || ordered[i - 1] > s);
        if (!descends) offenders.push(question.questionText);
      }
    }
    expect(offenders).toHaveLength(1);
    expect(offenders[0]).toContain('hours of sleep');
  });
});

describe('directory seed', () => {
  it('provides at least 30 employees for the typeahead', () => {
    expect(seed.employees.length).toBeGreaterThanOrEqual(30);
  });

  it('gives every employee a unique external id', () => {
    const ids = seed.employees.map((e) => e.externalEmployeeId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('provides a signable physician with a PRC licence', () => {
    expect(seed.physicians[0].prcLicenseNo).toBeTruthy();
  });

  it('provides an admin account', () => {
    expect(seed.admins[0].username).toBe('admin');
  });
});
