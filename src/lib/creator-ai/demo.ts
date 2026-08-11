import type { CreatorAiContext, CreatorAiMessage } from "./types";

function pickTopic(message: string): string {
  const q = message.toLowerCase();
  if (/\b(consistency|post|schedule|cadence)\b/.test(q)) return "consistency";
  if (/\b(sponsor|brand|deal)\b/.test(q)) return "sponsorship";
  if (/\b(recommend|priority|mission)\b/.test(q)) return "recommendations";
  if (/\b(content|video|stream|clip|perform)\b/.test(q)) return "content";
  return "general";
}

export function generateCreatorAiDemoResponse(
  userMessage: string,
  context: CreatorAiContext
): string {
  const topic = pickTopic(userMessage);
  const name = context.displayName.split(" ")[0] || "there";

  if (topic === "consistency") {
    const days = context.postingCadence?.typicalPostingDays?.join(", ");
    return `Hi ${name}! Based on your workspace data, consistency looks like the biggest lever right now.

${days ? `Your typical posting days appear to be ${days}.` : "I don't see enough posting history yet to infer a rhythm."}

**Suggested focus this week:**
- Block 2–3 fixed creation slots on your calendar
- Batch one short-form clip from your best recent piece
- Review your active recommendations in the sidebar for a quick win

This is demo mode — connect live AI for personalized coaching tied to your real-time metrics.`;
  }

  if (topic === "sponsorship") {
    return `Great question, ${name}. You have ${context.activeContracts} active contract${context.activeContracts === 1 ? "" : "s"} and ${context.openOpportunities} open opportunit${context.openOpportunities === 1 ? "y" : "ies"} in your pipeline.

**To strengthen your sponsor readiness:**
- Ensure your profile readiness score (${context.profileReadinessScore}%) is above 80%
- Highlight your top-performing content formats when pitching
- Follow up on ${context.pendingApplications} pending application${context.pendingApplications === 1 ? "" : "s"}

Demo mode — live AI will tailor sponsor strategy to your actual audience and deal history.`;
  }

  if (topic === "recommendations") {
    const recs = context.recentRecommendations.slice(0, 3);
    if (recs.length === 0) {
      return `You're caught up on recommendations, ${name}! Ask me about content strategy or consistency while you wait for new insights.`;
    }

    const list = recs
      .map((rec, i) => `${i + 1}. **${rec.title}** (${rec.priority} · ${rec.category})`)
      .join("\n");

    return `Here's how I'd prioritize your current recommendations, ${name}:

${list}

Start with the highest-priority item that matches your primary goal${context.coachProfile?.primaryGoal ? ` (${context.coachProfile.primaryGoal})` : ""}. Mark it complete in the sidebar when done!

Demo mode — live AI will reason across your full context.`;
  }

  if (topic === "content") {
    const platforms = context.platformBreakdown
      .slice(0, 3)
      .map((p) => `${p.platform}: ${p.totalViews.toLocaleString()} views across ${p.contentCount} items`)
      .join("\n");

    return `Looking at your content performance, ${name}:

${platforms || "Connect your platforms to unlock content analytics."}

Your engagement rate is ${context.engagementRate}%. Double down on formats that drive comments and shares — check your recent content list for patterns.

Demo mode — enable live AI for clip ideas and platform-specific strategy.`;
  }

  return `Thanks for reaching out, ${name}! I'm your Creator Coach assistant.

I can see you're working with ${context.connectedPlatformCount} connected platform${context.connectedPlatformCount === 1 ? "" : "s"}${context.totalRecentViews ? ` and ${context.totalRecentViews.toLocaleString()} recent views` : ""}.

Try asking about:
- What to focus on this week
- Posting consistency tips
- Which recommendations to prioritize
- Content performance insights

**Note:** You're in demo mode. Live AI responses use your full workspace context for personalized coaching.`;
}

export function deriveConversationTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 48) return trimmed || "New conversation";
  return `${trimmed.slice(0, 45)}…`;
}

export function buildChatHistoryForLlm(
  messages: CreatorAiMessage[]
): Array<{ role: "user" | "assistant"; content: string }> {
  return messages
    .filter((msg) => msg.role === "user" || msg.role === "assistant")
    .map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));
}
