import test from "node:test";
import assert from "node:assert/strict";
import {
  publicSignupAccountOptions,
  isPublicSignupAccountType,
  signupAccountOptions,
} from "@/lib/organization";
import {
  isSelfServeCheckoutPlan,
  SPONSOR_PRO_REQUEST_ONLY_MESSAGE,
} from "@/lib/subscription/plans";
import { supportsPlatformTrial, getTrialPlanForOrgType } from "@/lib/subscription/trials";

test("public signup does not offer Brand / Sponsor", () => {
  assert.equal(
    publicSignupAccountOptions.some((option) => option.id === "sponsor"),
    false
  );
  assert.equal(
    signupAccountOptions.some((option) => option.id === "sponsor"),
    true
  );
  assert.equal(isPublicSignupAccountType("sponsor"), false);
  assert.equal(isPublicSignupAccountType("creator"), true);
  assert.equal(isPublicSignupAccountType("agency"), true);
});

test("Sponsor Pro is not a self-serve checkout or trial plan", () => {
  assert.equal(isSelfServeCheckoutPlan("sponsor_pro"), false);
  assert.equal(isSelfServeCheckoutPlan("agency"), true);
  assert.equal(supportsPlatformTrial("sponsor_pro"), false);
  assert.equal(getTrialPlanForOrgType("Brand / Sponsor"), "sponsor");
  assert.match(SPONSOR_PRO_REQUEST_ONLY_MESSAGE, /early access/i);
});
