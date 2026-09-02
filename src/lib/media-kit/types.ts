import type { Platform } from "@/lib/creators";
import type { ContentItemType } from "@/lib/platform-oauth/content-performance";

export interface MediaKitSectionFlags {
  showAudience: boolean;
  showHandles: boolean;
  showHighlights: boolean;
  showPastPartners: boolean;
  showContactEmail: boolean;
}

export interface MediaKitHighlight {
  id: string;
  title: string;
  platform: Platform;
  views: number;
  publishedAt: string;
  contentType: ContentItemType;
}

export interface MediaKitAudienceRow {
  platform: string;
  audienceSize: number | null;
  contentCount: number;
  totalViews: number;
}

export interface MediaKitHandle {
  platform: Platform;
  handle: string;
}

export interface MediaKitSnapshot {
  name: string;
  avatarUrl: string | null;
  avatarInitials: string;
  avatarColor: string;
  primaryPlatform: Platform;
  kitBio: string;
  email: string | null;
  organizationName: string;
  handles: MediaKitHandle[];
  audience: MediaKitAudienceRow[];
  totalAudience: number | null;
  totalViews: number | null;
  totalContent: number;
  highlights: MediaKitHighlight[];
  pastPartners: string[];
}

export interface MediaKitRecord extends MediaKitSectionFlags {
  id: string;
  organizationId: string;
  creatorId: string;
  token: string;
  enabled: boolean;
  kitBio: string;
  snapshot: MediaKitSnapshot | null;
  snapshotUpdatedAt: string | null;
}

export const MEDIA_KIT_BIO_MAX_LENGTH = 800;
export const MEDIA_KIT_HIGHLIGHT_LIMIT = 8;

export const defaultMediaKitFlags: MediaKitSectionFlags = {
  showAudience: true,
  showHandles: true,
  showHighlights: true,
  showPastPartners: false,
  showContactEmail: false,
};
