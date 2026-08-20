"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { CoachContext, CreatorCoachSnapshot } from "@/lib/creator-coach/types";
import type { CoachProfile } from "@/lib/creator-coach/profile-types";
import {
  getLocalCompletedRecommendations,
  getLocalDismissedRecommendations,
} from "@/lib/creator-coach/client-state";
import { CoachActivationCard } from "@/components/creator-coach/CoachActivationCard";
import { CoachOnboardingModal } from "@/components/creator-coach/CoachOnboardingModal";
import { RecommendationCard } from "@/components/creator-coach/RecommendationCard";
import { TodaysMissionCard } from "@/components/creator-coach/TodaysMissionCard";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { CreatorAiChat } from "./CreatorAiChat";
import type { CreatorAiConversation } from "@/lib/creator-ai/types";

interface PortalCoachLayoutProps {
  snapshot: CreatorCoachSnapshot;
  coachContext: CoachContext;
  coachProfile: CoachProfile | null;
  creatorId: string;
  hasAiCoachChat: boolean;
  initialConversations: CreatorAiConversation[];
}

export function PortalCoachLayout({
  snapshot,
  coachContext,
  coachProfile,
  creatorId,
  hasAiCoachChat,
  initialConversations,
}: PortalCoachLayoutProps) {
  const t = useTranslations("coach.layout");
  const tPanel = useTranslations("coach.panel");
  const router = useRouter();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [localDismissed, setLocalDismissed] = useState<string[]>([]);
  const [localCompleted, setLocalCompleted] = useState<string[]>([]);

  const showPersonalizationPrompt =
    coachContext.scope === "creator" && !coachProfile?.onboardingCompleted;

  useEffect(() => {
    if (snapshot.stateId) return;
    setLocalDismissed(
      getLocalDismissedRecommendations(coachContext.scope, coachContext.scopeId)
    );
    setLocalCompleted(
      getLocalCompletedRecommendations(coachContext.scope, coachContext.scopeId)
    );
  }, [snapshot.stateId, coachContext.scope, coachContext.scopeId]);

  const visibleRecommendations = useMemo(() => {
    if (snapshot.stateId) return snapshot.recommendations;

    const dismissed = new Set(localDismissed);
    const completed = new Set(localCompleted);
    return snapshot.recommendations.filter(
      (recommendation) =>
        !dismissed.has(recommendation.id) && !completed.has(recommendation.id)
    );
  }, [
    snapshot.recommendations,
    snapshot.stateId,
    localDismissed,
    localCompleted,
  ]);

  const sidebarRecommendations = visibleRecommendations.slice(0, 3);

  function handleSnapshotUpdate() {
    router.refresh();
  }

  function handleOnboardingComplete() {
    setOnboardingOpen(false);
    router.refresh();
  }

  return (
    <section className="space-y-6" data-tour-spot="creator-coach">
      {showPersonalizationPrompt ? (
        <CoachActivationCard onActivate={() => setOnboardingOpen(true)} />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)]">
        <div className="min-h-[32rem]">
          {hasAiCoachChat ? (
            <CreatorAiChat
              enabled={hasAiCoachChat}
              initialConversations={initialConversations}
            />
          ) : (
            <div className="space-y-4">
              <UpgradePrompt
                featureLabel="AI Creator Coach chat"
                message="AI Creator Coach chat is not enabled for your organization yet. Ask your agency administrator to enable it, or upgrade your workspace plan."
                upgradeHref="/portal/account"
                upgradeLabel="Go to account"
              />
              <div className="rounded-2xl border border-dashed border-white/[0.08] bg-surface-raised/40 px-6 py-16 text-center">
                <p className="text-sm text-gray-400">
                  {t("missionSidebarNote")}
                </p>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <TodaysMissionCard
            displayName={snapshot.displayName}
            mission={snapshot.mission}
            progressPercent={snapshot.progressPercent}
            stateId={snapshot.stateId}
            coachContext={coachContext}
            onSnapshotUpdate={handleSnapshotUpdate}
          />

          {sidebarRecommendations.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {t("topRecommendations")}
              </p>
              {sidebarRecommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  stateId={snapshot.stateId}
                  coachContext={coachContext}
                  compact
                  onSnapshotUpdate={handleSnapshotUpdate}
                  onLocalDismiss={(id) =>
                    setLocalDismissed((current) => [...current, id])
                  }
                  onLocalComplete={(id) =>
                    setLocalCompleted((current) => [...current, id])
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-surface-raised/50 px-4 py-6 text-center">
              <p className="text-sm font-medium text-gray-300">
                {tPanel("allCaughtUp")}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {t("sidebarCaughtUp")}
              </p>
            </div>
          )}
        </aside>
      </div>

      <CoachOnboardingModal
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        creatorId={creatorId}
        onComplete={handleOnboardingComplete}
      />
    </section>
  );
}
