import type { CoachContext, Recommendation } from "@/lib/creator-coach/types";
import type { CoachProfile } from "@/lib/creator-coach/profile-types";

export type CreatorAiMessageRole = "user" | "assistant" | "system";

export interface CreatorAiConversation {
  id: string;
  organizationId: string;
  creatorId: string;
  userId: string;
  title: string;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorAiMessage {
  id: string;
  conversationId: string;
  organizationId: string;
  role: CreatorAiMessageRole;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CreatorAiContentItemSummary {
  id: string;
  title: string;
  platform: string;
  contentType: string;
  viewCount: number;
  publishedAt: string;
}

export interface CreatorAiPlatformAnalytics {
  platform: string;
  contentCount: number;
  totalViews: number;
  avgViews: number;
  totalEngagement: number;
  audienceSize: number | null;
}

export interface CreatorAiWeeklyTrendPoint {
  weekStart: string;
  label: string;
  views: number;
  contentCount: number;
}

export interface CreatorAiRecommendationSummary {
  id: string;
  title: string;
  category: string;
  priority: string;
}

export interface CreatorAiContext {
  displayName: string;
  primaryPlatform: string | null;
  connectedPlatformCount: number;
  hasOAuthContent: boolean;
  totalRecentViews: number | null;
  totalAudience: number | null;
  engagementRate: number;
  uploadsCompleted: number;
  uploadGoal: number;
  sponsorDeals: number;
  activeContracts: number;
  openDeliverables: number;
  overdueDeliverables: number;
  profileReadinessScore: number;
  openOpportunities: number;
  pendingApplications: number;
  streamScheduleMissing: boolean;
  noRevenueTracking: boolean;
  postingCadence: CoachContext["postingCadence"];
  coachProfile: CoachProfile | null;
  platformBreakdown: CreatorAiPlatformAnalytics[];
  weeklyViewsTrend: CreatorAiWeeklyTrendPoint[];
  recentContentByPlatform: Record<string, CreatorAiContentItemSummary[]>;
  recentRecommendations: CreatorAiRecommendationSummary[];
}

export interface CreatorAiConversationRow {
  id: string;
  organization_id: string;
  creator_id: string;
  user_id: string;
  title: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatorAiMessageRow {
  id: string;
  conversation_id: string;
  organization_id: string;
  role: CreatorAiMessageRole;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/** Conversation history retained for 30 days */
export const CREATOR_AI_RETENTION_DAYS = 30;

export function creatorAiRetentionCutoff(): Date {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - CREATOR_AI_RETENTION_DAYS);
  return cutoff;
}

export function isWithinCreatorAiRetention(isoDate: string): boolean {
  return new Date(isoDate).getTime() >= creatorAiRetentionCutoff().getTime();
}

export function mapConversationRow(row: CreatorAiConversationRow): CreatorAiConversation {
  return {
    id: row.id,
    organizationId: row.organization_id,
    creatorId: row.creator_id,
    userId: row.user_id,
    title: row.title,
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMessageRow(row: CreatorAiMessageRow): CreatorAiMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    organizationId: row.organization_id,
    role: row.role,
    content: row.content,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

export function summarizeRecommendations(
  recommendations: Recommendation[]
): CreatorAiRecommendationSummary[] {
  return recommendations.slice(0, 8).map((rec) => ({
    id: rec.id,
    title: rec.title,
    category: rec.category,
    priority: rec.priority,
  }));
}
