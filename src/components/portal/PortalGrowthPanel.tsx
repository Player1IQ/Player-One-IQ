"use client";

import Link from "next/link";
import { BarChart3, Link2, TrendingUp } from "lucide-react";
import type { CreatorPlatformSummary } from "@/lib/creators/platform-summary";
import { PlatformBadge } from "@/components/creators/PlatformBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

interface PortalGrowthPanelProps {
  creatorId: string;
  summary: CreatorPlatformSummary;
}

function formatViews(views: number): string {
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1)}M`;
  }
  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1)}K`;
  }
  return String(views);
}

export function PortalGrowthPanel({ creatorId, summary }: PortalGrowthPanelProps) {
  const profileHref = `/creators/${creatorId}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent-light" />
          Growth & platforms
        </CardTitle>
        <CardDescription>
          Connected social accounts and recent content performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Connected platforms
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {summary.connectedCount}
            </p>
          </div>
          {summary.totalAudience && summary.totalAudience > 0 ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Total audience
              </p>
              <p className="mt-1 text-2xl font-bold text-sky-300">
                {formatViews(summary.totalAudience)}
              </p>
            </div>
          ) : null}
          {summary.hasOAuthContent && summary.totalRecentViews !== null ? (
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Recent content views
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-300">
                {formatViews(summary.totalRecentViews)}
              </p>
            </div>
          ) : summary.totalAudience && summary.totalAudience > 0 ? null : (
            <p className="max-w-xs text-sm text-gray-500">
              {summary.youtubeConnected
                ? "Syncing content metrics from your connected accounts."
                : "Connect YouTube to see growth metrics from recent content."}
            </p>
          )}
        </div>

        {summary.platforms.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {summary.platforms.map((account) => (
              <li key={account.id}>
                <PlatformBadge platform={account.platform} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            No platforms connected yet. Link your accounts to track audience growth.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            href={profileHref}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-accent/40 hover:text-accent-light"
          >
            <Link2 className="h-4 w-4" />
            Connect more platforms
          </Link>
          {summary.hasOAuthContent ? (
            <Link
              href="/portal/growth"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:border-accent/20 hover:text-gray-200"
            >
              <BarChart3 className="h-4 w-4" />
              View full analytics
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
