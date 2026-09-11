// Station 1 registration drafts.
//
// A copy of station3Draft.js rather than a shared abstraction: the two
// stations store different shapes and version independently, and the
// codebase already keeps station-scoped modules separate. Backed by
// localStorage -- there is no server-side draft endpoint -- so a draft
// lives in one browser on one machine. It is a crash/misclick safety net,
// not a handoff mechanism.
//
// Keyed by externalEmployeeId rather than a formID: no form exists yet at
// this station, and the field is set once at employee selection and never
// edited afterwards (see Station1Page's onSelectEmployee), so it is stable
// for the life of the draft.

const PREFIX = 'ehr:station1-draft:';
const VERSION = 1;

function keyFor(externalEmployeeId) {
  return `${PREFIX}${externalEmployeeId}`;
}

/**
 * Persist an in-progress registration (identity fields + vitals).
 * @returns {string|null} ISO timestamp of the save, or null if it failed.
 */
export function saveDraft(externalEmployeeId, { values, step }) {
  if (!externalEmployeeId) return null;
  const savedAt = new Date().toISOString();
  try {
    localStorage.setItem(
      keyFor(externalEmployeeId),
      JSON.stringify({ version: VERSION, savedAt, values, step }),
    );
    return savedAt;
  } catch {
    // Storage disabled, or quota exceeded.
    return null;
  }
}

/**
 * Read a previously saved draft.
 * @returns {{savedAt: string, values: object, step: number}|null}
 */
export function loadDraft(externalEmployeeId) {
  if (!externalEmployeeId) return null;
  try {
    const raw = localStorage.getItem(keyFor(externalEmployeeId));
    if (!raw) return null;
    const draft = JSON.parse(raw);
    // Ignore drafts written by an older shape rather than half-restoring them.
    if (draft?.version !== VERSION) return null;
    return draft;
  } catch {
    return null;
  }
}

export function clearDraft(externalEmployeeId) {
  if (!externalEmployeeId) return;
  try {
    localStorage.removeItem(keyFor(externalEmployeeId));
  } catch {
    // Nothing to recover from; the draft is advisory.
  }
}
