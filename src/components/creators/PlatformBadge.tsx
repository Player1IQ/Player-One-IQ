import type { Platform } from "@/lib/creators";

const platformStyles: Record<Platform, string> = {
  YouTube: "bg-red-500/10 text-red-400 ring-red-500/20",
  Twitch: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
  TikTok: "bg-pink-500/10 text-pink-400 ring-pink-500/20",
  Instagram: "bg-fuchsia-500/10 text-fuchsia-400 ring-fuchsia-500/20",
  Kick: "bg-green-500/10 text-green-400 ring-green-500/20",
};

interface PlatformBadgeProps {
  platform: Platform;
}

export function PlatformBadge({ platform }: PlatformBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${platformStyles[platform]}`}
    >
      {platform}
    </span>
  );
}
