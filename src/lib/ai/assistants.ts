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

export function generateContractSummaryDemo(contract: {
  contractName: string;
  creatorName: string;
  sponsorName: string;
  status: string;
  contractValue: number;
}): AiAssistantResult {
  const generatedAt = new Date().toISOString();
  const valueDisplay = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(contract.contractValue);

  const statusInsights: Record<string, { title: string; summary: string }> = {
    draft: {
      title: "Finalize deal terms",
      summary: `"${contract.contractName}" is still a draft. Confirm deliverables, payment schedule, and exclusivity with ${contract.sponsorName} before moving to negotiation.`,
    },
    negotiating: {
      title: "Close the gap on value",
      summary: `Deal is in negotiation at ${valueDisplay}. Align ${contract.creatorName}'s rate expectations with ${contract.sponsorName}'s budget and document agreed changes in the deal room.`,
    },
    active: {
      title: "Track deliverable execution",
      summary: `Active deal worth ${valueDisplay} between ${contract.creatorName} and ${contract.sponsorName}. Monitor deliverable deadlines and flag any overdue items to the sponsor early.`,
    },
    completed: {
      title: "Capture learnings",
      summary: `Completed "${contract.contractName}" (${valueDisplay}). Review what worked with ${contract.sponsorName} and note renewal timing for ${contract.creatorName}'s pipeline.`,
    },
    expired: {
      title: "Renewal opportunity",
      summary: `Contract expired without renewal. Reach out to ${contract.sponsorName} with updated metrics for ${contract.creatorName} to reopen discussions.`,
    },
    cancelled: {
      title: "Post-mortem",
      summary: `Cancelled deal — document why terms with ${contract.sponsorName} did not close and whether ${contract.creatorName} should be pitched to alternative sponsors in the same category.`,
    },
  };

  const statusInsight =
    statusInsights[contract.status] ?? statusInsights.draft;

  return {
    assistantType: "revenue",
    generatedAt,
    insights: [
      {
        id: "contract-1",
        title: "Deal overview",
        summary: `"${contract.contractName}" — ${contract.creatorName} × ${contract.sponsorName}, ${contract.status} at ${valueDisplay}.`,
        confidence: 0.85,
        category: "terms",
      },
      {
        id: "contract-2",
        title: statusInsight.title,
        summary: statusInsight.summary,
        confidence: 0.78,
        category: "next_steps",
      },
      {
        id: "contract-3",
        title: "Deliverable risk check",
        summary:
          contract.status === "active"
            ? "Review open deliverables for overdue items. Proactive sponsor updates reduce payment delays and strengthen renewal odds."
            : "Define deliverables with due dates before activation so both parties share clear milestones.",
        confidence: 0.72,
        category: "deliverables",
      },
      {
        id: "contract-4",
        title: "Negotiation watch",
        summary:
          contract.status === "negotiating" || contract.status === "draft"
            ? `Confirm payment terms, usage rights, and termination clauses with ${contract.sponsorName} before signing.`
            : "Key terms appear settled — focus on execution quality and sponsor reporting cadence.",
        confidence: 0.7,
        category: "negotiation",
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
