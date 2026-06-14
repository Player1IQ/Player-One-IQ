"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, Eye, Users, TrendingUp } from "lucide-react";
import type { CreatorAudienceAnalytics } from "@/lib/platform-oauth/creator-analytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { PlatformBadge } from "./PlatformBadge";
import type { Platform } from "@/lib/creators";

const chartTooltipStyle = {
  backgroundColor: "#111520",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  fontSize: "12px",
};

function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

interface CreatorAudienceGrowthProps {
  analytics: CreatorAudienceAnalytics;
  canViewAnalytics: boolean;
  canViewAdvancedAnalytics: boolean;
}

export function CreatorAudienceGrowth({
  analytics,
  canViewAnalytics,
  canViewAdvancedAnalytics,
}: CreatorAudienceGrowthProps) {
  if (!canViewAnalytics) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent-light" />
            <CardTitle>Audience & Growth</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <UpgradePrompt
            compact
            featureLabel="Creator analytics"
            message="Upgrade to Creator Pro or Agency to unlock audience and content performance analytics."
          />
        </CardContent>
      </Card>
    );
  }

  const connectedPlatforms = analytics.platformBreakdown.filter(
    (row) => row.connectedViaOAuth
  );
  const hasContent = analytics.hasOAuthContent;
  const totalAudience = connectedPlatforms.reduce(
    (sum, row) => sum + (row.audienceSize ?? 0),
    0
  );
  const hasAudienceData = connectedPlatforms.some(
    (row) => row.audienceSize !== null && row.audienceSize > 0
  );

  const platformChartData = analytics.platformBreakdown
    .filter((row) => row.connectedViaOAuth && row.totalViews > 0)
    .map((row) => ({
      platform: row.platform,
      views: row.totalViews,
      engagement: row.totalEngagement,
    }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-accent-light" />
          <CardTitle>Audience & Growth</CardTitle>
        </div>
        <CardDescription>
          Content performance and platform reach from connected OAuth accounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {analytics.connectedOAuthCount === 0 ? (
          <EmptyState
            icon={Users}
            title="No OAuth platforms connected"
            description="Connect YouTube, Twitch, Instagram, or TikTok below to see audience analytics."
          />
        ) : !hasContent && !hasAudienceData ? (
          <EmptyState
            icon={BarChart3}
            title="No content data yet"
            description="Sync connected accounts or publish recent content to populate performance charts."
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Views"
                value={formatCount(analytics.totalViews)}
                subtitle="Recent content snapshots"
                icon={Eye}
                iconColor="text-accent-light"
              />
              <MetricCard
                title="Content Pieces"
                value={String(analytics.totalContent)}
                subtitle="Across connected platforms"
                icon={BarChart3}
                iconColor="text-violet-400"
              />
              <MetricCard
                title="Connected Platforms"
                value={String(analytics.connectedOAuthCount)}
                subtitle="OAuth-linked accounts"
                icon={Users}
                iconColor="text-emerald-400"
              />
              <MetricCard
                title="Audience Reach"
                value={hasAudienceData ? formatCount(totalAudience) : "—"}
                subtitle={
                  hasAudienceData
                    ? "Followers & subscribers"
                    : "Available on YouTube & Twitch"
                }
                icon={TrendingUp}
                iconColor="text-amber-400"
              />
            </div>

            {canViewAdvancedAnalytics && platformChartData.length > 0 && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <h4 className="text-sm font-medium text-gray-300">
                    Views by platform
                  </h4>
                  <p className="mt-1 text-xs text-gray-500">
                    Total views from recent content per platform
                  </p>
                  <div className="mt-4 h-56 min-h-[14rem] min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={platformChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.04)"
                        />
                        <XAxis
                          dataKey="platform"
                          tick={{ fill: "#6B7280", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#6B7280", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Bar
                          dataKey="views"
                          fill="#7C3AED"
                          radius={[6, 6, 0, 0]}
                          name="Views"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {analytics.contentTrend.length > 0 && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <h4 className="text-sm font-medium text-gray-300">
                      Content performance trend
                    </h4>
                    <p className="mt-1 text-xs text-gray-500">
                      Views per recent post or video
                    </p>
                    <div className="mt-4 h-56 min-h-[14rem] min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.contentTrend}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.04)"
                          />
                          <XAxis
                            dataKey="label"
                            tick={{ fill: "#6B7280", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            angle={-25}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis
                            tick={{ fill: "#6B7280", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip contentStyle={chartTooltipStyle} />
                          <Line
                            type="monotone"
                            dataKey="views"
                            stroke="#A78BFA"
                            strokeWidth={2}
                            dot={{ fill: "#7C3AED", r: 3 }}
                            name="Views"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-300">
                Platform breakdown
              </h4>
              <p className="mt-1 text-xs text-gray-500">
                Posts, videos, and average views per connected platform
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {analytics.platformBreakdown
                  .filter((row) => row.connectedViaOAuth)
                  .map((row) => (
                    <div
                      key={row.platform}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <PlatformBadge platform={row.platform as Platform} />
                        {row.audienceSize !== null && row.audienceSize > 0 && (
                          <span className="text-xs text-gray-500">
                            {formatCount(row.audienceSize)} audience
                          </span>
                        )}
                      </div>
                      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <dt className="text-[10px] uppercase tracking-wide text-gray-500">
                            Content
                          </dt>
                          <dd className="mt-0.5 text-sm font-semibold text-white">
                            {row.contentCount}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10px] uppercase tracking-wide text-gray-500">
                            Views
                          </dt>
                          <dd className="mt-0.5 text-sm font-semibold text-white">
                            {formatCount(row.totalViews)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10px] uppercase tracking-wide text-gray-500">
                            Avg views
                          </dt>
                          <dd className="mt-0.5 text-sm font-semibold text-white">
                            {row.contentCount > 0
                              ? formatCount(row.avgViews)
                              : "—"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
