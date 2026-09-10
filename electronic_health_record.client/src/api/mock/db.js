import { buildSeed } from './seed';

const STORAGE_KEY = 'ehr-mock-db';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge in collections/counters added after this browser's db was first seeded.
      const seed = buildSeed();
      return { ...seed, ...parsed, nextIds: { ...seed.nextIds, ...parsed.nextIds } };
    }
  } catch {
    // Corrupt or unavailable storage falls back to a fresh seed.
  }
  return buildSeed();
}

let state = load();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked. In-memory state stays correct for this session.
  }
}

export const db = {
  read() {
    return clone(state);
  },

  /** Mutate the store in place. The mutator receives the live object. */
  write(mutator) {
    const result = mutator(state);
    persist();
    return result;
  },

  nextId(key) {
    const id = state.nextIds[key];
    state.nextIds[key] = id + 1;
    persist();
    return id;
  },

  rehydrate() {
    state = load();
  },

  reset() {
    state = buildSeed();
    persist();
  },
};
