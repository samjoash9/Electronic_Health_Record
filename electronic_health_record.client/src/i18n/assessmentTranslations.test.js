import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import { describe, it, expect } from 'vitest';
import { QUESTION_TEXT, OPTION_TEXT, CATEGORY_NAMES } from './assessmentTranslations';
import { db } from '../api/mock/db';

// Guards the translations against the template drifting away from them.
// assessmentText.js falls back to English for anything missing, so a gap is
// not a crash -- it is a patient silently reading English on a screen they
// set to Bisaya, which no runtime check would ever surface. These tests are
// the only thing that catches it.
//
// Checked against BOTH backends. An earlier version of this file checked
// only the mock, which is why translations keyed to the mock's question IDs
// passed here while the kiosk -- which runs against the database, where the
// same questions carry different IDs -- showed English for every question.
// The mock is not the source of truth for what a patient sees.

// Resolved from the vitest working directory (the client project) rather
// than from import.meta.url: these tests run under jsdom, where
// import.meta.url is an http:// URL and fileURLToPath rejects it.
const DB_CONTEXT = resolve(
  cwd(),
  '../Electronic_Health_Record.Server/Data/ElectronicHealthRecordDbContext.cs',
);

/** Pulls the seeded English strings straight out of the EF model. */
function readServerSeed() {
  const cs = readFileSync(DB_CONTEXT, 'utf8');
  const grab = (re) => [...cs.matchAll(re)].map((m) => m[1]);
  return {
    questions: grab(/new AssessmentQuestion \{[^}]*QuestionText = "([^"]+)"/g),
    options: grab(/new AssessmentOption \{[^}]*OptionText = "([^"]+)"/g),
    categories: grab(/new AssessmentCategory \{[^}]*Name = "([^"]+)"/g),
  };
}

const serverSeed = readServerSeed();
const mockCategories = db.read().assessmentCategories;
const mockQuestions = mockCategories.flatMap((c) => c.questions);

// Both backends, deduped -- a translation must cover whichever one is live.
const questionTexts = [...new Set([
  ...mockQuestions.map((q) => q.questionText.trim()),
  ...serverSeed.questions.map((t) => t.trim()),
])];
const optionLabels = [...new Set([
  ...mockQuestions.flatMap((q) => q.options.map((o) => o.optionText)),
  ...serverSeed.options,
].map((t) => t.trim().toLowerCase()))];
const categoryNames = [...new Set([
  ...mockCategories.map((c) => c.name),
  ...serverSeed.categories,
].map((t) => t.trim()))];

describe('seed extraction', () => {
  // If these ever come back empty the coverage tests below would pass
  // vacuously, which is the exact failure mode being guarded against.
  it('reads the server seed', () => {
    expect(serverSeed.questions.length).toBeGreaterThanOrEqual(35);
    expect(serverSeed.categories.length).toBeGreaterThanOrEqual(7);
    expect(serverSeed.options.length).toBeGreaterThan(0);
  });
});

describe.each(['tl', 'ceb'])('%s translations', (lang) => {
  it('covers every question in both the mock and the database', () => {
    const missing = questionTexts.filter((text) => !QUESTION_TEXT[lang]?.[text]);
    expect(missing).toEqual([]);
  });

  it('covers every distinct answer label', () => {
    const missing = optionLabels.filter((label) => !OPTION_TEXT[lang]?.[label]);
    expect(missing).toEqual([]);
  });

  it('covers every category name', () => {
    const missing = categoryNames.filter((name) => !CATEGORY_NAMES[lang]?.[name]);
    expect(missing).toEqual([]);
  });

  it('has no question left as its English source text', () => {
    const untranslated = questionTexts.filter(
      (text) => QUESTION_TEXT[lang]?.[text] === text,
    );
    expect(untranslated).toEqual([]);
  });

  it('has no translation left blank', () => {
    const blank = Object.entries(QUESTION_TEXT[lang])
      .filter(([, text]) => !text?.trim())
      .map(([id]) => id);
    expect(blank).toEqual([]);
  });
});
