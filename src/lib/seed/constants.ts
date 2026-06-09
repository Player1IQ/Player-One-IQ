export const SEED_MARKER = "seed:test-data";
export const SEED_TITLE_PREFIX = "Demo:";

export function isSeedEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}
