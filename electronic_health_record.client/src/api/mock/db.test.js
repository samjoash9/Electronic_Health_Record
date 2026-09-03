import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';

beforeEach(() => {
  localStorage.clear();
  db.reset();
});

describe('mock db', () => {
  it('starts from the seed', () => {
    expect(db.read().assessmentCategories).toHaveLength(4);
    expect(db.read().forms).toHaveLength(0);
  });

  it('applies a mutation and persists it', () => {
    db.write((state) => {
      state.forms.push({ formID: 1, status: 'PendingAssessment' });
    });
    expect(db.read().forms).toHaveLength(1);
  });

  it('hands out increasing ids', () => {
    expect(db.nextId('formID')).toBe(1);
    expect(db.nextId('formID')).toBe(2);
    expect(db.nextId('patientID')).toBe(1);
  });

  it('survives a reload by rehydrating from localStorage', () => {
    db.write((state) => {
      state.forms.push({ formID: 1, status: 'PendingAssessment' });
    });
    db.rehydrate();
    expect(db.read().forms).toHaveLength(1);
  });

  it('returns a deep copy so callers cannot mutate stored state', () => {
    const first = db.read();
    first.forms.push({ formID: 99 });
    expect(db.read().forms).toHaveLength(0);
  });

  it('reset clears back to the seed', () => {
    db.write((state) => { state.forms.push({ formID: 1 }); });
    db.reset();
    expect(db.read().forms).toHaveLength(0);
  });
});
