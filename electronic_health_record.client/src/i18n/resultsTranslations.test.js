import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import { describe, it, expect } from 'vitest';
import {
  RESULTS_TEXT, SECTION_TEXT, OVERALL_TEXT, GENERIC_SECTION_TEXT,
} from './resultsTranslations';
import { BANDS } from '../lib/interpretation';
import { db } from '../api/mock/db';

// Same guard as assessmentTranslations.test.js: the resolver falls back
// quietly, so a missing section or band shows up as English (or the generic
// message) on a screen set to Bisaya, and only these tests would notice.
// Category names come from BOTH backends for the reason given there.

const DB_CONTEXT = resolve(
  cwd(),
  '../Electronic_Health_Record.Server/Data/ElectronicHealthRecordDbContext.cs',
);

const serverCategories = [
  ...readFileSync(DB_CONTEXT, 'utf8')
    .matchAll(/new AssessmentCategory \{[^}]*Name = "([^"]+)"/g),
].map((m) => m[1].trim());

const categoryNames = [...new Set([
  ...db.read().assessmentCategories.map((c) => c.name.trim()),
  ...serverCategories,
])];

const blank = (text) => typeof text !== 'string' || !text.trim();

describe('category extraction', () => {
  it('reads the server seed', () => {
    expect(serverCategories.length).toBeGreaterThanOrEqual(7);
  });
});

describe.each(['en', 'tl', 'ceb'])('%s results wording', (lang) => {
  it('explains every section in every band', () => {
    const missing = categoryNames.flatMap((name) =>
      ['about', ...BANDS]
        .filter((key) => blank(SECTION_TEXT[lang]?.[name]?.[key]))
        .map((key) => `${name}.${key}`));
    expect(missing).toEqual([]);
  });

  it('has an overall and a general message for every band', () => {
    const missing = BANDS.filter(
      (band) => blank(OVERALL_TEXT[lang]?.[band]) || blank(GENERIC_SECTION_TEXT[lang]?.[band]),
    );
    expect(missing).toEqual([]);
  });

  it('labels every band', () => {
    expect(BANDS.filter((band) => blank(RESULTS_TEXT[lang]?.bands?.[band]))).toEqual([]);
  });

  it('carries every screen string English has', () => {
    const missing = Object.keys(RESULTS_TEXT.en).filter((key) => !(key in (RESULTS_TEXT[lang] ?? {})));
    expect(missing).toEqual([]);
  });
});

describe.each(['tl', 'ceb'])('%s results translation', (lang) => {
  it('leaves no section message as its English text', () => {
    const untranslated = categoryNames.flatMap((name) =>
      ['about', ...BANDS]
        .filter((key) => SECTION_TEXT[lang]?.[name]?.[key] === SECTION_TEXT.en[name]?.[key])
        .map((key) => `${name}.${key}`));
    expect(untranslated).toEqual([]);
  });
});
