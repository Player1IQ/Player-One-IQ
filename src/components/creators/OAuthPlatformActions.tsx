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

export function OAuthPlatformActions({
  creatorId,
  platforms,
  layout = "row",
}: OAuthPlatformActionsProps) {
  const containerClass =
    layout === "stack"
      ? "flex flex-col gap-2"
      : "flex flex-wrap gap-2";

  return (
    <div className={containerClass}>
      {platforms.map(({ platform, status }) =>
        status === "available" ? (
          <a
            key={platform}
            href={oauthStartUrl(platform, creatorId)}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-gray-200 hover:border-accent/30"
          >
            Connect {platform} API
          </a>
        ) : (
          <span
            key={platform}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-sm text-gray-500"
            title="Automatic platform sync is coming soon"
          >
            Connect {platform} API
            <span className="rounded-full bg-surface-overlay px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Coming Soon
            </span>
          </span>
        )
      )}
    </div>
  );
}
