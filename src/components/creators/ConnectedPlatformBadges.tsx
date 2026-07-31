import type { Platform } from "@/lib/creators";
import { PlatformBadge } from "./PlatformBadge";

interface ConnectedPlatformBadgesProps {
  platforms: Platform[];
  fallbackPlatform?: Platform | null;
}

export function ConnectedPlatformBadges({
  platforms,
  fallbackPlatform = null,
}: ConnectedPlatformBadgesProps) {
  const uniquePlatforms = [
    ...new Set(
      platforms.length > 0
        ? platforms
        : fallbackPlatform
          ? [fallbackPlatform]
          : []
    ),
  ];

  if (uniquePlatforms.length === 0) return null;

  return (
    <>
      {uniquePlatforms.map((platform) => (
        <PlatformBadge key={platform} platform={platform} />
      ))}
    </>
  );
}
