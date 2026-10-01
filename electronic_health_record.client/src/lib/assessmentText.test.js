import { describe, it, expect } from 'vitest';
import {
  categoryName, questionText, optionText, uiText, isSourceLanguage,
} from './assessmentText';

const question = { questionID: 102, questionText: 'Do you feel inner peace most of the time?' };

describe('assessmentText', () => {
  it('returns the source text for English', () => {
    expect(questionText(question, 'en')).toBe(question.questionText);
    expect(optionText({ optionText: 'Always' }, 'en')).toBe('Always');
    expect(categoryName('Spiritual', 'en')).toBe('Spiritual');
  });

  it('translates a known question', () => {
    expect(questionText(question, 'tl')).toMatch(/kapayapaan/i);
    expect(questionText(question, 'ceb')).toMatch(/kalinaw/i);
  });

  // Regression: translations were first keyed by questionID, which made them
  // work against the mock (IDs 101-705) and silently fall back to English
  // against the database (same 35 questions, IDs 1-35) -- which is what the
  // kiosk actually runs on. Lookup is by text, so the ID must not matter.
  it('translates the same question under either backend numbering', () => {
    const mockShaped = { questionID: 102, questionText: question.questionText };
    const dbShaped = { questionID: 12, questionText: question.questionText };
    expect(questionText(dbShaped, 'tl')).toBe(questionText(mockShaped, 'tl'));
    expect(questionText(dbShaped, 'tl')).not.toBe(question.questionText);
  });

  it('translates a question with no id at all', () => {
    expect(questionText({ questionText: question.questionText }, 'ceb'))
      .toMatch(/kalinaw/i);
  });

  it('matches question text despite surrounding whitespace', () => {
    expect(questionText({ questionText: `  ${question.questionText} ` }, 'tl'))
      .toMatch(/kapayapaan/i);
  });

  it('translates option labels by their English text', () => {
    expect(optionText({ optionText: 'Always' }, 'tl')).toBe('Palagi');
    expect(optionText({ optionText: 'Always' }, 'ceb')).toBe('Kanunay');
  });

  it('matches option text regardless of case or padding', () => {
    expect(optionText({ optionText: '  ALWAYS ' }, 'tl')).toBe('Palagi');
  });

  // The important one: an untranslated question must stay readable rather
  // than render blank, or the patient loses a clinically meaningful answer.
  it('falls back to English for a question with no translation', () => {
    const untranslated = { questionID: 1, questionText: 'A newly added question?' };
    expect(questionText(untranslated, 'tl')).toBe('A newly added question?');
    expect(questionText(untranslated, 'ceb')).toBe('A newly added question?');
  });

  it('falls back to English for an unknown option label', () => {
    expect(optionText({ optionText: 'Somewhat' }, 'tl')).toBe('Somewhat');
  });

  it('falls back to English for an unknown category', () => {
    expect(categoryName('Occupational', 'tl')).toBe('Occupational');
  });

  it('falls back to the source text for an unknown language code', () => {
    expect(questionText(question, 'xx')).toBe(question.questionText);
    expect(optionText({ optionText: 'Always' }, 'xx')).toBe('Always');
  });

  it('treats a missing language as English', () => {
    expect(isSourceLanguage(undefined)).toBe(true);
    expect(questionText(question, undefined)).toBe(question.questionText);
  });

  it('gives every language a full set of ui strings', () => {
    ['en', 'tl', 'ceb'].forEach((lang) => {
      const t = uiText(lang);
      expect(t.next).toEqual(expect.any(String));
      expect(t.previous).toEqual(expect.any(String));
      expect(t.done).toEqual(expect.any(String));
      expect(t.answeredOverall(3, 35)).toContain('35');
      expect(t.questionsLeft(2)).toContain('2');
    });
  });

  it('pluralizes the English questions-left label', () => {
    expect(uiText('en').questionsLeft(1)).toBe('1 question left in this section');
    expect(uiText('en').questionsLeft(3)).toBe('3 questions left in this section');
  });
});
