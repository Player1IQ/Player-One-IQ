import test from "node:test";
import assert from "node:assert/strict";
import {
  isPortalTourPending,
  onboardingCompletedMetadata,
  portalTourCompletedMetadata,
  portalTourPendingMetadata,
} from "@/lib/onboarding/state";

test("portal tour is pending after onboarding completes", () => {
  const metadata = onboardingCompletedMetadata();
  assert.equal(isPortalTourPending(metadata), true);
});

test("portal tour is not pending after the walkthrough finishes", () => {
  const metadata = portalTourCompletedMetadata();
  assert.equal(isPortalTourPending(metadata), false);
});

test("replay sets portal tour pending again", () => {
  const metadata = {
    ...portalTourCompletedMetadata(),
    ...portalTourPendingMetadata(),
  };
  assert.equal(isPortalTourPending(metadata), true);
});
