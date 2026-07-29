import test from "node:test";
import assert from "node:assert/strict";
import {
  isRolePreviewAllowed,
  parseRolePreviewCookie,
  getRolePreviewRedirectPath,
} from "../../src/lib/dev/role-preview";

test("isRolePreviewAllowed matches admin email case-insensitively", () => {
  assert.equal(isRolePreviewAllowed("Admin@PlayerOneIQ.com"), true);
  assert.equal(isRolePreviewAllowed("other@example.com"), false);
});

test("parseRolePreviewCookie validates role", () => {
  assert.deepEqual(
    parseRolePreviewCookie(
      JSON.stringify({
        role: "player",
        linkedCreatorId: "creator-1",
        linkedSponsorId: null,
      })
    ),
    {
      role: "player",
      linkedCreatorId: "creator-1",
      linkedSponsorId: null,
    }
  );
  assert.equal(parseRolePreviewCookie('{"role":"invalid"}'), null);
});

test("getRolePreviewRedirectPath sends portal roles to portal", () => {
  assert.equal(getRolePreviewRedirectPath("player"), "/portal");
  assert.equal(getRolePreviewRedirectPath("admin"), "/dashboard");
});
