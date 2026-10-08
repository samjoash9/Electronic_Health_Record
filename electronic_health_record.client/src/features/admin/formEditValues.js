import { parseManagement } from '../../lib/consultationRecord';
import { parseDiagnosticTests } from '../../lib/diagnosticTests';
import {
  BLANK_EXERCISE_ROW, BLANK_FAMILY_OTHER_ROW, BLANK_MEDICATION_ROW, BLANK_PMH_ROW, BLANK_SOCIAL_HISTORY,
  buildCharges, buildExercise, buildFamilyHistory, buildManagementTreatment,
  buildPastMedicalHistory, buildSocialHistory,
} from '../../lib/station3Payload';
import { validateYear } from '../../lib/yearBounds';

/**
 * The superadmin correction page edits Station 2 and Station 3 through the
 * stations' own inputs, so these helpers translate in both directions: a
 * stored record into the values those inputs hold, and the edited values back
 * into the sparse PATCH body.
 */

const text = (value) => (value == null ? '' : String(value));

/** A stored form -> the Station 3 consultation form's values. */
export function consultationValuesFromForm(form) {
  const familyRows = form.familyMedicalHistory ?? [];
  const none = familyRows.some((row) => row.isNone);
  const conditions = {};
  const otherEntries = [];

  if (!none) {
    for (const row of familyRows) {
      if (row.conditionID != null) {
        // Kept even when FAMILY_CONDITIONS no longer lists the id: the tile
        // is not drawn, but buildFamilyHistory still writes the row back.
        conditions[row.conditionID] = { checked: true, conditionType: text(row.conditionType) };
      } else if (row.conditionOther) {
        otherEntries.push({ conditionOther: row.conditionOther, conditionType: text(row.conditionType) });
      }
    }
  }

  const pastMedicalHistory = (form.pastMedicalHistory ?? []).map((row) => ({
    // Not an input: carried so a catalog-coded row survives a resave.
    conditionID: row.conditionID ?? null,
    conditionOther: text(row.conditionOther),
    yearDiagnosed: text(row.yearDiagnosed),
    maintenanceDrugGeneric: text(row.maintenanceDrugGeneric),
    dosage: text(row.dosage),
    frequency: text(row.frequency),
  }));

  const social = form.socialHistory;
  const socialHistory = { ...BLANK_SOCIAL_HISTORY };
  if (social) {
    for (const key of Object.keys(BLANK_SOCIAL_HISTORY)) {
      if (key === 'smokes') socialHistory.smokes = social.smokes ?? null;
      else if (key === 'smokesCigarette' || key === 'smokesEcig') socialHistory[key] = Boolean(social[key]);
      else socialHistory[key] = text(social[key]);
    }
  }

  const exercise = (form.exercise ?? []).map((row) => ({
    exerciseType: text(row.exerciseType),
    exerciseFrequency: text(row.exerciseFrequency),
    exerciseYearStarted: text(row.exerciseYearStarted),
  }));

  // Text in neither of Station 3's two headed shapes (an older form, a hand
  // edit) lands in the advice box whole rather than being dropped; it only
  // gains the heading if the operator actually edits this panel.
  const management = parseManagement(form.managementTreatment);
  const medications = management.medications.map(({ drug, details }) => ({
    drug,
    dosage: details[0] ?? '',
    frequency: details[1] ?? '',
  }));

  return {
    familyHistory: {
      none,
      conditions,
      other: {
        checked: otherEntries.length > 0,
        entries: otherEntries.length ? otherEntries : [{ ...BLANK_FAMILY_OTHER_ROW }],
      },
    },
    pastMedicalHistory: pastMedicalHistory.length ? pastMedicalHistory : [{ ...BLANK_PMH_ROW }],
    socialHistory,
    exercise: exercise.length ? exercise : [{ ...BLANK_EXERCISE_ROW }],
    recommendedDiagnosticTest: text(form.recommendedDiagnosticTest),
    impressionClinical: text(form.impressionClinical),
    medications: medications.length ? medications : [{ ...BLANK_MEDICATION_ROW }],
    lifestyleFollowUp: management.advice ?? management.other ?? '',
  };
}

/** The consultation values -> the PATCH fields Station 3 owns. */
function consultationPayload(values) {
  return {
    familyMedicalHistory: buildFamilyHistory(values),
    pastMedicalHistory: buildPastMedicalHistory(values),
    exercise: buildExercise(values),
    socialHistory: buildSocialHistory(values),
    impressionClinical: values.impressionClinical || null,
    managementTreatment: buildManagementTreatment(values),
  };
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Order-insensitive: the test grid rewrites the stored string in catalog
// order, which on its own is not a correction.
const testsKey = (value) =>
  parseDiagnosticTests(value).sort((a, b) => a.name.localeCompare(b.name));

/** The consultation PATCH keys whose content changed between the two values. */
export const CONSULTATION_KEYS = [
  'familyMedicalHistory',
  'pastMedicalHistory',
  'exercise',
  'socialHistory',
  'recommendedDiagnosticTest',
  'impressionClinical',
  'managementTreatment',
];

/**
 * What the operator changed in the consultation, as PATCH fields.
 *
 * Both sides go through the same builders before comparing, so a stored row
 * that rebuilds to the same payload is not a change -- comparing the built
 * values against the raw rows would flag every field whose stored shape
 * differs from the station's ("" vs null, a reformatted treatment text).
 *
 * A change to the ordered tests also resends `charges`: the billing lines are
 * derived from that list at Station 3, and a corrected test list billed at
 * the old lines would leave the bill disagreeing with the record.
 */
export function consultationChanges(initialValues, currentValues) {
  const before = consultationPayload(initialValues);
  const after = consultationPayload(currentValues);
  const out = {};

  for (const key of Object.keys(after)) {
    if (!same(before[key], after[key])) out[key] = after[key];
  }

  if (!same(testsKey(initialValues.recommendedDiagnosticTest), testsKey(currentValues.recommendedDiagnosticTest))) {
    out.recommendedDiagnosticTest = currentValues.recommendedDiagnosticTest || null;
    out.charges = buildCharges(currentValues);
  }

  return out;
}

/** The form's Station 2 answers as { questionID: optionID }. */
export function answersFromForm(form) {
  return Object.fromEntries(
    (form.assessmentAnswers ?? []).map((a) => [a.questionID, a.optionID]),
  );
}

/** How many questions now carry a different answer than they were saved with. */
export function changedAnswerCount(initial, current) {
  const ids = new Set([...Object.keys(initial), ...Object.keys(current)]);
  return [...ids].filter((id) => initial[id] !== current[id]).length;
}

/** The answer map -> Station 2's wire shape, in question order. */
export function answersPayload(answers) {
  return Object.entries(answers)
    .filter(([, optionID]) => optionID != null)
    .map(([questionID, optionID]) => ({ questionID: Number(questionID), optionID }))
    .sort((a, b) => a.questionID - b.questionID);
}

/** The visit date as the date input holds it: the stored value's calendar day. */
export function formDateValue(form) {
  return form.formDate ? String(form.formDate).slice(0, 10) : '';
}

/**
 * The year fields that fail `bounds`, as { name, message } in page order --
 * read off the values rather than the inputs' own rules, because the inputs
 * on a closed tab are not mounted and react-hook-form skips them.
 *
 * Only the sections in `keys` (the consultation keys being saved) are checked,
 * matching the server, which validates only what a PATCH sends: an old bad
 * year must not block an unrelated correction. A smoking year the form does
 * not show is skipped too; the payload sends it as null.
 */
export function consultationYearErrors(values, bounds, keys) {
  const sections = new Set(keys);
  const errors = [];
  const check = (name, value) => {
    const message = validateYear(value, bounds);
    if (message) errors.push({ name, message });
  };

  if (sections.has('pastMedicalHistory')) {
    (values.pastMedicalHistory ?? []).forEach((row, i) =>
      check(`pastMedicalHistory.${i}.yearDiagnosed`, row.yearDiagnosed));
  }

  const social = values.socialHistory ?? {};
  if (sections.has('socialHistory') && social.smokes === true) {
    if (social.smokesCigarette) check('socialHistory.cigaretteYearStarted', social.cigaretteYearStarted);
    if (social.smokesEcig) check('socialHistory.ecigYearStarted', social.ecigYearStarted);
  }

  if (sections.has('exercise')) {
    (values.exercise ?? []).forEach((row, i) =>
      check(`exercise.${i}.exerciseYearStarted`, row.exerciseYearStarted));
  }

  return errors;
}
