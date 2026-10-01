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
