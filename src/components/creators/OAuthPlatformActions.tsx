import type { OAuthPlatformUi } from "@/lib/platform-oauth/types";
import { getOAuthPlatformSlug } from "@/lib/platform-oauth/platform-slug";

interface OAuthPlatformActionsProps {
  creatorId: string;
  platforms: OAuthPlatformUi[];
  layout?: "row" | "stack";
}

function oauthStartUrl(platform: OAuthPlatformUi["platform"], creatorId: string) {
  return `/api/platform-oauth/${getOAuthPlatformSlug(platform)}/start?creatorId=${creatorId}`;
}

function isConnectableOAuthPlatform(platform: OAuthPlatformUi["platform"]): boolean {
  return (
    platform === "YouTube" ||
    platform === "Twitch" ||
    platform === "Instagram" ||
    platform === "TikTok"
  );
}

export function OAuthPlatformActions({
  creatorId,
  platforms,
  layout = "row",
}: OAuthPlatformActionsProps) {
  const containerClass =
    layout === "stack" ? "flex flex-col gap-2" : "flex flex-wrap gap-2";

  const oauthEntries = platforms.filter((entry) =>
    isConnectableOAuthPlatform(entry.platform)
  );
  const comingSoonLabels = oauthEntries
    .filter((entry) => entry.status === "coming_soon")
    .map((entry) => entry.platform);

  return (
    <div className="space-y-2">
      <div className={containerClass}>
        {oauthEntries.map(({ platform, status }) =>
          status === "available" ? (
            <a
              key={platform}
              href={oauthStartUrl(platform, creatorId)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-gray-200 transition-colors hover:border-accent/30 hover:text-white"
            >
              Connect {platform}
            </a>
          ) : (
            <span
              key={platform}
              className="inline-flex items-center gap-2 rounded-lg border border-dashed border-white/[0.08] px-4 py-2 text-sm text-gray-500"
              title={`${platform} OAuth credentials are not configured yet`}
            >
              Connect {platform}
              <span className="rounded-full bg-surface-overlay px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Setup required
              </span>
            </span>
          )
        )}
      </div>
      {comingSoonLabels.length > 0 ? (
        <p className="text-xs text-gray-500">
          {comingSoonLabels.join(" & ")} sync coming soon.
        </p>
      ) : null}
    </div>
  );
}
