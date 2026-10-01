import { describe, it, expect } from 'vitest';
import { resultsText, sectionInterpretation, overallInterpretation } from './assessmentText';

describe('sectionInterpretation', () => {
  it('explains a known section in the chosen language', () => {
    const en = sectionInterpretation('Mental', 'support', 'en');
    const tl = sectionInterpretation('Mental', 'support', 'tl');
    const ceb = sectionInterpretation('Mental', 'support', 'ceb');
    expect(en.about).toMatch(/sleep/i);
    expect(tl.message).not.toBe(en.message);
    expect(ceb.message).not.toBe(en.message);
    expect(ceb.message).not.toBe(tl.message);
  });

  it('gives each band of a section its own message', () => {
    const messages = ['excellent', 'good', 'fair', 'attention', 'support']
      .map((band) => sectionInterpretation('Financial', band, 'en').message);
    expect(new Set(messages).size).toBe(5);
  });

  // A category added to the database later has no tailored wording; the
  // patient must still be told what their band means, not shown a blank.
  it('falls back to a general band message for an unknown section', () => {
    const result = sectionInterpretation('Occupational', 'attention', 'tl');
    expect(result.about).toBeNull();
    expect(result.message).toEqual(expect.any(String));
    expect(result.message).not.toBe(sectionInterpretation('Occupational', 'attention', 'en').message);
    expect(result.message).not.toBe(sectionInterpretation('Occupational', 'good', 'tl').message);
  });

  it('falls back to English for an unknown language', () => {
    expect(sectionInterpretation('Social', 'good', 'xx'))
      .toEqual(sectionInterpretation('Social', 'good', 'en'));
  });

  it('describes the section but gives no verdict when it could not be scored', () => {
    const result = sectionInterpretation('Physical', null, 'en');
    expect(result.about).toMatch(/pain/i);
    expect(result.message).toBeNull();
  });
});

describe('overallInterpretation', () => {
  it('translates the overall message', () => {
    expect(overallInterpretation('good', 'ceb')).not.toBe(overallInterpretation('good', 'en'));
    expect(overallInterpretation('good', 'tl')).toEqual(expect.any(String));
  });

  it('has nothing to say without a score', () => {
    expect(overallInterpretation(null, 'en')).toBeNull();
  });
});

describe('resultsText', () => {
  it('translates the band labels', () => {
    expect(resultsText('tl').bands.support).not.toBe(resultsText('en').bands.support);
    expect(resultsText('ceb').bands.support).not.toBe(resultsText('en').bands.support);
  });

  it('formats the overall percentage in every language', () => {
    ['en', 'tl', 'ceb'].forEach((lang) => {
      expect(resultsText(lang).overallPercent(82.5)).toContain('82.5%');
    });
  });

  it('falls back to English strings for an unknown language', () => {
    expect(resultsText('xx').bands).toEqual(resultsText('en').bands);
  });
});
