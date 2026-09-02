import test from "node:test";
import assert from "node:assert/strict";
import { getOnboardingFlow } from "@/lib/onboarding/tour";

test("creator deliverables tour describes status tracking, not proof upload", () => {
  const flow = getOnboardingFlow("content_creator");
  const deliverables = flow.tourItems.find(
    (item) => item.href === "/portal/deliverables"
  );

  assert.ok(deliverables);
  assert.equal(deliverables.description.includes("upload proof"), false);
  assert.match(deliverables.description, /mark items complete/i);
});
