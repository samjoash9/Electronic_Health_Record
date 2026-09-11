import { describe, it, expect, beforeEach } from 'vitest';
import { saveDraft, loadDraft, clearDraft } from './station2Draft';

beforeEach(() => {
  localStorage.clear();
});

describe('station2Draft', () => {
  it('round-trips a saved draft', () => {
    const savedAt = saveDraft(42, { answers: { 1: 'A' }, step: 2 });
    expect(savedAt).toEqual(expect.any(String));

    const draft = loadDraft(42);
    expect(draft).toMatchObject({ savedAt, answers: { 1: 'A' }, step: 2 });
  });

  it('returns null when nothing was saved', () => {
    expect(loadDraft(999)).toBeNull();
  });

  it('ignores a draft written by an older version', () => {
    localStorage.setItem('ehr:station2-draft:42', JSON.stringify({ version: 0, answers: {} }));
    expect(loadDraft(42)).toBeNull();
  });

  it('removes the draft on clear', () => {
    saveDraft(42, { answers: {}, step: 0 });
    clearDraft(42);
    expect(loadDraft(42)).toBeNull();
  });

  it('does nothing without a formID', () => {
    expect(saveDraft(null, { answers: {}, step: 0 })).toBeNull();
    expect(loadDraft(null)).toBeNull();
    expect(() => clearDraft(null)).not.toThrow();
  });

  it('keeps drafts for different forms separate', () => {
    saveDraft(1, { answers: { 1: 'A' }, step: 0 });
    saveDraft(2, { answers: { 1: 'B' }, step: 1 });

    expect(loadDraft(1).answers[1]).toBe('A');
    expect(loadDraft(2).answers[1]).toBe('B');
  });
});
