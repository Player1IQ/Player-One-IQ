import test from "node:test";
import assert from "node:assert/strict";
import {
  fastCreatorOnboardingMetadata,
  onboardingCompletedMetadata,
  onboardingPendingMetadata,
  shouldShowOnboarding,
} from "@/lib/onboarding/state";

test("completed onboarding is not required even if the started cookie remains", () => {
  assert.equal(
    shouldShowOnboarding(onboardingCompletedMetadata(), { startedCookie: true }),
    false
  );
});

test("explicit pending still requires onboarding", () => {
  assert.equal(shouldShowOnboarding(onboardingPendingMetadata()), true);
});

test("skipped creator wizard is not required, even for a brand-new workspace", () => {
  assert.equal(
    shouldShowOnboarding(fastCreatorOnboardingMetadata(), {
      startedCookie: false,
      recentWorkspace: true,
    }),
    false
  );
});

test("agency that has not started is not forced by recency alone", () => {
  assert.equal(
    shouldShowOnboarding({}, { recentWorkspace: true }),
    false
  );
});

test("started cookie still opens onboarding when it is not completed", () => {
  assert.equal(shouldShowOnboarding({}, { startedCookie: true }), true);
});

test("portal onboarding is optional even with pending metadata or a started cookie", () => {
  assert.equal(
    shouldShowOnboarding(onboardingPendingMetadata(), { optional: true }),
    false
  );
  assert.equal(
    shouldShowOnboarding({}, { startedCookie: true, optional: true }),
    false
  );
});
