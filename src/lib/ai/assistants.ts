import type { AiAssistantResult, AiActionType } from "./types";
import type { AiAssistantType } from "@/lib/subscription/types";

const actionAssistantMap: Record<AiActionType, AiAssistantType> = {
  analyze_performance: "growth",
  growth_recommendations: "growth",
  content_strategy: "growth",
  sponsorship_targets: "growth",
  match_creators: "sponsorship",
  match_sponsors: "sponsorship",
  rank_opportunities: "sponsorship",
  forecast_earnings: "revenue",
  forecast_campaigns: "revenue",
  predict_contract_value: "revenue",
};

export function getAssistantForAction(action: AiActionType): AiAssistantType {
  return actionAssistantMap[action];
}

/** Placeholder AI responses until LLM / external API is connected */
export function generateAssistantResult(
  action: AiActionType,
  context?: { creatorName?: string; sponsorName?: string }
): AiAssistantResult {
  const assistantType = getAssistantForAction(action);
  const generatedAt = new Date().toISOString();
  const name = context?.creatorName ?? "your roster";

  if (assistantType === "growth") {
    return {
      assistantType,
      generatedAt,
      insights: [
        {
          id: "growth-1",
          title: "Audience engagement trend",
          summary: `${name} shows strongest engagement on live streams vs VOD. Consider scheduling 2 additional streams per week.`,
          confidence: 0.82,
          category: "performance",
        },
        {
          id: "growth-2",
          title: "Content strategy",
          summary:
            "Short-form highlight clips from streams are underused. Repurposing top VOD moments could grow reach 15–25%.",
          confidence: 0.76,
          category: "content",
        },
        {
          id: "growth-3",
          title: "Sponsorship targets",
          summary:
            "Gaming peripherals and energy drink brands align with audience demographics. Prioritize mid-tier endemic sponsors.",
          confidence: 0.71,
          category: "sponsorship",
        },
      ],
    };
  }

  if (assistantType === "sponsorship") {
    return {
      assistantType,
      generatedAt,
      insights: [
        {
          id: "match-1",
          title: "Top opportunity fit",
          summary:
            "Brand campaigns seeking FPS creators match 3 roster members with 85%+ audience overlap.",
          confidence: 0.88,
          category: "matching",
        },
      ],
      matches: [
        {
          id: "m1",
          name: context?.creatorName ?? "Creator A",
          entityType: "creator",
          fitScore: 92,
          reasons: ["Audience overlap", "Content category match", "Engagement rate"],
        },
        {
          id: "m2",
          name: context?.sponsorName ?? "Sponsor B",
          entityType: "sponsor",
          fitScore: 87,
          reasons: ["Budget alignment", "Campaign goals", "Past performance"],
        },
        {
          id: "m3",
          name: "Summer Launch Campaign",
          entityType: "opportunity",
          fitScore: 84,
          reasons: ["Platform fit", "Timeline", "Deliverable match"],
        },
      ],
    };
  }

  return {
    assistantType,
    generatedAt,
    insights: [
      {
        id: "rev-1",
        title: "Earnings forecast",
        summary:
          "Projected creator earnings next quarter: $12,400–$15,800 based on contract pipeline and platform revenue trends.",
        confidence: 0.79,
        category: "forecast",
      },
      {
        id: "rev-2",
        title: "Campaign ROI outlook",
        summary:
          "Active sponsor campaigns are tracking toward 3.2x estimated ROI with current conversion assumptions.",
        confidence: 0.74,
        category: "campaign",
      },
    ],
    forecasts: [
      {
        id: "f1",
        label: "Creator earnings (90 days)",
        period: "Next quarter",
        projectedAmount: 14100,
        currency: "USD",
        trend: "up",
        confidence: 0.79,
      },
      {
        id: "f2",
        label: "Contract value pipeline",
        period: "Next 6 months",
        projectedAmount: 48000,
        currency: "USD",
        trend: "stable",
        confidence: 0.72,
      },
    ],
  };
}

export const assistantDefinitions = [
  {
    type: "growth" as const,
    title: "AI Growth Assistant",
    description:
      "Analyze creator performance, recommend growth opportunities, content strategies, and sponsorship targets.",
    actions: [
      "analyze_performance",
      "growth_recommendations",
      "content_strategy",
      "sponsorship_targets",
    ] as AiActionType[],
    requiredFeatures: [
      "ai_growth",
      "ai_creator_performance",
    ] as const,
  },
  {
    type: "sponsorship" as const,
    title: "AI Sponsorship Assistant",
    description:
      "Match creators to sponsors, rank opportunity fit scores, and surface high-potential partnerships.",
    actions: [
      "match_creators",
      "match_sponsors",
      "rank_opportunities",
    ] as AiActionType[],
    requiredFeatures: [
      "ai_sponsorship",
      "ai_sponsorship_matching",
      "ai_creator_discovery",
    ] as const,
  },
  {
    type: "revenue" as const,
    title: "AI Revenue Assistant",
    description:
      "Forecast creator earnings, campaign performance, and predict contract values.",
    actions: [
      "forecast_earnings",
      "forecast_campaigns",
      "predict_contract_value",
    ] as AiActionType[],
    requiredFeatures: [
      "revenue_forecasting",
      "ai_forecasting",
      "ai_roi_forecasting",
    ] as const,
  },
];
