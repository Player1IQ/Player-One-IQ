import type { PostingCadenceInsight } from "./posting-cadence";
import type { CoachProfile } from "./profile-types";

export type RecommendationCategory =
  | "Content"
  | "Streaming"
  | "Community"
  | "Sponsors"
  | "Business"
  | "Monetization"
  | "Productivity"
  | "Learning"
  | "Networking"
  | "Branding"
  | "Analytics"
  | "Revenue"
  | "Goals"
  | "Personal Development"
  | "Financial";

export type RecommendationPriority = "Critical" | "High" | "Medium" | "Low";

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  whyItMatters: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  estimatedImpact: string;
  confidenceScore: number;
  actionLabel: string;
  actionRoute: string;
  learnMoreRoute?: string;
  dismissible: boolean;
  completed: boolean;
  dateGenerated: string;
}

export interface MissionTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface DailyMission {
  id: string;
  title: string;
  subtitle: string;
  tasks: MissionTask[];
  generatedAt: string;
  missionDate: string;
}

export interface CreatorCoachSnapshot {
  stateId: string | null;
  displayName: string;
  greeting: string;
  mission: DailyMission;
  recommendations: Recommendation[];
  progressPercent: number;
  scope: "creator" | "organization";
  scopeId: string | null;
}

export interface CoachContext {
  scope: "creator" | "organization";
  scopeId: string | null;
  displayName: string;
  creatorName?: string;
  primaryPlatform?: string;
  connectedPlatformCount: number;
  hasOAuthContent: boolean;
  totalRecentViews: number | null;
  totalAudience: number | null;
  streamedHours: number;
  clipsCreated: number;
  streamCount: number;
  videoCount: number;
  engagementRate: number;
  uploadsCompleted: number;
  uploadGoal: number;
  sponsorDeals: number;
  activeContracts: number;
  followersGrowth: number | null;
  streamScheduleMissing: boolean;
  noRevenueTracking: boolean;
  openDeliverables: number;
  overdueDeliverables: number;
  profileReadinessScore: number;
  profileReadinessItems: Array<{ id: string; label: string; done: boolean; href: string }>;
  openOpportunities: number;
  pendingApplications: number;
  todayScheduleCount: number;
  unreadMessages: number;
  activeCreatorsCount?: number;
  expiringContractsCount?: number;
  platformRevenueDisplay?: string;
  postingCadence?: PostingCadenceInsight | null;
  coachProfile?: CoachProfile | null;
}

export interface CoachRule {
  id: string;
  evaluate: (context: CoachContext) => Recommendation | null;
}

export interface CreatorCoachStateRow {
  id: string;
  organization_id: string;
  user_id: string;
  creator_id: string | null;
  mission_date: string;
  mission_json: DailyMission;
  dismissed_recommendation_ids: string[];
  completed_recommendation_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface CreatorCoachPersistedState {
  id: string;
  missionDate: string;
  mission: DailyMission;
  dismissedRecommendationIds: string[];
  completedRecommendationIds: string[];
}
