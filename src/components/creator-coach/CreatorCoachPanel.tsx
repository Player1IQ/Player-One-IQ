"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCoachGreeting } from "@/lib/i18n/coach-text";
import type { CoachContext, CreatorCoachSnapshot } from "@/lib/creator-coach/types";
import type { CoachProfile } from "@/lib/creator-coach/profile-types";
import {
  getLocalCompletedRecommendations,
  getLocalDismissedRecommendations,
  getLocalMissionState,
} from "@/lib/creator-coach/client-state";
import { syncCreatorSeasonFromCoachAction } from "@/lib/creator-seasons/season-coach-actions";
import { RecommendationCard } from "./RecommendationCard";
import { CoachActivationCard } from "./CoachActivationCard";
import { CoachOnboardingModal } from "./CoachOnboardingModal";
import { SectorHeader } from "@/components/dashboard/SectorHeader";

interface CreatorCoachPanelProps {
  snapshot: CreatorCoachSnapshot;
  coachContext: CoachContext;
  coachProfile?: CoachProfile | null;
  creatorId?: string | null;
  showSectionHeader?: boolean;
}

export function CreatorCoachPanel({
  snapshot,
  coachContext,
  coachProfile = null,
  creatorId = null,
  showSectionHeader = true,
}: CreatorCoachPanelProps) {
  const t = useTranslations("coach.panel");
  const greeting = useCoachGreeting(snapshot.displayName);
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

  useEffect(() => {
    if (!creatorId || coachContext.scope !== "creator" || snapshot.stateId) return;

    const localMission = getLocalMissionState(
      coachContext.scope,
      coachContext.scopeId,
      snapshot.mission.id
    );
    const localCompleted = getLocalCompletedRecommendations(
      coachContext.scope,
      coachContext.scopeId
    );

    if (!localMission && localCompleted.length === 0) return;

    void syncCreatorSeasonFromCoachAction(creatorId, {
      mission: localMission,
      completedRecommendationIds: localCompleted,
    }).then((result) => {
      if (result.xpAwarded > 0) router.refresh();
    });
  }, [
    creatorId,
    coachContext.scope,
    coachContext.scopeId,
    snapshot.stateId,
    snapshot.mission.id,
    router,
  ]);

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

      {showSectionHeader ? (
        <SectorHeader
          sector="Coach"
          title={t("sectorTitle")}
          description={
            coachProfile?.onboardingCompleted
              ? t("descriptionPersonalized", { greeting })
              : t("descriptionDefault", { greeting })
          }
        />
      ) : null}

      <div className="space-y-4">
        {visibleRecommendations.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-surface-raised/50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-gray-300">
              {t("allCaughtUp")}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {t("noRecommendations")}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleRecommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                stateId={snapshot.stateId}
                coachContext={coachContext}
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
        )}
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
