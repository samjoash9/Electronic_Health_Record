/**
 * Reading a signed Station 3 record back for display: the visit it belongs
 * to, how long ago something started, and the free-text fields Station 3
 * packs structure into.
 */

/**
 * The year the visit took place. "Years since" counts to this rather than to
 * today, so an old record keeps saying what was true when it was written.
 */
export function visitYear(form) {
  const year = Number(String(form.formDate ?? form.signedAt ?? '').slice(0, 4));
  return year > 0 ? year : new Date().getFullYear();
}

/** Whole years from `year` (as typed, so maybe a string) to `asOf`; null when the year is unusable. */
export function yearsSince(year, asOf) {
  const start = Number(year);
  if (year === '' || year == null || !Number.isInteger(start) || start <= 0 || start > asOf) return null;
  return asOf - start;
}

const WORD_COUNTS = { once: 1, twice: 2, thrice: 3 };

/**
 * Days a week a typed frequency comes to, when it states one plainly:
 * "Daily", "Weekly", "3x a week", "twice a week". Anything vaguer
 * ("Occasionally", "Several times a week") is null rather than a guess.
 */
export function daysPerWeek(text) {
  if (!text) return null;
  const t = String(text).trim().toLowerCase();
  if (/^(daily|every ?day)$/.test(t)) return 7;
  if (/^weekly$/.test(t)) return 1;

  const match = /^(\d+|once|twice|thrice)\s*(?:x|×|times)?\s*(?:a|per|\/)\s*week$/.exec(t);
  if (!match) return null;
  const count = WORD_COUNTS[match[1]] ?? Number(match[1]);
  return count > 0 ? Math.min(count, 7) : null;
}

// The two headings buildManagementTreatment (Station3ConsultationPage) writes.
const MEDICATIONS = 'Medications:';
const ADVICE = 'Lifestyle advice and follow-up:';

/**
 * ManagementTreatment back into the parts Station 3 built it from: bulleted
 * "drug — dosage — frequency" lines under "Medications:", then the advice
 * under its own heading. Text in any other shape -- an older form, a hand
 * edit -- comes back whole as `other`, so nothing the physician wrote is lost.
 */
export function parseManagement(text) {
  const body = text?.trim();
  if (!body) return { medications: [], advice: null, other: null };
  if (!body.startsWith(MEDICATIONS) && !body.startsWith(ADVICE)) {
    return { medications: [], advice: null, other: body };
  }

  const adviceAt = body.indexOf(ADVICE);
  const medicationText = body.startsWith(MEDICATIONS)
    ? body.slice(MEDICATIONS.length, adviceAt === -1 ? undefined : adviceAt)
    : '';

  const medications = medicationText
    .split('\n')
    .map((line) => line.replace(/^\s*•\s*/, '').trim())
    .filter(Boolean)
    .map((line) => {
      const [drug, ...details] = line.split(' — ').map((part) => part.trim());
      return { drug, details: details.filter(Boolean) };
    });

  const advice = adviceAt === -1 ? null : body.slice(adviceAt + ADVICE.length).trim() || null;

  return { medications, advice, other: null };
}

const normalized = (name) => String(name ?? '').toLowerCase().replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();

/**
 * Whether two condition names mean the same thing: equal once case and any
 * bracketed note are set aside, or one is the other with words added
 * ("Diabetes" / "Diabetes mellitus"). Whole words only, so "Hypertension"
 * never matches "Hypertensive heart disease".
 */
export function sameCondition(a, b) {
  const x = normalized(a);
  const y = normalized(b);
  if (!x || !y) return false;
  return x === y || x.startsWith(`${y} `) || y.startsWith(`${x} `);
}

export function sameDrug(a, b) {
  const x = normalized(a);
  return Boolean(x) && x === normalized(b);
}

const per = (value, unit, period) => (value ? `${value} ${unit}${value === '1' ? '' : 's'} ${period}` : null);

/**
 * Social history as table rows, one per habit the patient reported: a row per
 * smoking product, a row per exercise, one for alcohol. A habit left blank
 * still gets a row with `type: null`, and one the patient said they don't
 * have carries `none` instead, so the table always reads all three.
 */
export function socialHistoryRows(social, exercise) {
  const rows = [];

  if (social?.smokes === false) {
    rows.push({ habit: 'smoking', none: 'Does not smoke' });
  } else if (social?.smokes && (social.smokesCigarette || social.smokesEcig)) {
    if (social.smokesCigarette) {
      rows.push({
        habit: 'smoking',
        type: 'Cigarette',
        frequency: social.cigaretteFrequency || null,
        amount: [per(social.cigaretteSticksPerDay, 'stick', 'a day'), per(social.cigarettePuffsPerDay, 'puff', 'a day')].filter(Boolean),
        yearStarted: social.cigaretteYearStarted || null,
      });
    }
    if (social.smokesEcig) {
      rows.push({
        habit: 'smoking',
        type: 'E-cigarette',
        frequency: social.ecigFrequency || null,
        amount: [per(social.ecigPuffsPerDay, 'puff', 'a day'), per(social.ecigPodsPerMonth, 'pod', 'a month')].filter(Boolean),
        yearStarted: social.ecigYearStarted || null,
      });
    }
  } else {
    rows.push({ habit: 'smoking', type: null });
  }

  const exercises = (exercise ?? []).filter((row) => row.exerciseType?.trim());
  if (exercises.length === 0) rows.push({ habit: 'exercise', type: null });
  for (const row of exercises) {
    rows.push({
      habit: 'exercise',
      type: row.exerciseType.trim(),
      frequency: row.exerciseFrequency || null,
      amount: [],
      yearStarted: row.exerciseYearStarted || null,
    });
  }

  if (social?.drinkFrequency === 'Never') {
    rows.push({ habit: 'alcohol', none: 'Does not drink' });
  } else {
    rows.push({
      habit: 'alcohol',
      type: social?.alcoholType || null,
      frequency: social?.drinkFrequency || null,
      amount: social?.drinksPerSession ? [`${social.drinksPerSession} a session`] : [],
      yearStarted: null,
    });
  }

  return rows;
}

/** "A", "A and B", "A, B and C". */
export function listNames(names) {
  if (names.length < 2) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
