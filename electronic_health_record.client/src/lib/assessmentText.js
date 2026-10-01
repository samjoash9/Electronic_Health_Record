// Resolves assessment wording for the kiosk's chosen language.
//
// Every lookup falls back to the English source text when a translation is
// missing, so a question added to the database without a translation shows
// in English rather than blank. That fallback is deliberate: a patient
// reading an untranslated question can still answer it, and an empty
// question would silently cost a clinically meaningful answer.

import {
  CATEGORY_NAMES, QUESTION_TEXT, OPTION_TEXT, UI_TEXT, DEFAULT_LANGUAGE,
} from '../i18n/assessmentTranslations';
import {
  RESULTS_TEXT, SECTION_TEXT, OVERALL_TEXT, GENERIC_SECTION_TEXT,
} from '../i18n/resultsTranslations';

/** @returns {boolean} true when `lang` needs no lookup at all. */
export function isSourceLanguage(lang) {
  return !lang || lang === DEFAULT_LANGUAGE;
}

export function categoryName(name, lang) {
  if (isSourceLanguage(lang)) return name;
  return CATEGORY_NAMES[lang]?.[name] ?? name;
}

export function questionText(question, lang) {
  if (isSourceLanguage(lang)) return question.questionText;
  // Keyed by the English text rather than questionID: the mock seed and the
  // database number the same 35 questions differently (101-705 vs 1-35), so
  // an ID lookup silently misses against one of the two backends.
  const key = question.questionText?.trim();
  return QUESTION_TEXT[lang]?.[key] ?? question.questionText;
}

export function optionText(option, lang) {
  if (isSourceLanguage(lang)) return option.optionText;
  // Keyed by lowercased English text -- see the note in the translations
  // module on why options are keyed by text and questions by ID.
  const key = option.optionText?.trim().toLowerCase();
  return OPTION_TEXT[lang]?.[key] ?? option.optionText;
}

/**
 * Kiosk chrome strings (button labels, counters).
 * @returns {object} the requested language's strings, or English defaults.
 */
export function uiText(lang) {
  const fallback = {
    answeredOverall: (answered, total) => `${answered} of ${total} answered overall`,
    questionsLeft: (n) => `${n} question${n === 1 ? '' : 's'} left in this section`,
    next: 'Next',
    previous: 'Previous',
    done: 'Done',
    language: 'Language',
  };
  if (isSourceLanguage(lang)) return fallback;
  return { ...fallback, ...(UI_TEXT[lang] ?? {}) };
}

// The results wording has its English in the translations module too (there
// is no database source for it), so these look up `lang` and fall back to
// the `en` entry rather than to a source string.
const pick = (table, lang) => table[lang] ?? table[DEFAULT_LANGUAGE];

/** Results screen chrome and band labels. */
export function resultsText(lang) {
  return { ...RESULTS_TEXT[DEFAULT_LANGUAGE], ...(RESULTS_TEXT[lang] ?? {}) };
}

/**
 * What a section measures and what its band means.
 * @returns {{ about: string|null, message: string|null }} `about` is null for
 * a section with no tailored wording (its message falls back to a general
 * one for the band); `message` is null when there is no band to explain.
 */
export function sectionInterpretation(categoryName, band, lang) {
  const section = pick(SECTION_TEXT, lang)[categoryName?.trim()];
  return {
    about: section?.about ?? null,
    message: band ? section?.[band] ?? pick(GENERIC_SECTION_TEXT, lang)[band] ?? null : null,
  };
}

/** @returns {string|null} the verdict on the overall average. */
export function overallInterpretation(band, lang) {
  return band ? pick(OVERALL_TEXT, lang)[band] ?? null : null;
}
