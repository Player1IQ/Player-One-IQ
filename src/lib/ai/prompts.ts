import type { PlatformContentSnapshot } from "@/lib/platform-oauth/content-performance";
import type { AiActionType } from "./types";

const responseSchema = `Respond with JSON only, matching this shape:
{
  "insights": [
    { "id": "string", "title": "string", "summary": "string", "confidence": 0.0-1.0, "category": "string" }
  ],
  "matches": [
    { "id": "string", "name": "string", "entityType": "creator|sponsor|opportunity", "fitScore": 0-100, "reasons": ["string"] }
  ],
  "forecasts": [
    { "id": "string", "label": "string", "period": "string", "projectedAmount": number, "currency": "USD", "trend": "up|down|stable", "confidence": 0.0-1.0 }
  ]
}
Include "matches" only for sponsorship matching actions. Include "forecasts" only for revenue forecasting actions.`;

const actionInstructions: Record<AiActionType, string> = {
  analyze_performance:
    "Analyze creator roster performance using the workspace data. Highlight strengths, risks, and engagement patterns.",
  growth_recommendations:
    "Recommend concrete growth opportunities for this workspace's creators. Prioritize actionable next steps.",
  content_strategy:
    "Suggest content strategies by platform and creator. Focus on formats, cadence, and topics.",
  sponsorship_targets:
    "Identify sponsorship categories and brand types that fit this roster. Be specific to gaming/creator economy.",
  match_creators:
    "Match creators to open opportunities or sponsor needs. Score fit 0-100 with clear reasons.",
  match_sponsors:
    "Match sponsors to creators in the roster. Score fit 0-100 with clear reasons.",
  rank_opportunities:
    "Rank opportunities by fit for this organization's creators. Include match scores.",
  forecast_earnings:
    "Forecast creator earnings for the next 90 days using contracts and platform revenue signals.",
  forecast_campaigns:
    "Forecast sponsor campaign performance and ROI outlook based on opportunities and contracts.",
  predict_contract_value:
    "Predict likely contract values for upcoming deals based on pipeline and historical contract values.",
};

export function buildContentAnalysisPrompt(
  creatorName: string,
  platformSnapshots: PlatformContentSnapshot[],
  workspaceJson: string
): { system: string; user: string } {
  const platformSections = platformSnapshots
    .map((snapshot) => {
      const itemsJson = JSON.stringify(snapshot.items, null, 2);
      return `### ${snapshot.platform}
Recent content (newest first):
${itemsJson}`;
    })
    .join("\n\n");

  const platformList = platformSnapshots.map((s) => s.platform).join(", ");

  return {
    system: `You are Player One IQ, a creator growth coach for gaming and streaming.
Analyze recent content across connected platforms and recommend the next moves: topics, formats, posting cadence, stream/game focus, and cross-platform repurposing.
Use only the provided data. Lower confidence when sample size is small.
When multiple platforms are present, call out platform-specific wins and what to repost or clip elsewhere.
Respond with JSON only:
{
  "insights": [
    { "id": "string", "title": "string", "summary": "string", "confidence": 0.0-1.0, "category": "performance|content|sponsorship" }
  ]
}`,
    user: `Creator: ${creatorName}
Platforms analyzed: ${platformList}

${platformSections}

Workspace context:
${workspaceJson}

Recommend: what to post/stream next, what to double down on, and how to repurpose top performers across platforms.`,
  };
}

export function buildAiPrompt(
  action: AiActionType,
  contextJson: string
): { system: string; user: string } {
  return {
    system: `You are Player One IQ, an expert advisor for gaming creators, agencies, and sponsors.
Use only the provided workspace data. If data is sparse, state assumptions clearly and lower confidence scores.
Be concise, practical, and specific to gaming/esports/creator economy.
${responseSchema}`,
    user: `Action: ${action}
Instruction: ${actionInstructions[action]}

Workspace data:
${contextJson}`,
  };
}

export function buildContractSummaryPrompt(
  contractContextJson: string
): { system: string; user: string } {
  return {
    system: `You are Player One IQ, a contract analyst for gaming creator agencies.
Summarize the deal: key terms, deliverable status, risks, recommended next actions, and negotiation state.
Use only the provided contract data. Lower confidence when data is sparse or the deal is early-stage.
Be concise, practical, and specific to gaming/esports sponsorship deals.
Respond with JSON only:
{
  "insights": [
    { "id": "string", "title": "string", "summary": "string", "confidence": 0.0-1.0, "category": "terms|deliverables|risk|negotiation|next_steps" }
  ]
}`,
    user: `Contract data:
${contractContextJson}

Provide 3–5 insights covering deal terms, deliverable progress, risks, negotiation gaps, and clear next steps for the agency team.`,
  };
}

export function buildQuestionPrompt(
  question: string,
  contextJson: string
): { system: string; user: string } {
  return {
    system: `You are Player One IQ, an expert advisor for gaming creators, agencies, and sponsors.
Answer the user's question using only the provided workspace data. If data is sparse, state assumptions clearly and lower confidence scores.
Be concise, practical, and specific to gaming/esports/creator economy.
${responseSchema}`,
    user: `User question: ${question}

Workspace data:
${contextJson}

Provide a direct, helpful answer as structured insights.`,
  };
}
