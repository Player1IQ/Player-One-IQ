"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Eye, Users, TrendingUp } from "lucide-react";
import type { CreatorAudienceAnalytics } from "@/lib/platform-oauth/creator-analytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import {
  CHART_FRAME_DEFAULT_HEIGHT,
  CONTENT_TREND_CHART_HEIGHT,
  ChartFrame,
} from "@/components/charts/ChartFrame";
import { PlatformBadge } from "./PlatformBadge";
import type { Platform } from "@/lib/creators";
import {
  chartAxisTick,
  chartActiveBar,
  chartActiveBarMulti,
  chartBarCursor,
  chartCategoryLabel,
  chartGridStroke,
  chartTooltipStyle,
  formatChartCount,
  getChartAxisMax,
  getChartYAxisTicks,
  getContentTrendBarAxisConfig,
  wrapChartCategoryLabel,
} from "@/lib/charts/format";

const PLATFORM_BAR_COLORS: Record<string, string> = {
  YouTube: "#7C3AED",
  Twitch: "#9146FF",
  Instagram: "#E1306C",
  TikTok: "#00F2EA",
};

function PlatformViewsTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; dataKey?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const views = payload.find((entry) => entry.dataKey === "views")?.value ?? 0;

  return (
    <div style={chartTooltipStyle} className="px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-white">{label}</p>
      <p className="mt-1 text-xs text-gray-400">
        Views:{" "}
        <span className="font-semibold text-accent-light">
          {formatChartCount(views)}
        </span>
      </p>
    </div>
  );
}

function WeeklyViewsTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    value?: number;
    payload?: { label?: string; contentCount?: number };
  }>;
}) {
  if (!active || !payload?.length) return null;

  const views = payload[0]?.value ?? 0;
  const weekLabel = payload[0]?.payload?.label ?? "Week";
  const contentCount = payload[0]?.payload?.contentCount ?? 0;

  return (
    <div style={chartTooltipStyle} className="px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-white">Week of {weekLabel}</p>
      <p className="mt-1 text-xs text-gray-400">
        {contentCount} {contentCount === 1 ? "post" : "posts"} ·{" "}
        <span className="font-semibold text-accent-light">
          {formatChartCount(views)} views
        </span>
      </p>
    </div>
  );
}

function ContentTrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    value?: number;
    payload?: { label?: string; platform?: string };
  }>;
}) {
  if (!active || !payload?.length) return null;

  const views = payload[0]?.value ?? 0;
  const title = payload[0]?.payload?.label ?? "Content";
  const platform = payload[0]?.payload?.platform;

  return (
    <div style={chartTooltipStyle} className="px-3 py-2 shadow-lg">
      <p className="max-w-[18rem] text-xs font-medium leading-snug text-white">
        {title}
      </p>
      {platform ? (
        <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-500">
          {platform}
        </p>
      ) : null}
      <p className="mt-1 text-xs text-gray-400">
        Views:{" "}
        <span className="font-semibold text-accent-light">
          {formatChartCount(views)}
        </span>
      </p>
    </div>
  );
}

function ContentTrendBarAxisTick({
  x,
  y,
  index = 0,
  labels,
}: {
  x?: string | number;
  y?: string | number;
  index?: number;
  labels: string[][];
}) {
  const xPos = typeof x === "number" ? x : Number(x ?? 0);
  const yPos = typeof y === "number" ? y : Number(y ?? 0);
  const lines = labels[index] ?? [""];

  return (
    <g transform={`translate(${xPos},${yPos + 8})`}>
      {lines.map((line, lineIndex) => (
        <text
          key={`${index}-${lineIndex}`}
          x={0}
          y={lineIndex * 12}
          textAnchor="middle"
          fill="#6B7280"
          fontSize={10}
        >
          {line}
        </text>
      ))}
    </g>
  );
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

  const platformChartData = connectedPlatforms.map((row) => ({
    platform: row.platform,
    views: row.totalViews,
    engagement: row.totalEngagement,
    fill: PLATFORM_BAR_COLORS[row.platform] ?? "#7C3AED",
  }));

  const maxPlatformViews = Math.max(
    ...platformChartData.map((row) => row.views),
    0
  );
  const platformAxisMax = getChartAxisMax(maxPlatformViews);
  const platformAxisTicks = getChartYAxisTicks(maxPlatformViews);

  const contentTrendData = analytics.contentTrend;
  const weeklyViewsData = analytics.weeklyViewsTrend;
  const maxContentViews = Math.max(
    ...contentTrendData.map((point) => point.views),
    0
  );
  const contentAxisMax = getChartAxisMax(maxContentViews);
  const contentAxisTicks = getChartYAxisTicks(maxContentViews);
  const maxWeeklyViews = Math.max(
    ...weeklyViewsData.map((point) => point.views),
    0
  );
  const weeklyAxisMax = getChartAxisMax(maxWeeklyViews);
  const weeklyAxisTicks = getChartYAxisTicks(maxWeeklyViews);
  const useContentBarChart = contentTrendData.length <= 4;
  const barAxisConfig = getContentTrendBarAxisConfig(contentTrendData.length);
  const barAxisLabels = contentTrendData.map((point) =>
    wrapChartCategoryLabel(
      point.label,
      barAxisConfig.maxLines,
      barAxisConfig.maxCharsPerLine
    )
  );

  const contentTrendMargins = {
    top: 8,
    right: 12,
    bottom: useContentBarChart ? barAxisConfig.bottomMargin : 72,
    left: 8,
  } as const;

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
                value={formatChartCount(analytics.totalViews)}
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
                value={hasAudienceData ? formatChartCount(totalAudience) : "—"}
                subtitle={
                  hasAudienceData
                    ? "Followers & subscribers"
                    : "Available on YouTube & Twitch"
                }
                icon={TrendingUp}
                iconColor="text-amber-400"
              />
            </div>

            {canViewAdvancedAnalytics && connectedPlatforms.length > 0 && (
              <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <h4 className="text-sm font-medium text-gray-300">
                      Views by platform
                    </h4>
                    <p className="mt-1 text-xs text-gray-500">
                      Total views from recent content per platform
                    </p>
                    <div className="mt-4">
                      <ChartFrame height={CHART_FRAME_DEFAULT_HEIGHT}>
                        <ResponsiveContainer
                          width="100%"
                          height={CHART_FRAME_DEFAULT_HEIGHT}
                        >
                          <BarChart
                            data={platformChartData}
                            margin={{ top: 8, right: 8, bottom: 8, left: -12 }}
                            barCategoryGap="28%"
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke={chartGridStroke}
                              vertical={false}
                            />
                            <XAxis
                              dataKey="platform"
                              tick={chartAxisTick}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              domain={[0, platformAxisMax]}
                              allowDecimals={false}
                              ticks={platformAxisTicks}
                              tickFormatter={formatChartCount}
                              tick={chartAxisTick}
                              axisLine={false}
                              tickLine={false}
                              width={48}
                            />
                            <Tooltip
                              cursor={chartBarCursor}
                              wrapperStyle={{ outline: "none" }}
                              content={<PlatformViewsTooltip />}
                            />
                            <Bar
                              dataKey="views"
                              radius={[8, 8, 0, 0]}
                              maxBarSize={72}
                              name="Views"
                              activeBar={chartActiveBarMulti}
                            >
                              {platformChartData.map((entry) => (
                                <Cell key={entry.platform} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartFrame>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <h4 className="text-sm font-medium text-gray-300">
                      Views over time
                    </h4>
                    <p className="mt-1 text-xs text-gray-500">
                      Combined views on content published each week
                    </p>
                    {weeklyViewsData.length === 1 ? (
                      <p className="mt-1 text-xs text-gray-600">
                        One week of synced content so far. Publish more to see
                        how weekly views change.
                      </p>
                    ) : null}
                    <div className="mt-4">
                      {weeklyViewsData.length > 0 ? (
                        <ChartFrame height={CHART_FRAME_DEFAULT_HEIGHT}>
                          <ResponsiveContainer
                            width="100%"
                            height={CHART_FRAME_DEFAULT_HEIGHT}
                          >
                            <AreaChart
                              data={weeklyViewsData}
                              margin={{ top: 8, right: 12, bottom: 8, left: 8 }}
                            >
                              <defs>
                                <linearGradient
                                  id="weeklyViewsGrad"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#7C3AED"
                                    stopOpacity={0.35}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#7C3AED"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={chartGridStroke}
                                vertical={false}
                              />
                              <XAxis
                                dataKey="label"
                                tick={chartAxisTick}
                                axisLine={false}
                                tickLine={false}
                                tickMargin={8}
                              />
                              <YAxis
                                domain={[0, weeklyAxisMax]}
                                allowDecimals={false}
                                ticks={weeklyAxisTicks}
                                tickFormatter={formatChartCount}
                                tick={chartAxisTick}
                                axisLine={false}
                                tickLine={false}
                                width={48}
                              />
                              <Tooltip content={<WeeklyViewsTooltip />} />
                              <Area
                                type="monotone"
                                dataKey="views"
                                stroke="#7C3AED"
                                fill="url(#weeklyViewsGrad)"
                                strokeWidth={2}
                                dot={{ fill: "#A78BFA", r: 3, strokeWidth: 0 }}
                                activeDot={{ r: 5, fill: "#C4B5FD" }}
                                name="Views"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </ChartFrame>
                      ) : (
                        <p className="py-8 text-center text-sm text-gray-500">
                          Publish dated content on connected platforms to see
                          weekly trends.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {contentTrendData.length > 0 && (
                  <div className="overflow-visible rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <h4 className="text-sm font-medium text-gray-300">
                      Views per recent post
                    </h4>
                    <p className="mt-1 text-xs text-gray-500">
                      Each bar is one synced video, stream, or clip (
                      {contentTrendData.length}{" "}
                      {contentTrendData.length === 1 ? "post" : "posts"})
                    </p>
                    <div className="mt-4 overflow-visible">
                      <ChartFrame height={CONTENT_TREND_CHART_HEIGHT}>
                        <ResponsiveContainer
                          width="100%"
                          height={CONTENT_TREND_CHART_HEIGHT}
                        >
                          {useContentBarChart ? (
                            <BarChart
                              data={contentTrendData}
                              margin={contentTrendMargins}
                              barCategoryGap="28%"
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={chartGridStroke}
                                vertical={false}
                              />
                              {contentTrendData.length === 1 ? (
                                <XAxis dataKey="label" hide />
                              ) : (
                                <XAxis
                                  dataKey="label"
                                  axisLine={false}
                                  tickLine={false}
                                  interval={0}
                                  height={barAxisConfig.axisHeight}
                                  tickMargin={8}
                                  tick={(props) => (
                                    <ContentTrendBarAxisTick
                                      x={props.x}
                                      y={props.y}
                                      index={props.index}
                                      labels={barAxisLabels}
                                    />
                                  )}
                                />
                              )}
                              <YAxis
                                domain={[0, contentAxisMax]}
                                allowDecimals={false}
                                ticks={contentAxisTicks}
                                tickFormatter={formatChartCount}
                                tick={chartAxisTick}
                                axisLine={false}
                                tickLine={false}
                                width={48}
                              />
                              <Tooltip
                                cursor={chartBarCursor}
                                wrapperStyle={{ outline: "none" }}
                                content={<ContentTrendTooltip />}
                              />
                              <Bar
                                dataKey="views"
                                fill="#7C3AED"
                                radius={[8, 8, 0, 0]}
                                maxBarSize={72}
                                name="Views"
                                activeBar={chartActiveBar}
                              />
                            </BarChart>
                          ) : (
                            <BarChart
                              data={contentTrendData}
                              margin={contentTrendMargins}
                              barCategoryGap="12%"
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={chartGridStroke}
                                vertical={false}
                              />
                              <XAxis
                                dataKey="label"
                                tickFormatter={(value) =>
                                  chartCategoryLabel(String(value), 20)
                                }
                                tick={{ fill: "#6B7280", fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                interval={0}
                                angle={-25}
                                textAnchor="end"
                                height={72}
                                tickMargin={8}
                              />
                              <YAxis
                                domain={[0, contentAxisMax]}
                                allowDecimals={false}
                                ticks={contentAxisTicks}
                                tickFormatter={formatChartCount}
                                tick={chartAxisTick}
                                axisLine={false}
                                tickLine={false}
                                width={48}
                              />
                              <Tooltip
                                cursor={chartBarCursor}
                                wrapperStyle={{ outline: "none" }}
                                content={<ContentTrendTooltip />}
                              />
                              <Bar
                                dataKey="views"
                                fill="#7C3AED"
                                radius={[8, 8, 0, 0]}
                                maxBarSize={48}
                                name="Views"
                                activeBar={chartActiveBar}
                              />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </ChartFrame>
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
                {connectedPlatforms.map((row) => (
                  <div
                    key={row.platform}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <PlatformBadge platform={row.platform as Platform} />
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-center sm:grid-cols-4 sm:gap-x-3">
                      <div className="min-w-0 px-1">
                        <dt className="text-[10px] uppercase tracking-wide text-gray-500">
                          Content
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold text-white">
                          {row.contentCount}
                        </dd>
                      </div>
                      <div className="min-w-0 px-1">
                        <dt className="text-[10px] uppercase tracking-wide text-gray-500">
                          Views
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold text-white">
                          {formatChartCount(row.totalViews)}
                        </dd>
                      </div>
                      <div className="min-w-0 px-1">
                        <dt className="whitespace-nowrap text-[10px] uppercase tracking-wide text-gray-500">
                          Avg views
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold text-white">
                          {row.contentCount > 0
                            ? formatChartCount(row.avgViews)
                            : "—"}
                        </dd>
                      </div>
                      <div
                        className="min-w-0 px-1"
                        title={
                          row.audienceSize === null || row.audienceSize <= 0
                            ? "Audience size is not available for this platform yet"
                            : undefined
                        }
                      >
                        <dt className="whitespace-nowrap text-[10px] uppercase tracking-wide text-gray-500">
                          Audience
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold text-white">
                          {row.audienceSize !== null && row.audienceSize > 0
                            ? formatChartCount(row.audienceSize)
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
