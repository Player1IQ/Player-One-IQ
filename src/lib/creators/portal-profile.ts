import type { Platform, SocialHandle } from "./types";

export interface CreatorPortalProfileInput {
  name: string;
  email: string;
  primaryPlatform: Platform;
  socialHandles: SocialHandle[];
  about: string;
}

export function creatorToPortalProfileInput(creator: {
  name: string;
  email: string | null;
  primaryPlatform: Platform;
  socialHandles: SocialHandle[];
  notes: string | null;
}): CreatorPortalProfileInput {
  return {
    name: creator.name,
    email: creator.email ?? "",
    primaryPlatform: creator.primaryPlatform,
    socialHandles:
      creator.socialHandles.length > 0
        ? creator.socialHandles
        : [{ platform: "YouTube", handle: "" }],
    about: creator.notes ?? "",
  };
}
