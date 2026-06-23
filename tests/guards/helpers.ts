import assert from "node:assert/strict";
import { test } from "node:test";

export type GuardCase = {
  pathname: string;
  expected: boolean;
  label?: string;
};

export function runGuardMatrix<T extends GuardCase>(
  suiteName: string,
  cases: T[],
  evaluate: (testCase: T) => boolean
): void {
  test(suiteName, async (t) => {
    for (const testCase of cases) {
      const name =
        testCase.label ??
        `${testCase.pathname} → ${testCase.expected ? "allowed" : "blocked"}`;

      await t.test(name, () => {
        const actual = evaluate(testCase);
        assert.equal(
          actual,
          testCase.expected,
          `expected ${testCase.expected ? "allowed" : "blocked"} for ${testCase.pathname}`
        );
      });
    }
  });
}
