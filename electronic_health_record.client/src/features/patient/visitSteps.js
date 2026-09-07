/**
 * The four stops a patient physically walks through: registration desk,
 * assessment kiosk, consultation room, then the physician's signature. `done`
 * is what the patient reads once a stop is behind them; `waiting` is what they
 * read while standing at it — the past-tense copy would contradict itself if
 * it were shown for a stop that hasn't happened.
 */
export const STEPS = [
  {
    key: 'station1SubmittedAt',
    label: 'Registered',
    done: 'Personal details and vital signs recorded',
    waiting: 'Waiting for your details to be recorded',
  },
  {
    key: 'station2SubmittedAt',
    label: 'Assessed',
    done: 'Health assessment completed',
    waiting: 'Waiting for you to finish the health assessment',
  },
  {
    key: 'station3SubmittedAt',
    label: 'Consulted',
    done: 'Reviewed by the attending physician',
    waiting: 'Waiting for the physician to review your assessment',
  },
  {
    key: 'signedAt',
    label: 'Signed',
    done: 'Your record is now available',
    waiting: 'Waiting for the physician to sign your record',
  },
];

/** Index of the stop the visit is sitting at, or STEPS.length once it's done. */
export function currentStepIndex(form) {
  const index = STEPS.findIndex((step) => !form[step.key]);
  return index === -1 ? STEPS.length : index;
}
