import { Mail } from "lucide-react";
import { BrandLogoLink } from "@/components/brand/BrandLogo";
import { CreatorAvatar } from "@/components/creators/CreatorAvatar";
import { PlatformBadge } from "@/components/creators/PlatformBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatChartCount } from "@/lib/charts/format";
import { platforms, type Platform } from "@/lib/creators";
import type { MediaKitRecord } from "@/lib/media-kit/types";

function isPlatform(value: string): value is Platform {
  return (platforms as string[]).includes(value);
}

function formatPublishedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function contentTypeLabel(type: string): string {
  if (type === "stream") return "Stream";
  if (type === "clip") return "Clip";
  if (type === "post") return "Post";
  if (type === "reel") return "Reel";
  return "Video";
}

export function PublicMediaKit({ kit }: { kit: MediaKitRecord }) {
  const snapshot = kit.snapshot;
  if (!snapshot) return null;

  const updatedLabel = kit.snapshotUpdatedAt
    ? new Date(kit.snapshotUpdatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const showAudience = kit.showAudience;
  const showHandles = kit.showHandles && snapshot.handles.length > 0;
  const showHighlights = kit.showHighlights;
  const showPartners = kit.showPastPartners;
  const showEmail = kit.showContactEmail && Boolean(snapshot.email);
  const bio = snapshot.kitBio.trim() || kit.kitBio.trim();

  return (
    <div className="min-h-screen bg-surface px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-surface-raised to-surface" />
          <div className="relative px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <CreatorAvatar
                imageUrl={snapshot.avatarUrl}
                initials={snapshot.avatarInitials}
                color={snapshot.avatarColor}
                name={snapshot.name}
                size="lg"
              />
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-accent-light">
                  Media kit
                </p>
                <h1 className="mt-1 text-3xl font-bold text-white">{snapshot.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {isPlatform(snapshot.primaryPlatform) ? (
                    <PlatformBadge platform={snapshot.primaryPlatform} />
                  ) : null}
                  {snapshot.organizationName ? (
                    <span className="text-sm text-gray-400">
                      Represented by {snapshot.organizationName}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            {bio ? (
              <p className="mt-6 max-w-2xl text-sm leading-relaxed text-gray-300">{bio}</p>
            ) : null}
            {showEmail ? (
              <a
                href={`mailto:${snapshot.email}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent-light hover:text-white"
              >
                <Mail className="h-4 w-4" />
                {snapshot.email}
              </a>
            ) : null}
          </div>
        </div>

        {showAudience ? (
          <Card>
            <CardHeader>
              <CardTitle>Audience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {snapshot.audience.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Connected platform audience will appear here after YouTube, Twitch,
                  Instagram, TikTok, or Kick is linked. TikTok currently shares profile
                  info only; Kick highlights livestreams.
                </p>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/[0.06] bg-surface px-4 py-3">
                      <p className="text-xs text-gray-500">Audience</p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {snapshot.totalAudience != null
                          ? formatChartCount(snapshot.totalAudience)
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-surface px-4 py-3">
                      <p className="text-xs text-gray-500">Recent views</p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {snapshot.totalViews != null
                          ? formatChartCount(snapshot.totalViews)
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-surface px-4 py-3">
                      <p className="text-xs text-gray-500">Recent content</p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {snapshot.totalContent > 0
                          ? snapshot.totalContent.toLocaleString()
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {snapshot.audience.map((row) => (
                      <li
                        key={row.platform}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface px-4 py-3"
                      >
                        {isPlatform(row.platform) ? (
                          <PlatformBadge platform={row.platform} />
                        ) : (
                          <span className="text-sm text-gray-200">{row.platform}</span>
                        )}
                        <p className="text-sm text-gray-400">
                          {row.audienceSize != null
                            ? `${formatChartCount(row.audienceSize)} audience`
                            : "Audience n/a"}
                          {" · "}
                          {formatChartCount(row.totalViews)} views
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        ) : null}

        {showHandles ? (
          <Card>
            <CardHeader>
              <CardTitle>Handles</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3">
                {snapshot.handles.map((handle) => (
                  <li
                    key={`${handle.platform}-${handle.handle}`}
                    className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface px-4 py-3"
                  >
                    <PlatformBadge platform={handle.platform} />
                    <p className="text-sm font-medium text-gray-200">{handle.handle}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {showHighlights ? (
          <Card>
            <CardHeader>
              <CardTitle>Content highlights</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {snapshot.highlights.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Highlights come from connected OAuth accounts. TikTok needs video
                  access for posts; Kick currently includes livestreams only.
                </p>
              ) : (
                <ul className="space-y-3">
                  {snapshot.highlights.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg border border-border-subtle bg-surface px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {isPlatform(item.platform) ? (
                          <PlatformBadge platform={item.platform} />
                        ) : null}
                        <span className="text-xs text-gray-500">
                          {contentTypeLabel(item.contentType)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-100">{item.title}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatChartCount(item.views)} views
                        {formatPublishedAt(item.publishedAt)
                          ? ` · ${formatPublishedAt(item.publishedAt)}`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}

        {showPartners ? (
          <Card>
            <CardHeader>
              <CardTitle>Past partners</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {snapshot.pastPartners.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Brand partners from completed and active deals will appear here.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {snapshot.pastPartners.map((name) => (
                    <li
                      key={name}
                      className="rounded-full border border-white/[0.08] bg-surface px-3 py-1 text-sm text-gray-200"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}

        <footer className="flex flex-col items-center gap-3 pb-6 pt-2 text-center">
          <BrandLogoLink href="/" size="sm" />
          <p className="text-xs text-gray-600">
            Player One IQ
            {updatedLabel ? ` · Updated ${updatedLabel}` : ""}
          </p>
        </footer>
      </div>
    </div>
  );
}
