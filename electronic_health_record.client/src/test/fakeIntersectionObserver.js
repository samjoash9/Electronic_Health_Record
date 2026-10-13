import { act } from '@testing-library/react';
import { vi } from 'vitest';

/**
 * jsdom has no IntersectionObserver. This stand-in tracks what each observer
 * watches, so a test can move an element into or out of view. Pair it with
 * vi.unstubAllGlobals() after the test.
 */
export function installFakeIntersectionObserver() {
  const observers = new Set();

  class FakeIntersectionObserver {
    constructor(callback, options = {}) {
      this.callback = callback;
      this.rootMargin = options.rootMargin ?? '0px';
      this.targets = new Set();
      observers.add(this);
    }

    observe(target) {
      this.targets.add(target);
    }

    unobserve(target) {
      this.targets.delete(target);
    }

    disconnect() {
      this.targets.clear();
      observers.delete(this);
    }

    takeRecords() {
      return [];
    }
  }

  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);

  return {
    /** Tells every observer watching `target` that it entered (or left) view. */
    setInView(target, isIntersecting = true) {
      act(() => {
        [...observers]
          .filter((observer) => observer.targets.has(target))
          .forEach((observer) =>
            observer.callback(
              [{ target, isIntersecting, intersectionRatio: isIntersecting ? 1 : 0, time: 0 }],
              observer
            )
          );
      });
    },
  };
}
