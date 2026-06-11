import type { AiAssistantType } from "@/lib/subscription/types";

export interface AiInsight {
  id: string;
  title: string;
  summary: string;
  confidence: number;
  category: string;
}

export interface AiMatchScore {
  id: string;
  name: string;
  entityType: "creator" | "sponsor" | "opportunity";
  fitScore: number;
  reasons: string[];
}

export interface AiForecast {
  id: string;
  label: string;
  period: string;
  projectedAmount: number;
  currency: string;
  trend: "up" | "down" | "stable";
  confidence: number;
}

export interface AiAssistantResult {
  assistantType: AiAssistantType;
  generatedAt: string;
  insights: AiInsight[];
  matches?: AiMatchScore[];
  forecasts?: AiForecast[];
}

export type AiActionType =
  | "analyze_performance"
  | "growth_recommendations"
  | "content_strategy"
  | "sponsorship_targets"
  | "match_creators"
  | "match_sponsors"
  | "rank_opportunities"
  | "forecast_earnings"
  | "forecast_campaigns"
  | "predict_contract_value";
