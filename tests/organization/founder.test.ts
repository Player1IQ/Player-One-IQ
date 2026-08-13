import { describe, expect, it } from "vitest";
import { isSoloCreatorWorkspaceFounder } from "@/lib/organization/founder";

describe("isSoloCreatorWorkspaceFounder", () => {
  it("returns true for creator portal users who own a Creator / Player org", () => {
    expect(
      isSoloCreatorWorkspaceFounder({
        organizationType: "Creator / Player",
        organizationUserId: "user-1",
        currentUserId: "user-1",
        role: "content_creator",
      })
    ).toBe(true);
  });

  it("returns false for invited creators on agency workspaces", () => {
    expect(
      isSoloCreatorWorkspaceFounder({
        organizationType: "Gaming Agency",
        organizationUserId: "agency-owner",
        currentUserId: "creator-user",
        role: "content_creator",
      })
    ).toBe(false);
  });
});
