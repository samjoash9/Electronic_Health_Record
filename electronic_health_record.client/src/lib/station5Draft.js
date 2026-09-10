// Station 5 vision drafts.
//
// A copy of station4Draft.js rather than a shared abstraction: the two stations
// store different shapes and version independently, and the codebase already
// keeps station-scoped modules separate. Backed by localStorage -- there is no
// server-side draft endpoint -- so a draft lives in one browser on one machine.
// It is a crash/misclick safety net, not a handoff mechanism.

const PREFIX = 'ehr:station5-draft:';
const VERSION = 1;

function keyFor(formID) {
  return `${PREFIX}${formID}`;
}

/**
 * Persist an in-progress vision assessment.
 * @returns {string|null} ISO timestamp of the save, or null if it failed.
 */
export function saveDraft(formID, { values, signature, optometristID = null }) {
  if (!formID) return null;
  const savedAt = new Date().toISOString();
  try {
    localStorage.setItem(
      keyFor(formID),
      JSON.stringify({ version: VERSION, savedAt, values, signature, optometristID }),
    );
    return savedAt;
  } catch {
    // Quota exceeded (a large signature data URL) or storage disabled.
    return null;
  }
}

/**
 * Read a previously saved draft.
 * @returns {{savedAt: string, values: object, signature: string|null,
 *   optometristID: number|null|undefined}|null}
 */
export function loadDraft(formID) {
  if (!formID) return null;
  try {
    const raw = localStorage.getItem(keyFor(formID));
    if (!raw) return null;
    const draft = JSON.parse(raw);
    // Ignore drafts written by an older shape rather than half-restoring them.
    if (draft?.version !== VERSION) return null;
    return draft;
  } catch {
    return null;
  }
}

export function clearDraft(formID) {
  if (!formID) return;
  try {
    localStorage.removeItem(keyFor(formID));
  } catch {
    // Nothing to recover from; the draft is advisory.
  }
}
