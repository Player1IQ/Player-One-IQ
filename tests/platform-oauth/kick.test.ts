import test from "node:test";
import assert from "node:assert/strict";
import { KICK_OAUTH_SCOPES } from "@/lib/platform-oauth/kick";
import { getOAuthPlatformSlug } from "@/lib/platform-oauth/platform-slug";
import {
  isOAuthPlatform,
  launchOAuthPlatforms,
  oauthPlatforms,
} from "@/lib/platform-oauth/types";

test("Kick is a first-class OAuth platform", () => {
  assert.equal(isOAuthPlatform("Kick"), true);
  assert.ok(oauthPlatforms.includes("Kick"));
  assert.equal(getOAuthPlatformSlug("Kick"), "kick");
  assert.equal(KICK_OAUTH_SCOPES, "user:read channel:read");
  assert.equal(launchOAuthPlatforms.includes("Kick"), false);
});
