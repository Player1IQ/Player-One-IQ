import type { Creator, SocialHandle } from "@/lib/creators";
import type { ContractStatus } from "@/lib/contracts";
import type { CreatorAudienceAnalytics } from "@/lib/platform-oauth/creator-analytics";
import type { PlatformContentSnapshot } from "@/lib/platform-oauth/content-performance";
import {
  MEDIA_KIT_HIGHLIGHT_LIMIT,
  type MediaKitHighlight,
  type MediaKitSnapshot,
} from "./types";

const PAST_PARTNER_STATUSES: ContractStatus[] = ["active", "completed"];

export interface PastPartnerContract {
  creatorId: string;
  status: ContractStatus;
  sponsorName: string;
}

export function collectPastPartnerNames(
  contracts: PastPartnerContract[],
  creatorId: string
): string[] {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const contract of contracts) {
    if (contract.creatorId !== creatorId) continue;
    if (!PAST_PARTNER_STATUSES.includes(contract.status)) continue;
    const name = contract.sponsorName.trim();
    if (!name || name.toLowerCase() === "unknown") continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }

  return names;
}

export function selectKitHighlights(
  snapshots: PlatformContentSnapshot[],
  limit = MEDIA_KIT_HIGHLIGHT_LIMIT
): MediaKitHighlight[] {
  const items: MediaKitHighlight[] = [];

  for (const snapshot of snapshots) {
    if (!snapshot.connectedViaOAuth) continue;
    for (const item of snapshot.items) {
      items.push({
        id: item.id,
        title: item.title,
        platform: snapshot.platform,
        views: item.viewCount,
        publishedAt: item.publishedAt,
        contentType: item.contentType,
      });
    }
  }

  return items
    .sort((left, right) => right.views - left.views)
    .slice(0, limit);
}

function kitHandles(creator: Creator): SocialHandle[] {
  return creator.socialHandles.filter(
    (handle): handle is SocialHandle =>
      Boolean(handle.handle?.trim()) && Boolean(handle.platform)
  );
}

export function overlayMediaKitIdentity(
  snapshot: MediaKitSnapshot,
  params: {
    creator: Creator;
    kitBio: string;
    organizationName: string;
    contracts: PastPartnerContract[];
  }
): MediaKitSnapshot {
  return {
    ...snapshot,
    name: params.creator.name,
    avatarUrl: params.creator.avatarUrl,
    avatarInitials: params.creator.avatarInitials,
    avatarColor: params.creator.avatarColor,
    primaryPlatform: params.creator.primaryPlatform,
    kitBio: params.kitBio.trim(),
    email: params.creator.email?.trim() || null,
    organizationName: params.organizationName,
    handles: kitHandles(params.creator),
    pastPartners: collectPastPartnerNames(params.contracts, params.creator.id),
  };
}

export function buildMediaKitSnapshot(params: {
  creator: Creator;
  kitBio: string;
  organizationName: string;
  analytics: CreatorAudienceAnalytics | null;
  contentSnapshots: PlatformContentSnapshot[];
  contracts: PastPartnerContract[];
}): MediaKitSnapshot {
  const audience = (params.analytics?.platformBreakdown ?? [])
    .filter((row) => row.connectedViaOAuth)
    .map((row) => ({
      platform: row.platform,
      audienceSize: row.audienceSize,
      contentCount: row.contentCount,
      totalViews: row.totalViews,
    }));

  const audienceTotal = audience
    .map((row) => row.audienceSize)
    .filter((size): size is number => size != null && size > 0)
    .reduce((sum, size) => sum + size, 0);

  return {
    name: params.creator.name,
    avatarUrl: params.creator.avatarUrl,
    avatarInitials: params.creator.avatarInitials,
    avatarColor: params.creator.avatarColor,
    primaryPlatform: params.creator.primaryPlatform,
    kitBio: params.kitBio.trim(),
    email: params.creator.email?.trim() || null,
    organizationName: params.organizationName,
    handles: kitHandles(params.creator),
    audience,
    totalAudience: audienceTotal > 0 ? audienceTotal : null,
    totalViews: params.analytics?.hasOAuthContent
      ? params.analytics.totalViews
      : null,
    totalContent: params.analytics?.totalContent ?? 0,
    highlights: selectKitHighlights(params.contentSnapshots),
    pastPartners: collectPastPartnerNames(params.contracts, params.creator.id),
  };
}
