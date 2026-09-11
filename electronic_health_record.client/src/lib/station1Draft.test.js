import { describe, it, expect, beforeEach } from 'vitest';
import { saveDraft, loadDraft, clearDraft } from './station1Draft';

beforeEach(() => {
  localStorage.clear();
});

describe('station1Draft', () => {
  it('round-trips a saved draft', () => {
    const savedAt = saveDraft('PHO-1001', { values: { surname: 'Cruz' }, step: 2 });
    expect(savedAt).toEqual(expect.any(String));

    const draft = loadDraft('PHO-1001');
    expect(draft).toMatchObject({ savedAt, values: { surname: 'Cruz' }, step: 2 });
  });

  it('returns null when nothing was saved', () => {
    expect(loadDraft('PHO-9999')).toBeNull();
  });

  it('ignores a draft written by an older version', () => {
    localStorage.setItem('ehr:station1-draft:PHO-1001', JSON.stringify({ version: 0, values: {} }));
    expect(loadDraft('PHO-1001')).toBeNull();
  });

  it('removes the draft on clear', () => {
    saveDraft('PHO-1001', { values: {}, step: 1 });
    clearDraft('PHO-1001');
    expect(loadDraft('PHO-1001')).toBeNull();
  });

  it('does nothing without an employee id', () => {
    expect(saveDraft(null, { values: {}, step: 1 })).toBeNull();
    expect(loadDraft(null)).toBeNull();
    expect(() => clearDraft(null)).not.toThrow();
  });

  it('keeps drafts for different employees separate', () => {
    saveDraft('PHO-1001', { values: { surname: 'Cruz' }, step: 2 });
    saveDraft('PHO-2002', { values: { surname: 'Reyes' }, step: 1 });

    expect(loadDraft('PHO-1001').values.surname).toBe('Cruz');
    expect(loadDraft('PHO-2002').values.surname).toBe('Reyes');
  });
});
