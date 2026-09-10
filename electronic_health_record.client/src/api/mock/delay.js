const DEFAULT_MS = 250;

export function delay(ms = DEFAULT_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
