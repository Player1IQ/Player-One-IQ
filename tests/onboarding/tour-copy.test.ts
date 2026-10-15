import test from "node:test";
import assert from "node:assert/strict";
import { getOnboardingFlow } from "@/lib/onboarding/tour";

test("agency onboarding finishes on /dashboard, not marketing home", () => {
  const flow = getOnboardingFlow("owner");
  assert.equal(flow.finishHref, "/dashboard");
  assert.equal(flow.audience, "agency");
});

test("creator deliverables tour describes status tracking, not proof upload", () => {
  const flow = getOnboardingFlow("content_creator");
  const deliverables = flow.tourItems.find(
    (item) => item.href === "/portal/deliverables"
  );

  assert.ok(deliverables);
  assert.equal(deliverables.description.includes("upload proof"), false);
  assert.match(deliverables.description, /mark items complete/i);
});
