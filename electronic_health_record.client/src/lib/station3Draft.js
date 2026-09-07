// Station 3 consultation drafts.
//
// Backed by localStorage today: there is no server-side draft endpoint for
// station 3 (submitStation3 finalizes the form to Completed). Keep every read
// and write behind these four functions so swapping in an API call later is a
// change to this file only.
//
// Consequence of the current backing store: a draft lives in one browser on one
// machine. It is a crash/misclick safety net, not a handoff mechanism.

const PREFIX = 'ehr:station3-draft:';
const VERSION = 1;

function keyFor(formID) {
  return `${PREFIX}${formID}`;
}

/**
 * Persist an in-progress consultation.
 * @returns {string|null} ISO timestamp of the save, or null if it failed.
 */
export function saveDraft(formID, { values, signature }) {
  if (!formID) return null;
  const savedAt = new Date().toISOString();
  try {
    localStorage.setItem(
      keyFor(formID),
      JSON.stringify({ version: VERSION, savedAt, values, signature }),
    );
    return savedAt;
  } catch {
    // Quota exceeded (a large signature data URL) or storage disabled.
    return null;
  }
}

/**
 * Read a previously saved draft.
 * @returns {{savedAt: string, values: object, signature: string|null}|null}
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

export function hasDraft(formID) {
  return loadDraft(formID) !== null;
}
