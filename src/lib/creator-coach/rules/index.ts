import type { CoachContext, Recommendation } from "../types";
import { formatDayList } from "../posting-cadence";

function baseRecommendation(
  partial: Omit<Recommendation, "dismissible" | "completed" | "dateGenerated">
): Recommendation {
  return {
    ...partial,
    dismissible: true,
    completed: false,
    dateGenerated: new Date().toISOString(),
  };
}

export function evaluateClipRepurposeRule(
  context: CoachContext
): Recommendation | null {
  if (context.scope !== "creator") return null;
  if (context.streamedHours <= 20 || context.clipsCreated >= 10) return null;

  return baseRecommendation({
    id: "content-clip-repurpose",
    title: "Turn streams into short-form clips",
    description: `You've put in roughly ${context.streamedHours} hours of streaming recently but only have ${context.clipsCreated} clips. Repurpose highlights to reach audiences who don't catch live streams.`,
    whyItMatters:
      "Short-form clips drive discovery on TikTok, YouTube Shorts, and Instagram Reels — often outperforming full VOD uploads for new viewer acquisition.",
    category: "Content",
    priority: "High",
    estimatedImpact: "15–30% more reach from existing content",
    confidenceScore: 82,
    actionLabel: "Review content",
    actionRoute: context.scopeId
      ? `/creators/${context.scopeId}`
      : "/creators",
    learnMoreRoute: "/ai",
  });
}

export function evaluateSponsorshipReadinessRule(
  context: CoachContext
): Recommendation | null {
  if (context.scope !== "creator") return null;
  if (context.engagementRate <= 5 || context.sponsorDeals > 0) return null;

  return baseRecommendation({
    id: "sponsors-engagement-ready",
    title: "You're ready to pitch sponsors",
    description: `Your content engagement rate is ${context.engagementRate}% with no active sponsorship deals. Brands look for creators with proven audience interaction before signing.`,
    whyItMatters:
      "Strong engagement signals an invested audience — the top metric sponsors evaluate alongside reach and brand fit.",
    category: "Sponsors",
    priority: "High",
    estimatedImpact: "Unlock sponsorship pipeline",
    confidenceScore: 78,
    actionLabel: "Browse opportunities",
    actionRoute: "/opportunities",
    learnMoreRoute: "/opportunities?tab=marketplace",
  });
}

export function evaluateMissedPostingCadenceRule(
  context: CoachContext
): Recommendation | null {
  if (context.scope !== "creator") return null;

  const cadence = context.postingCadence;
  if (!cadence?.inferred || cadence.missedPostingDaysThisWeek.length === 0) {
    return null;
  }

  const missedLabel = formatDayList(cadence.missedPostingDaysThisWeek);
  const rhythmLabel = formatDayList(cadence.typicalPostingDays);
  const missedSet = new Set(cadence.missedPostingDaysThisWeek);
  const rhythmOnly = cadence.typicalPostingDays.filter((day) => !missedSet.has(day));
  const rhythmOnlyLabel = formatDayList(rhythmOnly);

  const description =
    rhythmOnly.length === 0 || rhythmOnlyLabel === missedLabel
      ? `You missed your usual upload days this week (${missedLabel}).`
      : `You missed ${cadence.missedPostingDaysThisWeek.length} expected upload${cadence.missedPostingDaysThisWeek.length === 1 ? "" : "s"} this week (${missedLabel}). Your connected platforms show you usually publish on ${rhythmOnlyLabel}.`;

  return baseRecommendation({
    id: "goals-missed-posting-cadence",
    title: "Catch up on missed uploads",
    description,
    whyItMatters:
      "Consistent publishing on your strongest days compounds algorithmic reach and trains your audience when to show up.",
    category: "Goals",
    priority:
      cadence.missedPostingDaysThisWeek.length >= 2 ? "High" : "Medium",
    estimatedImpact: "Recover weekly posting momentum",
    confidenceScore: 88,
    actionLabel: "Open content planner",
    actionRoute: "/schedule",
    learnMoreRoute: context.scopeId
      ? `/creators/${context.scopeId}`
      : "/portal/growth",
  });
}

export function evaluateUploadConsistencyRule(
  context: CoachContext
): Recommendation | null {
  if (context.scope !== "creator") return null;
  if (context.postingCadence?.inferred) return null;
  if (context.uploadsCompleted >= context.uploadGoal) return null;

  return baseRecommendation({
    id: "goals-upload-consistency",
    title: "Build a consistent upload rhythm",
    description: `You've published ${context.uploadsCompleted} recent pieces against a goal of ${context.uploadGoal} this period. Consistency compounds algorithmic favor and audience habit.`,
    whyItMatters:
      "Platforms reward regular publishing schedules. Creators who post consistently see 2–3× better retention over 90 days.",
    category: "Goals",
    priority: "Medium",
    estimatedImpact: "Steadier audience growth",
    confidenceScore: 74,
    actionLabel: "Plan your schedule",
    actionRoute: "/schedule",
  });
}

export function evaluateMomentumRule(context: CoachContext): Recommendation | null {
  if (context.scope !== "creator") return null;
  if (context.followersGrowth === null || context.followersGrowth <= 15) {
    return null;
  }

  return baseRecommendation({
    id: "goals-momentum-double-down",
    title: "Double down on what's working",
    description: `Your audience is growing at ${context.followersGrowth}% — well above average. Capitalize on this momentum before it plateaus.`,
    whyItMatters:
      "Growth spurts are windows to convert casual viewers into loyal followers and monetize through memberships or merch.",
    category: "Goals",
    priority: "High",
    estimatedImpact: "Accelerate growth phase",
    confidenceScore: 70,
    actionLabel: "Analyze performance",
    actionRoute: context.scopeId
      ? `/creators/${context.scopeId}`
      : "/creators",
    learnMoreRoute: "/portal/growth",
  });
}

export function evaluateScheduleRule(context: CoachContext): Recommendation | null {
  if (!context.streamScheduleMissing) return null;

  const label =
    context.scope === "creator"
      ? "Block streaming time on your calendar"
      : "Add today's schedule blocks";

  return baseRecommendation({
    id: "productivity-stream-schedule",
    title: label,
    description:
      context.scope === "creator"
        ? "You don't have recurring schedule blocks set up. A visible streaming schedule helps your audience show up and improves platform recommendations."
        : "No events are scheduled for today. Blocking time keeps your roster accountable and surfaces conflicts early.",
    whyItMatters:
      "Creators with predictable schedules retain 40% more returning viewers than those who stream sporadically.",
    category: "Productivity",
    priority: context.scope === "creator" ? "Medium" : "Low",
    estimatedImpact: "Better audience retention",
    confidenceScore: 85,
    actionLabel: "Open schedule",
    actionRoute: "/schedule",
  });
}

export function evaluateRevenueTrackingRule(
  context: CoachContext
): Recommendation | null {
  if (!context.noRevenueTracking) return null;

  return baseRecommendation({
    id: "business-revenue-tracking",
    title: "Start tracking your revenue",
    description:
      context.scope === "creator"
        ? "Connect a platform account or log revenue entries so you can see earnings trends and make informed business decisions."
        : "No platform revenue is connected across your roster. Link creator accounts to unlock earnings visibility and forecasting.",
    whyItMatters:
      "You can't optimize what you don't measure. Revenue tracking reveals which platforms and deal types drive the most income.",
    category: "Business",
    priority: "High",
    estimatedImpact: "Clearer financial picture",
    confidenceScore: 90,
    actionLabel:
      context.scope === "creator" ? "Connect platforms" : "View creators",
    actionRoute:
      context.scope === "creator" && context.scopeId
        ? `/creators/${context.scopeId}`
        : "/creators",
    learnMoreRoute: "/portal/account",
  });
}

export function evaluateOverdueDeliverablesRule(
  context: CoachContext
): Recommendation | null {
  if (context.scope !== "creator" || context.overdueDeliverables <= 0) {
    return null;
  }

  return {
    ...baseRecommendation({
      id: "sponsors-overdue-deliverables",
      title: "Clear overdue deliverables",
      description: `You have ${context.overdueDeliverables} overdue deliverable${context.overdueDeliverables === 1 ? "" : "s"}. Late deliverables risk contract renewals and future sponsor trust.`,
      whyItMatters:
        "Sponsors track fulfillment closely. On-time delivery is the strongest predictor of repeat deals.",
      category: "Sponsors",
      priority: "Critical",
      estimatedImpact: "Protect sponsor relationships",
      confidenceScore: 95,
      actionLabel: "View deliverables",
      actionRoute: "/portal/deliverables",
    }),
    dismissible: false,
  };
}

export function evaluatePlatformConnectionRule(
  context: CoachContext
): Recommendation | null {
  if (context.scope !== "creator" || context.connectedPlatformCount > 0) {
    return null;
  }

  return baseRecommendation({
    id: "branding-connect-platform",
    title: "Connect your primary platform",
    description: `Link your ${context.primaryPlatform ?? "main"} account to unlock performance insights and personalized coaching based on real content data.`,
    whyItMatters:
      "Connected accounts power analytics, revenue tracking, and AI recommendations tailored to your actual audience.",
    category: "Branding",
    priority: "High",
    estimatedImpact: "Unlock personalized insights",
    confidenceScore: 88,
    actionLabel: "Connect now",
    actionRoute: context.scopeId
      ? `/creators/${context.scopeId}`
      : "/creators",
  });
}

export function evaluateOpportunityApplicationsRule(
  context: CoachContext
): Recommendation | null {
  if (
    context.scope !== "creator" ||
    context.openOpportunities <= 0 ||
    context.pendingApplications > 0
  ) {
    return null;
  }

  return baseRecommendation({
    id: "networking-apply-opportunities",
    title: "Apply to open opportunities",
    description: `${context.openOpportunities} sponsorship opportunit${context.openOpportunities === 1 ? "y is" : "ies are"} open and you haven't submitted an application yet.`,
    whyItMatters:
      "Early applicants often get prioritized review. Even a tailored pitch to one opportunity can open your next deal.",
    category: "Networking",
    priority: "Medium",
    estimatedImpact: "New deal pipeline",
    confidenceScore: 72,
    actionLabel: "Browse opportunities",
    actionRoute: "/opportunities",
  });
}

export function evaluateUnreadMessagesRule(
  context: CoachContext
): Recommendation | null {
  if (context.unreadMessages <= 0) return null;

  return baseRecommendation({
    id: "community-unread-messages",
    title: "Respond to pending messages",
    description: `You have ${context.unreadMessages} unread message${context.unreadMessages === 1 ? "" : "s"}. Quick responses keep sponsor and team conversations moving.`,
    whyItMatters:
      "Response time affects deal velocity. Sponsors and managers prioritize creators who communicate reliably.",
    category: "Community",
    priority: context.unreadMessages >= 5 ? "High" : "Medium",
    estimatedImpact: "Faster deal cycles",
    confidenceScore: 80,
    actionLabel: "Open messages",
    actionRoute: "/messages",
  });
}

export function evaluateProfileReadinessRule(
  context: CoachContext
): Recommendation | null {
  if (
    context.scope !== "creator" ||
    context.profileReadinessScore >= 100
  ) {
    return null;
  }

  const incomplete = context.profileReadinessItems.find((item) => !item.done);
  if (!incomplete) return null;

  return baseRecommendation({
    id: "personal-development-profile",
    title: "Complete your creator profile",
    description: `Your profile is ${context.profileReadinessScore}% ready. Next step: ${incomplete.label.toLowerCase()}.`,
    whyItMatters:
      "Complete profiles rank higher in sponsor searches and give managers the context they need to pitch you effectively.",
    category: "Personal Development",
    priority: "Medium",
    estimatedImpact: "Better sponsor discovery",
    confidenceScore: 86,
    actionLabel: "Update profile",
    actionRoute: context.scopeId ? "/portal/profile" : "/portal",
  });
}

export function evaluateOrgRosterGrowthRule(
  context: CoachContext
): Recommendation | null {
  if (context.scope !== "organization") return null;
  if ((context.activeCreatorsCount ?? 0) >= 3) return null;

  return baseRecommendation({
    id: "business-grow-roster",
    title: "Expand your creator roster",
    description: `You have ${context.activeCreatorsCount ?? 0} active creator${(context.activeCreatorsCount ?? 0) === 1 ? "" : "s"}. Growing your roster diversifies revenue and sponsorship opportunities.`,
    whyItMatters:
      "Agencies with diverse rosters close more multi-creator deals and weather platform algorithm changes better.",
    category: "Business",
    priority: "Medium",
    estimatedImpact: "Revenue diversification",
    confidenceScore: 75,
    actionLabel: "Add creators",
    actionRoute: "/creators",
  });
}

export function evaluateOrgExpiringContractsRule(
  context: CoachContext
): Recommendation | null {
  if (context.scope !== "organization") return null;
  if ((context.expiringContractsCount ?? 0) <= 0) return null;

  return baseRecommendation({
    id: "revenue-expiring-contracts",
    title: "Review expiring contracts",
    description: `${context.expiringContractsCount} contract${(context.expiringContractsCount ?? 0) === 1 ? "" : "s"} expire within 45 days. Start renewal conversations now.`,
    whyItMatters:
      "Proactive renewals prevent revenue gaps and give sponsors time to adjust budgets.",
    category: "Revenue",
    priority: "High",
    estimatedImpact: "Protect recurring revenue",
    confidenceScore: 92,
    actionLabel: "View contracts",
    actionRoute: "/contracts?filter=expiring",
  });
}

export function evaluateOrgPendingApplicationsRule(
  context: CoachContext
): Recommendation | null {
  if (context.scope !== "organization") return null;
  if (context.pendingApplications <= 0) return null;

  return baseRecommendation({
    id: "productivity-review-applications",
    title: "Review pending applications",
    description: `${context.pendingApplications} creator application${context.pendingApplications === 1 ? "" : "s"} need your review.`,
    whyItMatters:
      "Fast application turnaround keeps top talent engaged and improves your agency's reputation with creators.",
    category: "Productivity",
    priority: "High",
    estimatedImpact: "Faster talent pipeline",
    confidenceScore: 84,
    actionLabel: "Review applications",
    actionRoute: "/opportunities/applications",
  });
}

export function evaluateGoalPersonalizedRule(
  context: CoachContext
): Recommendation | null {
  if (context.scope !== "creator") return null;

  const profile = context.coachProfile;
  if (!profile?.onboardingCompleted || !profile.primaryGoal) return null;

  const goal = profile.primaryGoal;
  const challenge = profile.biggestChallenge?.trim();

  if (goal === "consistency" && context.uploadsCompleted < context.uploadGoal) {
    const days =
      profile.targetPostingDays.length > 0
        ? profile.targetPostingDays.join(", ")
        : "your chosen days";
    return baseRecommendation({
      id: "goals-personalized-consistency",
      title: "Stick to your posting plan",
      description: challenge
        ? `You told us consistency is your focus${challenge ? ` — especially around "${challenge}"` : ""}. Aim for ${context.uploadGoal} uploads this period, targeting ${days}.`
        : `You set consistency as your top goal. Block time on ${days} and publish at least ${context.uploadGoal} pieces this period.`,
      whyItMatters:
        "Creators who publish on a predictable rhythm see stronger retention and algorithmic reach over 90 days.",
      category: "Goals",
      priority: "High",
      estimatedImpact: "Stronger weekly momentum",
      confidenceScore: 86,
      actionLabel: "Open schedule",
      actionRoute: "/schedule",
    });
  }

  if (goal === "monetization" && context.noRevenueTracking) {
    return baseRecommendation({
      id: "goals-personalized-monetization",
      title: "Map your monetization paths",
      description:
        profile.monetizationInterests.length > 0
          ? `You're focused on monetization (${profile.monetizationInterests.slice(0, 2).join(", ")}). Connect platforms or log revenue so we can track what's working.`
          : "Connect platforms or log revenue entries to see which income streams are gaining traction.",
      whyItMatters:
        "Clear revenue data helps you double down on the channels that actually pay off.",
      category: "Monetization",
      priority: "High",
      estimatedImpact: "Clearer income picture",
      confidenceScore: 84,
      actionLabel: "Connect platforms",
      actionRoute: context.scopeId
        ? `/creators/${context.scopeId}`
        : "/portal/account",
    });
  }

  if (goal === "sponsorship" && context.sponsorDeals === 0) {
    return baseRecommendation({
      id: "goals-personalized-sponsorship",
      title: "Build your sponsor-ready package",
      description: challenge
        ? `Your goal is landing sponsorships. Start by polishing your profile and applying to open opportunities${challenge ? ` while you work on: ${challenge}` : ""}.`
        : "Sponsors look for complete profiles and proven engagement. Update your creator profile and browse open deals.",
      whyItMatters:
        "A sponsor-ready profile plus active applications is the fastest path to your first brand deal.",
      category: "Sponsors",
      priority: "High",
      estimatedImpact: "Faster sponsor pipeline",
      confidenceScore: 82,
      actionLabel: "Browse opportunities",
      actionRoute: "/opportunities",
    });
  }

  if (
    goal === "growth" &&
    profile.contentFocus.some((focus) =>
      focus.toLowerCase().includes("short-form")
    ) &&
    context.clipsCreated < 5
  ) {
    return baseRecommendation({
      id: "goals-personalized-growth-clips",
      title: "Scale your short-form output",
      description:
        "You said short-form clips are a focus. Repurpose stream or long-form highlights into clips to reach new audiences.",
      whyItMatters:
        "Short-form discovery often outpaces live-only growth on TikTok, YouTube Shorts, and Reels.",
      category: "Content",
      priority: "Medium",
      estimatedImpact: "Broader top-of-funnel reach",
      confidenceScore: 80,
      actionLabel: "Review content",
      actionRoute: context.scopeId
        ? `/creators/${context.scopeId}`
        : "/portal/growth",
    });
  }

  if (goal === "brand" && context.profileReadinessScore < 100) {
    return baseRecommendation({
      id: "goals-personalized-brand",
      title: "Sharpen your creator positioning",
      description:
        "Building your brand starts with a complete profile — bio, platforms, and portfolio pieces sponsors can evaluate quickly.",
      whyItMatters:
        "Strong positioning makes you memorable to sponsors and helps your content feel cohesive across platforms.",
      category: "Branding",
      priority: "Medium",
      estimatedImpact: "Better sponsor discovery",
      confidenceScore: 78,
      actionLabel: "Update profile",
      actionRoute: "/settings",
    });
  }

  return null;
}

export function evaluateOrgPlatformConnectionsRule(
  context: CoachContext
): Recommendation | null {
  if (context.scope !== "organization") return null;
  if (context.connectedPlatformCount > 0) return null;

  return baseRecommendation({
    id: "analytics-connect-platforms",
    title: "Connect creator platform accounts",
    description:
      "No platform accounts are linked yet. Connecting accounts unlocks revenue tracking and performance analytics across your roster.",
    whyItMatters:
      "Platform data powers accurate reporting for sponsors and helps you identify which creators are ready for bigger deals.",
    category: "Analytics",
    priority: "High",
    estimatedImpact: "Data-driven decisions",
    confidenceScore: 88,
    actionLabel: "Manage creators",
    actionRoute: "/creators",
  });
}
