import test from "node:test";
import assert from "node:assert/strict";
import { getOnboardingFlow } from "@/lib/onboarding/tour";
import { resolveOnboardingStepId } from "@/lib/onboarding/step-resolution";

const creatorFlow = getOnboardingFlow("content_creator");

test("URL step beats stale server initial step", () => {
  const step = resolveOnboardingStepId(creatorFlow, {
    stepFromUrl: "connect",
    serverInitialStep: "welcome",
  });
  assert.equal(step, "connect");
});

test("oauth result returns connect when step param is missing", () => {
  const step = resolveOnboardingStepId(creatorFlow, {
    stepFromUrl: null,
    oauthSuccess: "Twitch",
    serverInitialStep: "welcome",
  });
  assert.equal(step, "connect");
});

test("stored step is used when URL has no hints", () => {
  const step = resolveOnboardingStepId(creatorFlow, {
    stepFromUrl: null,
    storedStep: "finish",
    serverInitialStep: "welcome",
  });
  assert.equal(step, "finish");
});
