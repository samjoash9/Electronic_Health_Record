import { describe, it, expect } from 'vitest';
import { STEPS, currentStepIndex } from './visitSteps';

describe('currentStepIndex', () => {
  it('reports every step done for a form completed under the current six-step pipeline', () => {
    const form = {
      status: 'Completed',
      currentStation: 5,
      station1SubmittedAt: '2026-01-01T00:00:00Z',
      station2SubmittedAt: '2026-01-01T00:01:00Z',
      station3SubmittedAt: '2026-01-01T00:02:00Z',
      station4SubmittedAt: '2026-01-01T00:03:00Z',
      station5SubmittedAt: '2026-01-01T00:04:00Z',
      signedAt: '2026-01-01T00:02:00Z',
    };
    expect(currentStepIndex(form)).toBe(STEPS.length);
  });

  // A form can be Completed at CurrentStation 3: rows written before Station 4
  // (Dental) and Station 5 (Vision) existed, when Station 3 completed the
  // form directly. CK_WellnessForm_CompletedIsDentalSigned and
  // CK_WellnessForm_CompletedIsVisionSigned both carve this out explicitly
  // (their "CurrentStation < 4" / "< 5" clauses) -- it is not invalid data,
  // it is legacy data the schema was deliberately kept compatible with.
  it('reports every step done for a legacy form completed before Station 4/5 existed', () => {
    const form = {
      status: 'Completed',
      currentStation: 3,
      station1SubmittedAt: '2025-01-01T00:00:00Z',
      station2SubmittedAt: '2025-01-01T00:01:00Z',
      station3SubmittedAt: '2025-01-01T00:02:00Z',
      station4SubmittedAt: null,
      station5SubmittedAt: null,
      signedAt: '2025-01-01T00:02:00Z',
    };
    expect(currentStepIndex(form)).toBe(STEPS.length);
  });

  it('reports the first not-yet-done step for a form still in progress', () => {
    const form = {
      status: 'PendingDental',
      currentStation: 4,
      station1SubmittedAt: '2026-01-01T00:00:00Z',
      station2SubmittedAt: '2026-01-01T00:01:00Z',
      station3SubmittedAt: '2026-01-01T00:02:00Z',
      station4SubmittedAt: null,
      station5SubmittedAt: null,
      signedAt: '2026-01-01T00:02:00Z',
    };
    // Dental is STEPS[3]
    expect(currentStepIndex(form)).toBe(3);
  });
});
