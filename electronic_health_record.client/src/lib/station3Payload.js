import { parseDiagnosticTests } from './diagnosticTests';

/**
 * The Station 3 consultation form's values -> the request body the server
 * stores. Shared by the consultation page itself and by the superadmin's
 * correction page, so a corrected record is written in exactly the shape the
 * station would have written it.
 */

export const BLANK_PMH_ROW = {
  conditionOther: '', yearDiagnosed: '',
  maintenanceDrugGeneric: '', dosage: '', frequency: '',
};

export const BLANK_MEDICATION_ROW = { drug: '', dosage: '', frequency: '' };

export const BLANK_EXERCISE_ROW = { exerciseType: '', exerciseFrequency: '', exerciseYearStarted: '' };

export const BLANK_FAMILY_OTHER_ROW = { conditionOther: '', conditionType: '' };

export const BLANK_SOCIAL_HISTORY = {
  // null means unanswered, so the Yes/No pair starts with neither selected.
  smokes: null,
  smokesCigarette: false,
  cigaretteSticksPerDay: '', cigaretteFrequency: '', cigaretteYearStarted: '', cigarettePuffsPerDay: '',
  smokesEcig: false,
  ecigPodsPerMonth: '', ecigFrequency: '', ecigYearStarted: '', ecigPuffsPerDay: '',
  alcoholType: '', drinkFrequency: '', drinksPerSession: '',
};

export const DEFAULT_CONSULTATION_VALUES = {
  familyHistory: {
    none: false,
    conditions: {},
    other: { checked: false, entries: [{ ...BLANK_FAMILY_OTHER_ROW }] },
  },
  pastMedicalHistory: [{ ...BLANK_PMH_ROW }],
  socialHistory: { ...BLANK_SOCIAL_HISTORY },
  exercise: [{ ...BLANK_EXERCISE_ROW }],
  recommendedDiagnosticTest: '',
  impressionClinical: '',
  medications: [{ ...BLANK_MEDICATION_ROW }],
  lifestyleFollowUp: '',
};

// Medication rows and the free-text advice are captured separately but stored
// in the one ManagementTreatment column the record already has, so the detail
// pages that read it back as plain text keep working unchanged.
// parseManagement (lib/consultationRecord.js) is the reverse of this.
export function buildManagementTreatment(values) {
  const rows = (values.medications ?? []).filter((row) => row.drug?.trim());

  const meds = rows.map((row) =>
    [row.drug.trim(), row.dosage?.trim(), row.frequency?.trim()]
      .filter(Boolean)
      .join(' — '),
  );

  const advice = values.lifestyleFollowUp?.trim();

  return [
    meds.length ? `Medications:\n${meds.map((m) => `• ${m}`).join('\n')}` : '',
    advice ? `Lifestyle advice and follow-up:\n${advice}` : '',
  ].filter(Boolean).join('\n\n') || null;
}

// Billing's source of truth for this visit (see WellnessFormCharge
// server-side). The free-text diagnostic field stays the physician-facing
// display text; this turns the same on-screen data into the line items
// billing actually totals from.
//
// Labs go through parseDiagnosticTests() -- the same parser that already
// reads recommendedDiagnosticTest back for display -- so a lab charge always
// agrees with what the physician sees on screen. No ChargeItemID is sent:
// the picker runs off its own local catalog copy rather than the server's, so
// the server resolves each name against the real catalog itself rather than
// trusting whatever price this parse found.
//
// Medications are prescribing detail only, not billed line items: they carry
// no price at Station 3 and so contribute nothing here. They stay recorded in
// ManagementTreatment for the physician-facing text.
export function buildCharges(values) {
  return parseDiagnosticTests(values.recommendedDiagnosticTest).map((row) => ({
    itemType: 'Lab',
    name: row.name,
    unitPrice: row.price,
    quantity: 1,
  }));
}

export function buildFamilyHistory(values) {
  const fh = values.familyHistory;
  if (fh.none) return [{ conditionID: 1, isNone: true, conditionType: null }];

  const rows = [];
  for (const [conditionID, entry] of Object.entries(fh.conditions ?? {})) {
    if (!entry?.checked) continue;
    rows.push({
      conditionID: Number(conditionID),
      isNone: false,
      conditionType: entry.conditionType || null,
    });
  }
  if (fh.other?.checked) {
    for (const entry of fh.other.entries ?? []) {
      if (!entry.conditionOther?.trim()) continue;
      rows.push({
        conditionID: null,
        conditionOther: entry.conditionOther.trim(),
        isNone: false,
        conditionType: entry.conditionType || null,
      });
    }
  }
  return rows;
}

// Station 3 itself only ever writes typed conditions (conditionID null), but a
// row carrying a catalog conditionID -- seeded data, an older form -- keeps
// it, so a superadmin correcting a different row does not drop this one.
export function buildPastMedicalHistory(values) {
  return (values.pastMedicalHistory ?? [])
    .filter((row) => row.conditionOther?.trim() || row.conditionID != null)
    .map((row) => ({
      conditionID: row.conditionID ?? null,
      conditionOther: row.conditionOther?.trim() || null,
      yearDiagnosed: row.yearDiagnosed ? Number(row.yearDiagnosed) : null,
      maintenanceDrugGeneric: row.maintenanceDrugGeneric || null,
      dosage: row.dosage || null,
      frequency: row.frequency || null,
    }));
}

export function buildExercise(values) {
  return (values.exercise ?? [])
    .filter((row) => row.exerciseType?.trim())
    .map((row) => ({
      exerciseType: row.exerciseType.trim(),
      exerciseFrequency: row.exerciseFrequency || null,
      exerciseYearStarted: row.exerciseYearStarted || null,
    }));
}

/** The tobacco block, cleared down to what the Yes/No and the two toggles allow. */
export function buildSocialHistory(values) {
  const social = values.socialHistory;
  const smokes = social.smokes === true;

  return {
    ...social,
    // Unanswered stays null; only an explicit Yes carries the rest.
    smokes: social.smokes ?? null,
    smokesCigarette: smokes ? Boolean(social.smokesCigarette) : false,
    smokesEcig: smokes ? Boolean(social.smokesEcig) : false,
    // Each sub-block's fields are cleared unless its own checkbox is on, so an
    // unchecked block can't submit stale values left over from when it was
    // checked.
    ...(smokes && social.smokesCigarette
      ? {
        cigaretteSticksPerDay: social.cigaretteSticksPerDay || null,
        cigaretteFrequency: social.cigaretteFrequency || null,
        cigaretteYearStarted: social.cigaretteYearStarted || null,
        cigarettePuffsPerDay: social.cigarettePuffsPerDay || null,
      }
      : {
        cigaretteSticksPerDay: null, cigaretteFrequency: null,
        cigaretteYearStarted: null, cigarettePuffsPerDay: null,
      }),
    ...(smokes && social.smokesEcig
      ? {
        ecigPodsPerMonth: social.ecigPodsPerMonth || null,
        ecigFrequency: social.ecigFrequency || null,
        ecigYearStarted: social.ecigYearStarted || null,
        ecigPuffsPerDay: social.ecigPuffsPerDay || null,
      }
      : {
        ecigPodsPerMonth: null, ecigFrequency: null,
        ecigYearStarted: null, ecigPuffsPerDay: null,
      }),
  };
}
