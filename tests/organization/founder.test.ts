import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isSoloCreatorWorkspaceFounder } from "@/lib/organization/founder";

describe("isSoloCreatorWorkspaceFounder", () => {
  it("returns true for creator portal users who own a Creator / Player org", () => {
    assert.equal(
      isSoloCreatorWorkspaceFounder({
        organizationType: "Creator / Player",
        organizationUserId: "user-1",
        currentUserId: "user-1",
        role: "content_creator",
      }),
      true
    );
  });

  it("returns false for invited creators on agency workspaces", () => {
    assert.equal(
      isSoloCreatorWorkspaceFounder({
        organizationType: "Gaming Agency",
        organizationUserId: "agency-owner",
        currentUserId: "creator-user",
        role: "content_creator",
      }),
      false
    );
  });
});
