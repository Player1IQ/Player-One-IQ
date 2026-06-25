import type { Platform, SocialHandle } from "@/lib/creators";

export interface CreatorPortalProfileInput {
  name: string;
  email: string;
  primaryPlatform: Platform;
  socialHandles: SocialHandle[];
}

export function creatorToPortalProfileInput(creator: {
  name: string;
  email: string | null;
  primaryPlatform: Platform;
  socialHandles: SocialHandle[];
}): CreatorPortalProfileInput {
  return {
    name: creator.name,
    email: creator.email ?? "",
    primaryPlatform: creator.primaryPlatform,
    socialHandles:
      creator.socialHandles.length > 0
        ? creator.socialHandles
        : [{ platform: "YouTube", handle: "" }],
  };
}
